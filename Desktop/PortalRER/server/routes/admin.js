const express = require("express");
const router = express.Router();

const supabase = require("../config/supabase");
const verifyToken = require("../middleware/auth");


// ==========================
// SOLO ADMINS pueden pasar de aquí
// (se usa después de verifyToken, que ya puso req.userRol)
// ==========================

function requireAdmin(req, res, next) {

    if (!req.userRol || req.userRol.toLowerCase() !== "admin") {

        return res.status(403).json({
            error: "No tienes permisos de administrador."
        });

    }

    next();

}


// A partir de aquí, TODAS las rutas de este archivo exigen ser admin

router.use(verifyToken, requireAdmin);


// ==========================
// VER SOLICITUDES PENDIENTES
// ==========================

router.get("/requests", async (req, res) => {

    try {

        const { data, error } = await supabase
            .from("group_requests")
            .select(`
                id,
                estado,
                created_at,
                users(
                    id,
                    nombre,
                    email
                ),
                groups(
                    id,
                    nombre
                )
            `)
            .eq("estado", "pendiente");

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        res.json(data);

    } catch (error) {

        res.status(500).json({ error: error.message });

    }

});


// ==========================
// OBTENER MIEMBROS DE UN GRUPO
// ==========================

router.get("/members/:groupId", async (req, res) => {

    try {

        const groupId = req.params.groupId;

        const { data, error } = await supabase
            .from("group_members")
            .select(`
                id,
                rango,
                users(
                    id,
                    nombre,
                    email
                )
            `)
            .eq("group_id", groupId);

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        res.json(data);

    } catch (error) {

        res.status(500).json({ error: error.message });

    }

});


// ==========================
// OBTENER RANGOS DE UN GRUPO
// ==========================

router.get("/ranks/:groupId", async (req, res) => {

    try {

        const groupId = req.params.groupId;

        const { data, error } = await supabase
            .from("group_ranks")
            .select("*")
            .eq("group_id", groupId)
            .order("nivel", { ascending: true });

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        res.json(data);

    } catch (error) {

        res.status(500).json({ error: error.message });

    }

});


// ==========================
// ACEPTAR SOLICITUD
// ==========================

router.put("/requests/:id/accept", async (req, res) => {

    try {

        const id = req.params.id;

        const { data: solicitud, error } = await supabase
            .from("group_requests")
            .select("*")
            .eq("id", id)
            .single();

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        const { data: primerRango, error: rangoError } = await supabase
            .from("group_ranks")
            .select("nombre")
            .eq("group_id", solicitud.group_id)
            .order("nivel", { ascending: true })
            .limit(1)
            .single();

        if (rangoError) {
            return res.status(500).json({ error: "Este grupo no tiene rangos configurados." });
        }

        const { error: updateError } = await supabase
            .from("group_requests")
            .update({ estado: "aceptado" })
            .eq("id", id);

        if (updateError) {
            return res.status(500).json({ error: updateError.message });
        }

        const { error: memberError } = await supabase
            .from("group_members")
            .insert([{
                user_id: solicitud.user_id,
                group_id: solicitud.group_id,
                rango: primerRango.nombre
            }]);

        if (memberError) {
            return res.status(500).json({ error: memberError.message });
        }

        res.json({
            message: "Usuario aceptado correctamente.",
            rango: primerRango.nombre
        });

    } catch (error) {

        res.status(500).json({ error: error.message });

    }

});


// ==========================
// DENEGAR SOLICITUD
// ==========================

router.put("/requests/:id/deny", async (req, res) => {

    try {

        const id = req.params.id;

        const { error } = await supabase
            .from("group_requests")
            .update({ estado: "rechazado" })
            .eq("id", id);

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        res.json({ message: "Solicitud rechazada." });

    } catch (error) {

        res.status(500).json({ error: error.message });

    }

});


// ==========================
// CAMBIAR RANGO DE UN MIEMBRO
// ==========================

router.put("/member/:memberId/rank", async (req, res) => {

    try {

        const memberId = req.params.memberId;
        const { rango } = req.body;

        if (!rango) {
            return res.status(400).json({ error: "Debe enviar un rango." });
        }

        const { error } = await supabase
            .from("group_members")
            .update({ rango: rango })
            .eq("id", memberId);

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        res.json({ message: "Rango actualizado correctamente." });

    } catch (error) {

        res.status(500).json({ error: error.message });

    }

});


// ==========================
// VER ANUNCIOS DE UN GRUPO (por groupId, para el panel admin)
// ==========================

router.get("/announcements/:groupId", async (req, res) => {

    try {

        const { data, error } = await supabase
            .from("group_announcements")
            .select("id, titulo, contenido, created_at")
            .eq("group_id", req.params.groupId)
            .order("created_at", { ascending: false });

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        res.json(data);

    } catch (error) {

        res.status(500).json({ error: error.message });

    }

});


// ==========================
// PUBLICAR ANUNCIO EN UN GRUPO
// ==========================

router.post("/announcements/:groupId", async (req, res) => {

    try {

        const groupId = req.params.groupId;
        const { titulo, contenido } = req.body;

        if (!titulo || !titulo.trim()) {
            return res.status(400).json({ error: "El anuncio necesita un título." });
        }

        const { data, error } = await supabase
            .from("group_announcements")
            .insert([{
                group_id: groupId,
                autor_id: req.userId,
                titulo: titulo.trim(),
                contenido: (contenido || "").trim()
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


// ==========================
// BORRAR ANUNCIO
// ==========================

router.delete("/announcements/:id", async (req, res) => {

    try {

        const { error } = await supabase
            .from("group_announcements")
            .delete()
            .eq("id", req.params.id);

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        res.json({ message: "Anuncio eliminado." });

    } catch (error) {

        res.status(500).json({ error: error.message });

    }

});


// ==========================
// EDITAR REGLAMENTO DE UN GRUPO
// ==========================

router.put("/groups/:groupId/reglamento", async (req, res) => {

    try {

        const groupId = req.params.groupId;
        const { reglamento } = req.body;

        if (typeof reglamento !== "string") {
            return res.status(400).json({ error: "Reglamento inválido." });
        }

        const { data, error } = await supabase
            .from("groups")
            .update({ reglamento })
            .eq("id", groupId)
            .select("id, nombre, reglamento")
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
