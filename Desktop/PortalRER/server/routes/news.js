const express = require("express");
const multer = require("multer");

const supabase = require("../config/supabase");
const verifyToken = require("../middleware/auth");

const router = express.Router();

const upload = multer({

    storage: multer.memoryStorage(),

    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    }

});


function requireAdmin(req, res, next) {

    if (!req.userRol || req.userRol.toLowerCase() !== "admin") {

        return res.status(403).json({
            error: "No tienes permisos de administrador."
        });

    }

    next();

}


/* ==========================
   GET /api/news
   Lista todas las noticias, la más nueva primero (público)
========================== */

router.get("/", async (req, res) => {

    try {

        const { data, error } = await supabase
            .from("news")
            .select(`
                id,
                titulo,
                contenido,
                imagen_url,
                created_at,
                users (
                    id,
                    nombre
                )
            `)
            .order("created_at", { ascending: false });

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        res.json(data);

    } catch (error) {

        res.status(500).json({ error: error.message });

    }

});


/* ==========================
   POST /api/news
   Publicar noticia, con o sin imagen (solo admin)
========================== */

router.post("/", verifyToken, requireAdmin, upload.single("imagen"), async (req, res) => {

    try {

        const { titulo, contenido } = req.body;

        if (!titulo || !titulo.trim()) {

            return res.status(400).json({ error: "La noticia necesita un título." });

        }

        let imagenUrl = null;

        if (req.file) {

            const tiposPermitidos = ["image/png", "image/jpeg", "image/webp"];

            if (!tiposPermitidos.includes(req.file.mimetype)) {

                return res.status(400).json({ error: "Formato de imagen no soportado. Usa PNG, JPG o WEBP." });

            }

            const extension = req.file.mimetype === "image/png" ? "png"
                : req.file.mimetype === "image/webp" ? "webp"
                : "jpg";

            const nombreArchivo = `${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;

            const { error: uploadError } = await supabase
                .storage
                .from("news-images")
                .upload(nombreArchivo, req.file.buffer, {
                    contentType: req.file.mimetype
                });

            if (uploadError) {
                return res.status(500).json({ error: uploadError.message });
            }

            const { data: urlData } = supabase
                .storage
                .from("news-images")
                .getPublicUrl(nombreArchivo);

            imagenUrl = urlData.publicUrl;

        }

        const { data, error } = await supabase
            .from("news")
            .insert([{

                autor_id: req.userId,
                titulo: titulo.trim(),
                contenido: (contenido || "").trim(),
                imagen_url: imagenUrl

            }])
            .select()
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
   DELETE /api/news/:id
   Borrar noticia (solo admin)
========================== */

router.delete("/:id", verifyToken, requireAdmin, async (req, res) => {

    try {

        const { error } = await supabase
            .from("news")
            .delete()
            .eq("id", req.params.id);

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        res.json({ message: "Noticia eliminada." });

    } catch (error) {

        res.status(500).json({ error: error.message });

    }

});


module.exports = router;
