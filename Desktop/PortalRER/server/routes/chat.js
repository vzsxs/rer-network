const express = require("express");
const router = express.Router();

const supabase = require("../config/supabase");
const verifyToken = require("../middleware/auth");


/* ==========================
   GET /api/chat/mensajes
   Trae los últimos 50 mensajes, del más viejo al más nuevo
========================== */

router.get("/mensajes", async (req, res) => {

    try {

        const { data: mensajes, error } = await supabase
            .from("chat_messages")
            .select(`
                id,
                mensaje,
                created_at,
                users (
                    id,
                    nombre,
                    avatar_url
                )
            `)
            .order("created_at", { ascending: false })
            .limit(50);

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        // Los invertimos para que queden del más viejo al más nuevo (orden de lectura normal)
        res.json(mensajes.reverse());

    } catch (error) {

        res.status(500).json({ error: error.message });

    }

});


/* ==========================
   POST /api/chat/mensajes
   Enviar un mensaje nuevo (requiere sesión)
========================== */

router.post("/mensajes", verifyToken, async (req, res) => {

    try {

        const { mensaje } = req.body;

        if (!mensaje || !mensaje.trim()) {
            return res.status(400).json({ error: "El mensaje no puede estar vacío" });
        }

        if (mensaje.length > 500) {
            return res.status(400).json({ error: "El mensaje no puede superar 500 caracteres" });
        }

        const { data, error } = await supabase
            .from("chat_messages")
            .insert([{
                user_id: req.userId,
                mensaje: mensaje.trim()
            }])
            .select(`
                id,
                mensaje,
                created_at,
                users (
                    id,
                    nombre,
                    avatar_url
                )
            `)
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
