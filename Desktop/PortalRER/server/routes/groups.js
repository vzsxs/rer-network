const express = require("express");
const router = express.Router();

const supabase = require("../config/supabase");
const verifyToken = require("../middleware/auth");

console.log("🔥 GROUPS ROUTE CARGADA");


/* ==========================
   OBTENER TODOS LOS GRUPOS
   (con conteo real de miembros)
========================== */

router.get("/", async (req, res) => {

    try {

        const { data: grupos, error } = await supabase
            .from("groups")
            .select("*")
            .order("nombre");


        if (error) {

            return res.status(500).json({
                error: error.message
            });

        }


        // Traemos TODAS las membresías de una sola vez
        // y contamos cuántas hay por grupo

        const { data: miembros, error: miembrosError } = await supabase
            .from("group_members")
            .select("group_id");


        if (miembrosError) {

            return res.status(500).json({
                error: miembrosError.message
            });

        }


        const conteos = {};

        for (const m of miembros) {
            conteos[m.group_id] = (conteos[m.group_id] || 0) + 1;
        }


        const gruposConConteo = grupos.map(grupo => ({
            ...grupo,
            miembros: conteos[grupo.id] || 0
        }));


        res.json(gruposConConteo);

    } catch (err) {

        res.status(500).json({
            error: err.message
        });

    }

});




/* ==========================
   OBTENER MIEMBROS DEL GRUPO
   (con foto de perfil, para mostrar los avatares apilados)
========================== */

router.get("/:slug/members", async (req, res) => {

    try {

        const slug = req.params.slug;


        const { data: grupo, error: grupoError } = await supabase
            .from("groups")
            .select("id")
            .eq("slug", slug)
            .single();


        if (grupoError || !grupo) {

            return res.status(404).json({
                error: "Grupo no encontrado"
            });

        }



        const { data: miembros, error: miembrosError } = await supabase
            .from("group_members")
            .select(`
                rango,
                users(
                    id,
                    nombre,
                    email,
                    avatar_url
                )
            `)
            .eq("group_id", grupo.id);


        if (miembrosError) {

            return res.status(500).json({
                error: miembrosError.message
            });

        }


        res.json(miembros);

    } catch (err) {

        res.status(500).json({
            error: err.message
        });

    }

});




/* ==========================
   ANUNCIOS DEL GRUPO
========================== */

router.get("/:slug/announcements", async (req, res) => {

    try {

        const slug = req.params.slug;

        const { data: grupo, error: grupoError } = await supabase
            .from("groups")
            .select("id")
            .eq("slug", slug)
            .single();

        if (grupoError || !grupo) {
            return res.status(404).json({ error: "Grupo no encontrado" });
        }

        const { data, error } = await supabase
            .from("group_announcements")
            .select(`
                id,
                titulo,
                contenido,
                created_at,
                users (
                    id,
                    nombre
                )
            `)
            .eq("group_id", grupo.id)
            .order("created_at", { ascending: false });

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        res.json(data);

    } catch (err) {

        res.status(500).json({ error: err.message });

    }

});


/* ==========================
   EQUIPAMIENTO DEL GRUPO
========================== */

router.get("/:slug/equipment", async (req, res) => {

    try {

        const slug = req.params.slug;

        const { data: grupo, error: grupoError } = await supabase
            .from("groups")
            .select("id")
            .eq("slug", slug)
            .single();

        if (grupoError || !grupo) {
            return res.status(404).json({ error: "Grupo no encontrado" });
        }

        const { data, error } = await supabase
            .from("group_equipment")
            .select("*")
            .eq("group_id", grupo.id)
            .order("created_at");

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        res.json(data);

    } catch (err) {

        res.status(500).json({ error: err.message });

    }

});


/* ==========================
   MI MEMBRESÍA EN ESTE GRUPO
   (rango, desde cuándo, si soy miembro)
========================== */

router.get("/:slug/me", verifyToken, async (req, res) => {

    try {

        const slug = req.params.slug;

        const { data: grupo, error: grupoError } = await supabase
            .from("groups")
            .select("id")
            .eq("slug", slug)
            .single();

        if (grupoError || !grupo) {
            return res.status(404).json({ error: "Grupo no encontrado" });
        }

        const { data: membership, error } = await supabase
            .from("group_members")
            .select("rango, created_at")
            .eq("group_id", grupo.id)
            .eq("user_id", req.userId)
            .maybeSingle();

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        if (membership) {

            return res.json({
                esMiembro: true,
                rango: membership.rango,
                desde: membership.created_at,
                solicitudPendiente: false
            });

        }

        // No es miembro, ¿tiene solicitud pendiente a este grupo?

        const { data: solicitud } = await supabase
            .from("group_requests")
            .select("id")
            .eq("group_id", grupo.id)
            .eq("user_id", req.userId)
            .eq("estado", "pendiente")
            .maybeSingle();

        res.json({
            esMiembro: false,
            rango: null,
            desde: null,
            solicitudPendiente: !!solicitud
        });

    } catch (err) {

        res.status(500).json({ error: err.message });

    }

});


/* ==========================
   SALIR DEL GRUPO
========================== */

router.delete("/:slug/leave", verifyToken, async (req, res) => {

    try {

        const slug = req.params.slug;

        const { data: grupo, error: grupoError } = await supabase
            .from("groups")
            .select("id")
            .eq("slug", slug)
            .single();

        if (grupoError || !grupo) {
            return res.status(404).json({ error: "Grupo no encontrado" });
        }

        const { error } = await supabase
            .from("group_members")
            .delete()
            .eq("group_id", grupo.id)
            .eq("user_id", req.userId);

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        res.json({ message: "Saliste del grupo correctamente" });

    } catch (err) {

        res.status(500).json({ error: err.message });

    }

});




/* ==========================
   OBTENER GRUPO POR SLUG
   (con conteo real de miembros)
========================== */

router.get("/:slug", async (req, res) => {

    try {

        const slug = req.params.slug;


        const { data: grupo, error } = await supabase
            .from("groups")
            .select("*")
            .eq("slug", slug)
            .single();



        if (error) {

            return res.status(404).json({
                error: "Grupo no encontrado"
            });

        }


        const { count, error: countError } = await supabase
            .from("group_members")
            .select("id", { count: "exact", head: true })
            .eq("group_id", grupo.id);


        if (countError) {

            return res.status(500).json({
                error: countError.message
            });

        }


        res.json({
            ...grupo,
            miembros: count || 0
        });



    } catch (err) {

        res.status(500).json({
            error: err.message
        });

    }

});


module.exports = router;
