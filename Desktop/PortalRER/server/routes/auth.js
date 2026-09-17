const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const supabase = require("../config/supabase");
const { enviarCorreoVerificacion } = require("../utils/mailer");

const router = express.Router();


/* ==========================
   REGISTRO
========================== */

router.post("/register", async (req, res) => {

    try {

        const {
            nombre,
            email,
            password,
            invite_code
        } = req.body;

        if (!nombre || !email || !password || !invite_code) {

            return res.status(400).json({
                error: "Todos los campos son obligatorios"
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

        const token = crypto.randomBytes(32).toString("hex");

        const expira = new Date();
        expira.setHours(expira.getHours() + 24);

        const { data, error } = await supabase
            .from("users")
            .insert([{

                nombre,
                email,
                password: passwordHash,
                rol: "usuario",
                invite_code,

                email_verified: false,
                verification_token: token,
                verification_expires: expira.toISOString()

            }])
            .select();

        if (error) {

            return res.status(500).json({ error: error.message });

        }

        // Intentamos mandar el correo. Si falla, igual dejamos el usuario
        // creado (puede pedir que se lo reenvíen), pero avisamos.

        try {

            await enviarCorreoVerificacion(email, nombre, token);

        } catch (mailError) {

            console.error("❌ Error enviando correo de verificación:", mailError);

            return res.json({
                message: "Cuenta creada, pero no pudimos enviarte el correo de verificación. Intenta reenviarlo desde el login.",
                usuario: data[0]
            });

        }

        res.json({

            message: "Cuenta creada. Revisa tu correo para verificar tu cuenta antes de iniciar sesión.",
            usuario: data[0]

        });

    } catch (error) {

        res.status(500).json({ error: error.message });

    }

});


/* ==========================
   VERIFICAR CORREO
========================== */

router.get("/verify/:token", async (req, res) => {

    try {

        const { token } = req.params;

        const { data: usuario, error } = await supabase
            .from("users")
            .select("id, verification_expires, email_verified")
            .eq("verification_token", token)
            .maybeSingle();

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        if (!usuario) {

            return res.status(400).json({
                error: "Link de verificación inválido o ya usado."
            });

        }

        if (usuario.email_verified) {

            return res.json({ message: "Esta cuenta ya estaba verificada." });

        }

        if (new Date(usuario.verification_expires) < new Date()) {

            return res.status(400).json({
                error: "El link de verificación expiró. Pide que te reenvíen uno nuevo."
            });

        }

        const { error: updateError } = await supabase
            .from("users")
            .update({

                email_verified: true,
                verification_token: null,
                verification_expires: null

            })
            .eq("id", usuario.id);

        if (updateError) {
            return res.status(500).json({ error: updateError.message });
        }

        res.json({ message: "Cuenta verificada correctamente. Ya puedes iniciar sesión." });

    } catch (error) {

        res.status(500).json({ error: error.message });

    }

});


/* ==========================
   REENVIAR CORREO DE VERIFICACIÓN
========================== */

router.post("/resend-verification", async (req, res) => {

    try {

        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: "Falta el correo." });
        }

        const { data: usuario, error } = await supabase
            .from("users")
            .select("id, nombre, email_verified")
            .eq("email", email)
            .maybeSingle();

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        // Por seguridad, no revelamos si el correo existe o no

        if (!usuario || usuario.email_verified) {

            return res.json({
                message: "Si el correo existe y no está verificado, te enviamos un nuevo link."
            });

        }

        const token = crypto.randomBytes(32).toString("hex");

        const expira = new Date();
        expira.setHours(expira.getHours() + 24);

        await supabase
            .from("users")
            .update({
                verification_token: token,
                verification_expires: expira.toISOString()
            })
            .eq("id", usuario.id);

        await enviarCorreoVerificacion(email, usuario.nombre, token);

        res.json({
            message: "Si el correo existe y no está verificado, te enviamos un nuevo link."
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({ error: "No se pudo reenviar el correo." });

    }

});


/* ==========================
   LOGIN
========================== */

router.post("/login", async (req, res) => {

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

        if (!user.email_verified) {

            return res.status(403).json({
                error: "Debes verificar tu correo antes de iniciar sesión. Revisa tu bandeja de entrada.",
                sinVerificar: true
            });

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
