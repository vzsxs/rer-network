const express = require("express");
const router = express.Router();

const supabase = require("../config/supabase");

console.log("🔥 GROUPS ROUTE CARGADA");


/* ==========================
   OBTENER TODOS LOS GRUPOS
========================== */

router.get("/", async (req, res) => {

    try {

        const { data, error } = await supabase
            .from("groups")
            .select("*")
            .order("nombre");


        if (error) {

            return res.status(500).json({
                error: error.message
            });

        }


        res.json(data);

    } catch (err) {

        res.status(500).json({
            error: err.message
        });

    }

});




/* ==========================
   OBTENER MIEMBROS DEL GRUPO
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
                    email
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
   OBTENER GRUPO POR SLUG
========================== */

router.get("/:slug", async (req, res) => {

    try {

        const slug = req.params.slug;


        const { data, error } = await supabase
            .from("groups")
            .select("*")
            .eq("slug", slug)
            .single();



        if (error) {

            return res.status(404).json({
                error: "Grupo no encontrado"
            });

        }



        res.json(data);



    } catch (err) {

        res.status(500).json({
            error: err.message
        });

    }

});


module.exports = router;