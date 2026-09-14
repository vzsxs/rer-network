const express = require("express");
const router = express.Router();

const supabase = require("../config/supabase");



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

            return res.status(500).json({
                error: error.message
            });

        }

        res.json(data);

    } catch (error) {

        res.status(500).json({
            error: error.message
        });

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

            return res.status(500).json({

                error: error.message

            });

        }

        res.json(data);

    } catch (error) {

        res.status(500).json({

            error: error.message

        });

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
            .select(`
                id,
                nombre,
                nivel
            `)
            .eq("group_id", groupId)
            .order("nivel", {

                ascending: true

            });

        if (error) {

            return res.status(500).json({

                error: error.message

            });

        }

        res.json(data);

    } catch (error) {

        res.status(500).json({

            error: error.message

        });

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

            return res.status(500).json({

                error: error.message

            });

        }

        const { data: primerRango, error: rangoError } = await supabase
            .from("group_ranks")
            .select("nombre")
            .eq("group_id", solicitud.group_id)
            .order("nivel", {

                ascending: true

            })
            .limit(1)
            .single();

        if (rangoError) {

            return res.status(500).json({

                error: "Este grupo no tiene rangos configurados."

            });

        }

        const { error: updateError } = await supabase
            .from("group_requests")
            .update({

                estado: "aceptado"

            })
            .eq("id", id);

        if (updateError) {

            return res.status(500).json({

                error: updateError.message

            });

        }        // Crear miembro

        const { error: memberError } = await supabase
            .from("group_members")
            .insert([{

                user_id: solicitud.user_id,

                group_id: solicitud.group_id,

                rango: primerRango.nombre

            }]);

        if (memberError) {

            return res.status(500).json({

                error: memberError.message

            });

        }

        res.json({

            message: "Usuario aceptado correctamente.",

            rango: primerRango.nombre

        });

    } catch (error) {

        res.status(500).json({

            error: error.message

        });

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
            .update({

                estado: "rechazado"

            })
            .eq("id", id);

        if (error) {

            return res.status(500).json({

                error: error.message

            });

        }

        res.json({

            message: "Solicitud rechazada."

        });

    } catch (error) {

        res.status(500).json({

            error: error.message

        });

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

            return res.status(400).json({

                error: "Debe enviar un rango."

            });

        }

        const { error } = await supabase
            .from("group_members")
            .update({

                rango: rango

            })
            .eq("id", memberId);

        if (error) {

            return res.status(500).json({

                error: error.message

            });

        }

        res.json({

            message: "Rango actualizado correctamente."

        });

    } catch (error) {

        res.status(500).json({

            error: error.message

        });

    }

});
// ==========================
// OBTENER RANGOS DE GRUPO
// ==========================

router.get("/ranks/:groupId", async(req,res)=>{

    try{

        const groupId = req.params.groupId;


        const {data,error}=await supabase
        .from("group_ranks")
        .select("*")
        .eq("group_id",groupId)
        .order("nivel",{ascending:true});



        if(error){

            return res.status(500).json({

                error:error.message

            });

        }


        res.json(data);


    }catch(error){

        res.status(500).json({

            error:error.message

        });

    }

});
// ==========================
// CAMBIAR RANGO MIEMBRO
// ==========================

router.put("/member/:memberId/rank", async(req,res)=>{

    try{

        const memberId=req.params.memberId;

        const {rango}=req.body;


        if(!rango){

            return res.status(400).json({

                error:"Rango obligatorio"

            });

        }



        const {error}=await supabase
        .from("group_members")
        .update({

            rango:rango

        })
        .eq("id",memberId);



        if(error){

            return res.status(500).json({

                error:error.message

            });

        }



        res.json({

            message:"Rango actualizado correctamente"

        });



    }catch(error){

        res.status(500).json({

            error:error.message

        });

    }


});



module.exports = router;