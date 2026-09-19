const express = require("express");
const axios = require("axios");

const supabase = require("../config/supabase");
const verifyToken = require("../middleware/auth");

const router = express.Router();

/* ==========================
   Extraer UserId de un link de perfil de Roblox
   Soporta: https://www.roblox.com/users/123456789/profile
            https://www.roblox.com/es/users/123456789/profile-nombre
========================== */

function extractRobloxId(profileLink) {
    const match = profileLink.match(/users\/(\d+)/);
    return match ? match[1] : null;
}

/* ==========================
   POST /api/roblox/link
   El usuario logueado vincula su cuenta de Roblox
========================== */

router.post("/link", verifyToken, async (req, res) => {

    try {

        const { profileLink } = req.body;

        if (!profileLink) {
            return res.status(400).json({ error: "Falta el enlace de perfil." });
        }

        const robloxId = extractRobloxId(profileLink);

        if (!robloxId) {
            return res.status(400).json({ error: "El enlace no es válido." });
        }

        let robloxName;

        try {

            const { data: robloxData } = await axios.get(
                `https://users.roblox.com/v1/users/${robloxId}`
            );

            robloxName = robloxData.name;

        } catch (err) {

            return res.status(400).json({ error: "No se encontró esa cuenta en Roblox." });

        }

        const { data: existente, error: buscarError } = await supabase
            .from("roblox_verifications")
            .select("id")
            .eq("user_id", req.userId)
            .maybeSingle();

        if (buscarError) {
            return res.status(500).json({ error: buscarError.message });
        }

        if (existente) {

            const { error } = await supabase
                .from("roblox_verifications")
                .update({
                    roblox_id: robloxId,
                    roblox_username: robloxName,
                    verified: true
                })
                .eq("id", existente.id);

            if (error) {
                return res.status(500).json({ error: error.message });
            }

        } else {

            const { error } = await supabase
                .from("roblox_verifications")
                .insert([{
                    user_id: req.userId,
                    roblox_id: robloxId,
                    roblox_username: robloxName,
                    verified: true
                }]);

            if (error) {
                return res.status(500).json({ error: error.message });
            }

        }

        res.json({ robloxName });

    } catch (error) {

        console.error(error);
        res.status(500).json({ error: "No se pudo vincular la cuenta." });

    }

});

/* ==========================
   GET /api/roblox/profile/:robloxId
   La consultan AMBOS scripts de Roblox (el de uniformes y el de la etiqueta).
   Formato de respuesta pensado para servir a los dos a la vez:

   {
       ok: true,
       profile: {
           roleTag: "Soldado",
           discordName: "Juan",
           robloxUsername: "juanito123",
           robloxUserId: "123456789"
       }
   }
========================== */

router.get("/profile/:robloxId", async (req, res) => {

    try {

        const { robloxId } = req.params;

        const { data: verification, error: verErr } = await supabase
            .from("roblox_verifications")
            .select("user_id, roblox_username")
            .eq("roblox_id", robloxId)
            .eq("verified", true)
            .maybeSingle();

        if (verErr) {
            return res.status(500).json({ ok: false, error: verErr.message });
        }

        if (!verification) {
            return res.status(404).json({ ok: false, error: "Cuenta no vinculada." });
        }

        const { data: usuario, error: usuarioError } = await supabase
            .from("users")
            .select("nombre")
            .eq("id", verification.user_id)
            .maybeSingle();

        if (usuarioError) {
            return res.status(500).json({ ok: false, error: usuarioError.message });
        }

        const { data: membership, error: memErr } = await supabase
            .from("group_members")
            .select("rango")
            .eq("user_id", verification.user_id)
            .maybeSingle();

        if (memErr) {
            return res.status(500).json({ ok: false, error: memErr.message });
        }

        if (!membership) {
            return res.status(404).json({ ok: false, error: "Sin grupo/rango asignado." });
        }

        res.json({

            ok: true,

            profile: {
                roleTag: membership.rango,
                discordName: usuario ? usuario.nombre : "Desconocido",
                robloxUsername: verification.roblox_username || "",
                robloxUserId: robloxId
            }

        });

    } catch (error) {

        console.error(error);
        res.status(500).json({ ok: false, error: "Error del servidor." });

    }

});

module.exports = router;
