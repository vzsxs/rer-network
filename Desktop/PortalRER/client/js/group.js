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


    }


}





document
.getElementById("solicitarBtn")
.addEventListener(
    "click",
    solicitarIngreso
);




cargarGrupo();
