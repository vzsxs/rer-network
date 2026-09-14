const express = require("express");
const router = express.Router();

const supabase = require("../config/supabase");


// ENVIAR SOLICITUD DE INGRESO

router.post("/", async (req, res) => {

    try {

        const {
            user_id,
            group_id
        } = req.body;


        if(!user_id || !group_id){

            return res.status(400).json({

                error:"Faltan datos"

            });

        }


        // 1. Revisar si el usuario YA pertenece a un grupo
        // (recuerda: un usuario solo puede estar en un grupo a la vez)

        const { data: yaEsMiembro, error: miembroError } = await supabase
            .from("group_members")
            .select("id")
            .eq("user_id", user_id)
            .maybeSingle();


        if (miembroError) {

            return res.status(500).json({

                error: miembroError.message

            });

        }


        if (yaEsMiembro) {

            return res.status(400).json({

                error: "Ya perteneces a un grupo. No puedes solicitar ingreso a otro."

            });

        }


        // 2. Revisar si el usuario YA tiene una solicitud pendiente
        // (a este grupo o a cualquier otro)

        const { data: existente, error: existenteError } = await supabase
            .from("group_requests")
            .select("id, group_id")
            .eq("user_id", user_id)
            .eq("estado", "pendiente")
            .maybeSingle();


        if (existenteError) {

            return res.status(500).json({

                error: existenteError.message

            });

        }


        if(existente){

            return res.status(400).json({

                error:"Ya tienes una solicitud pendiente. Espera a que sea revisada antes de enviar otra."

            });

        }




        const { data, error } = await supabase
            .from("group_requests")
            .insert([{

                user_id:user_id,

                group_id:group_id,

                estado:"pendiente"

            }])
            .select()
            .single();



        if(error){

            return res.status(500).json({

                error:error.message

            });

        }



        res.json({

            message:"Solicitud enviada correctamente",

            solicitud:data

        });



    }catch(error){


        res.status(500).json({

            error:error.message

        });


    }


});



module.exports = router;
