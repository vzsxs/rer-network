const express = require("express");
const multer = require("multer");
 
const supabase = require("../config/supabase");
const verifyToken = require("../middleware/auth");
 
const router = express.Router();
 
// Guardamos el archivo en memoria (no en disco) para subirlo directo a Supabase
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB máximo
    }
});
 
 
/* ==========================
   GET /api/users
   Listar TODOS los usuarios (para la página de Miembros)
========================== */
 
router.get("/", async (req, res) => {
 
    try {
 
        const { data: usuarios, error } = await supabase
            .from("users")
            .select("id, nombre, avatar_url")
            .order("nombre");
 
        if (error) {
            return res.status(500).json({ error: error.message });
        }
 
        // Le agregamos su grupo/rango a cada uno
 
        const { data: memberships } = await supabase
            .from("group_members")
            .select(`
                user_id,
                rango,
                groups (
                    nombre
                )
            `);
 
        const mapaMemberships = {};
 
        if (memberships) {
            for (const m of memberships) {
                mapaMemberships[m.user_id] = {
                    grupo: m.groups ? m.groups.nombre : null,
                    rango: m.rango
                };
            }
        }
 
        const usuariosConGrupo = usuarios.map(u => ({
            ...u,
            grupo: mapaMemberships[u.id]?.grupo || null,
            rango: mapaMemberships[u.id]?.rango || null
        }));
 
        res.json(usuariosConGrupo);
 
    } catch (error) {
 
        res.status(500).json({ error: error.message });
 
    }
 
});
 
 
/* ==========================
   GET /api/users/:id
   Ver el perfil PÚBLICO de cualquier usuario
========================== */
 
router.get("/:id", async (req, res) => {
 
    try {
 
        const { id } = req.params;
 
        const { data: usuario, error } = await supabase
            .from("users")
            .select("id, nombre, rol, avatar_url, descripcion")
            .eq("id", id)
            .maybeSingle();
 
        if (error) {
            return res.status(500).json({ error: error.message });
        }
 
        if (!usuario) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }
 
        // De paso, le agregamos su grupo/rango si tiene
 
        const { data: membership } = await supabase
            .from("group_members")
            .select(`
                rango,
                groups (
                    nombre,
                    slug,
                    icono
                )
            `)
            .eq("user_id", id)
            .maybeSingle();
 
        res.json({
            ...usuario,
            grupo: membership && membership.groups ? membership.groups.nombre : null,
            grupoIcono: membership && membership.groups ? membership.groups.icono : null,
            rango: membership ? membership.rango : null
        });
 
    } catch (error) {
 
        res.status(500).json({ error: error.message });
 
    }
 
});
 
 
/* ==========================
   PUT /api/users/me
   Actualizar tu propia descripción
========================== */
 
router.put("/me", verifyToken, async (req, res) => {
 
    try {
 
        const { descripcion } = req.body;
 
        if (typeof descripcion !== "string") {
            return res.status(400).json({ error: "Descripción inválida" });
        }
 
        if (descripcion.length > 300) {
            return res.status(400).json({ error: "La descripción no puede superar 300 caracteres" });
        }
 
        const { data, error } = await supabase
            .from("users")
            .update({ descripcion })
            .eq("id", req.userId)
            .select("id, nombre, descripcion, avatar_url")
            .single();
 
        if (error) {
            return res.status(500).json({ error: error.message });
        }
 
        res.json(data);
 
    } catch (error) {
 
        res.status(500).json({ error: error.message });
 
    }
 
});
 
 
/* ==========================
   POST /api/users/me/avatar
   Subir/cambiar tu foto de perfil
   (el cliente ya la manda recortada cuadrada, ej. 256x256)
========================== */
 
router.post("/me/avatar", verifyToken, upload.single("avatar"), async (req, res) => {
 
    try {
 
        if (!req.file) {
            return res.status(400).json({ error: "No se envió ninguna imagen" });
        }
 
        const tiposPermitidos = ["image/png", "image/jpeg", "image/webp"];
 
        if (!tiposPermitidos.includes(req.file.mimetype)) {
            return res.status(400).json({ error: "Formato no soportado. Usa PNG, JPG o WEBP." });
        }
 
        const extension = req.file.mimetype === "image/png" ? "png"
            : req.file.mimetype === "image/webp" ? "webp"
            : "jpg";
 
        const nombreArchivo = `${req.userId}.${extension}`;
 
        // Subimos a Supabase Storage, sobreescribiendo si ya existe (upsert)
 
        const { error: uploadError } = await supabase
            .storage
            .from("avatars")
            .upload(nombreArchivo, req.file.buffer, {
                contentType: req.file.mimetype,
                upsert: true
            });
 
        if (uploadError) {
            return res.status(500).json({ error: uploadError.message });
        }
 
        const { data: urlData } = supabase
            .storage
            .from("avatars")
            .getPublicUrl(nombreArchivo);
 
        // Le agregamos un timestamp al final para "romper" el caché del navegador
        // cada vez que cambie la foto
 
        const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;
 
        const { data, error } = await supabase
            .from("users")
            .update({ avatar_url: avatarUrl })
            .eq("id", req.userId)
            .select("id, nombre, avatar_url")
            .single();
 
        if (error) {
            return res.status(500).json({ error: error.message });
        }
 
        res.json(data);
 
    } catch (error) {
 
        res.status(500).json({ error: error.message });
 
    }
 
});
 
 
module.exports = router;
 
