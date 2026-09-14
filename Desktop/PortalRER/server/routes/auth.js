const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const supabase = require("../config/supabase");

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



        // Validar código de invitación

        if (invite_code !== "RER2026") {

            return res.status(400).json({

                error: "Código de invitación incorrecto"

            });

        }



        // Buscar si ya existe

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



        // Encriptar contraseña

        const passwordHash = await bcrypt.hash(password, 10);



        // Crear usuario

        const { data, error } = await supabase
            .from("users")
            .insert([{

                nombre,
                email,
                password: passwordHash,

                rol: "usuario",

                invite_code

            }])
            .select();



        if (error) {

            return res.status(500).json({

                error: error.message

            });

        }



        res.json({

            message: "Usuario registrado correctamente",

            usuario: data[0]

        });



    } catch (error) {

        res.status(500).json({

            error: error.message

        });

    }

});





/* ==========================
   LOGIN
========================== */

router.post("/login", async (req, res) => {

    try {

        const {

            email,
            password

        } = req.body;



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

            return res.status(500).json({

                error: error.message

            });

        }



        if (!user) {

            return res.status(404).json({

                error: "Usuario no encontrado"

            });

        }



        const contraseñaCorrecta = await bcrypt.compare(

            password,
            user.password

        );



        if (!contraseñaCorrecta) {

            return res.status(401).json({

                error: "Contraseña incorrecta"

            });

        }



        const token = jwt.sign(

            {

                id: user.id,
                nombre: user.nombre,
                rol: user.rol

            },

            process.env.JWT_SECRET,

            {

                expiresIn: "7d"

            }

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

        res.status(500).json({

            error: error.message

        });

    }

});



module.exports = router;