const params = new URLSearchParams(window.location.search);

const slug = params.get("slug");


let grupoActual = null;



async function cargarGrupo(){


    if(!slug){

        console.error("No existe slug");

        return;

    }


    try{


        const respuesta = await fetch(`/api/groups/${slug}`);


        const grupo = await respuesta.json();


        grupoActual = grupo;



        document.getElementById("bannerGrupo").src = grupo.banner;

        document.getElementById("iconoGrupo").src = grupo.icono;

        document.getElementById("nombreGrupo").textContent = grupo.nombre;

        document.getElementById("descripcionGrupo").textContent = grupo.descripcion;



    }catch(error){

        console.error(error);

    }


}




/* ==========================
   REVISAR ESTADO DEL USUARIO
   (¿ya es miembro? ¿tiene solicitud pendiente?)
   y mostrar el botón correcto
========================== */

async function revisarEstadoUsuario(){


    const token = localStorage.getItem("token");

    const solicitarBtn = document.getElementById("solicitarBtn");

    const mensaje = document.getElementById("mensajeSolicitud");


    if(!token){

        // No hay sesión, dejamos el botón normal
        // (al hacer click le pedirá iniciar sesión)

        return;

    }


    try{

        const respuesta = await fetch("/api/requests/estado", {

            headers: {

                "Authorization": `Bearer ${token}`

            }

        });


        const estado = await respuesta.json();


        if(estado.yaEsMiembro){

            solicitarBtn.style.display = "none";

            mensaje.textContent =
                `Ya perteneces a ${estado.grupo} (${estado.rango})`;

        } else if(estado.tieneSolicitudPendiente){

            solicitarBtn.style.display = "none";

            mensaje.textContent =
                `⏳ Tienes una solicitud pendiente a ${estado.grupoSolicitado}`;

        }
        // si no es miembro y no tiene solicitud pendiente,
        // dejamos el botón visible normalmente


    }catch(error){

        console.error("Error revisando estado:", error);

    }


}




async function solicitarIngreso(){


    const token = localStorage.getItem("token");



    if(!token){


        alert("Debes iniciar sesión primero");


        return;

    }




    const respuesta = await fetch("/api/requests",{


        method:"POST",


        headers:{


            "Content-Type":"application/json",

            "Authorization": `Bearer ${token}`


        },


        body:JSON.stringify({


            group_id:grupoActual.id


        })


    });



    const data = await respuesta.json();



    const mensaje = document.getElementById("mensajeSolicitud");



    if(data.error){


        mensaje.textContent = data.error;


    }else{


        mensaje.textContent =
        "✅ Solicitud enviada, espera aprobación";


        document.getElementById("solicitarBtn").style.display = "none";


    }


}





document
.getElementById("solicitarBtn")
.addEventListener(
    "click",
    solicitarIngreso
);




cargarGrupo();

revisarEstadoUsuario();
