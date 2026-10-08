const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
const axios = require("axios");

const supabase = require("../config/supabase");

const router = express.Router();


/* ==========================
   VERIFICAR CAPTCHA CON hCaptcha
========================== */

async function verificarCaptcha(token, ip) {

    if (!token) {
        return false;
    }

    try {

        const params = new URLSearchParams();
        params.append("secret", process.env.HCAPTCHA_SECRET);
        params.append("response", token);
        if (ip) params.append("remoteip", ip);

        const { data } = await axios.post(
            "https://hcaptcha.com/siteverify",
            params
        );

        return data.success === true;

    } catch (error) {

        console.error("❌ Error verificando hCaptcha:", error.message);
        return false;

    }

}


/* ==========================
   LÍMITES DE VELOCIDAD (anti-bots)
========================== */

// Registro: máximo 5 cuentas nuevas por IP cada hora
const limitarRegistro = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: { error: "Demasiados registros desde esta conexión. Intenta de nuevo en un rato." },
    standardHeaders: true,
    legacyHeaders: false
});

// Login: máximo 15 intentos por IP cada 15 minutos (evita fuerza bruta)
const limitarLogin = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 15,
    message: { error: "Demasiados intentos de inicio de sesión. Espera unos minutos." },
    standardHeaders: true,
    legacyHeaders: false
});


/* ==========================
   REGISTRO
========================== */

router.post("/register", limitarRegistro, async (req, res) => {

    try {

        const {
            nombre,
            email,
            password,
            invite_code,
            hcaptchaToken
        } = req.body;

        if (!nombre || !email || !password || !invite_code) {

            return res.status(400).json({
                error: "Todos los campos son obligatorios"
            });

        }

        const captchaValido = await verificarCaptcha(hcaptchaToken, req.ip);

        if (!captchaValido) {

            return res.status(400).json({
                error: "Captcha inválido o expirado. Inténtalo de nuevo."
            });

        }

        if (invite_code !== "RER2026") {

            return res.status(400).json({
                error: "Código de invitación incorrecto"
            });

        }

        const { data: usuarioExistente } = await supabase
            .from("users")
            .select("email")
            .eq("email", email)
            .maybeSingle();

        if (usuarioExistente) {

            return res.status(400).json({
                error: "El correo ya está registrado"
            });

        }

        const passwordHash = await bcrypt.hash(password, 10);

        const { data, error } = await supabase
            .from("users")
            .insert([{

                nombre,
                email,
                password: passwordHash,
                rol: "usuario",
                invite_code,

                // Sin verificación por correo: la cuenta nace ya activa
                email_verified: true

            }])
            .select();

        if (error) {

            return res.status(500).json({ error: error.message });

        }

        res.json({

            message: "Cuenta creada correctamente. Ya puedes iniciar sesión.",
            usuario: data[0]

        });

    } catch (error) {

        res.status(500).json({ error: error.message });

    }

});


/* ==========================
   LOGIN
========================== */

router.post("/login", limitarLogin, async (req, res) => {

    try {

        const { email, password } = req.body;

        if (!email || !password) {

            return res.status(400).json({
                error: "Correo y contraseña obligatorios"
            });

        }

        const { data: user, error } = await supabase
            .from("users")
            .select("*")
            .eq("email", email)
            .maybeSingle();

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        if (!user) {

            return res.status(404).json({ error: "Usuario no encontrado" });

        }

        const contraseñaCorrecta = await bcrypt.compare(password, user.password);

        if (!contraseñaCorrecta) {

            return res.status(401).json({ error: "Contraseña incorrecta" });

        }

        const token = jwt.sign(

            {
                id: user.id,
                nombre: user.nombre,
                rol: user.rol
            },

            process.env.JWT_SECRET,

            { expiresIn: "7d" }

        );

        res.json({

            message: "Login correcto",
            token,

            usuario: {
                id: user.id,
                nombre: user.nombre,
                email: user.email,
                rol: user.rol
            }

        });

    } catch (error) {

        res.status(500).json({ error: error.message });

    }

});


module.exports = router;
