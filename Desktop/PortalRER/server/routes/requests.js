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



        // Revisar si ya existe una solicitud

        const { data: existente } = await supabase
            .from("group_requests")
            .select("*")
            .eq("user_id", user_id)
            .eq("group_id", group_id)
            .eq("estado", "pendiente")
            .single();



        if(existente){

            return res.status(400).json({

                error:"Ya tienes una solicitud pendiente"

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