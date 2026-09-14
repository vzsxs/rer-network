// ===========================
// PROTEGER PANEL ADMIN
// ===========================

const usuarioRol = localStorage.getItem("usuarioRol");
const token = localStorage.getItem("token");

// ===========================
// CARGAR PERFIL ADMIN
// ===========================

const nombreUsuario = document.getElementById("nombreUsuario");
const rolUsuario = document.getElementById("rolUsuario");
const nombreMini = document.getElementById("nombreMini");


const usuarioNombre = localStorage.getItem("usuarioNombre");
const usuarioRolActual = localStorage.getItem("usuarioRol");



if(nombreUsuario){

    nombreUsuario.textContent =
    usuarioNombre || "Usuario";

}



if(rolUsuario){

    rolUsuario.textContent =
    usuarioRolActual || "Sin rol";

}



if(nombreMini){

    nombreMini.textContent =
    usuarioNombre || "Administrador";

}


if (!token || !usuarioRol) {

    window.location.href = "/login.html";

}


if (usuarioRol.toLowerCase() !== "admin") {

    alert("No tienes permisos para acceder al panel.");

    window.location.href = "/dashboard.html";

}



// ===========================
// CARGAR SOLICITUDES
// ===========================

async function cargarSolicitudes(){


    const contenedor = document.getElementById(
        "requestsContainer"
    );


    if(!contenedor){

        console.error(
            "No existe requestsContainer"
        );

        return;

    }



    try{


        const respuesta = await fetch(
            "/api/admin/requests"
        );


        const solicitudes = await respuesta.json();



        if(!respuesta.ok){

            throw new Error(
                solicitudes.error ||
                "Error en la API"
            );

        }



        contenedor.innerHTML = "";



        if(solicitudes.length === 0){


            contenedor.innerHTML = `

            <div class="request-card">

                <h3>
                    No hay solicitudes pendientes
                </h3>

                <p>
                    Actualmente no existen solicitudes nuevas.
                </p>

            </div>

            `;


            return;

        }




        solicitudes.forEach(solicitud=>{


            const usuario =
            solicitud.users?.nombre ||
            "Usuario desconocido";


            const email =
            solicitud.users?.email ||
            "Sin correo";


            const grupo =
            solicitud.groups?.nombre ||
            "Grupo desconocido";



            contenedor.innerHTML += `

            <div class="request-card">


                <h2>
                    👤 ${usuario}
                </h2>


                <p>
                    📧 ${email}
                </p>


                <p>
                    🛡 ${grupo}
                </p>


                <p>
                    Estado:
                    <b>
                    ${solicitud.estado}
                    </b>
                </p>



                <button
                class="accept"
                onclick="aceptarSolicitud('${solicitud.id}')">

                    Aceptar

                </button>



                <button
                class="deny"
                onclick="rechazarSolicitud('${solicitud.id}')">

                    Denegar

                </button>


            </div>

            `;


        });



    }catch(error){


        console.error(error);


        contenedor.innerHTML = `

        <div class="request-card">

            <h3>
                Error cargando solicitudes
            </h3>

            <p>
                ${error.message}
            </p>

        </div>

        `;


    }


}// ===========================
// ACEPTAR SOLICITUD
// ===========================


async function aceptarSolicitud(id){


    try{


        const respuesta = await fetch(

            `/api/admin/requests/${id}/accept`,

            {

                method:"PUT"

            }

        );



        const data = await respuesta.json();



        if(!respuesta.ok){

            throw new Error(

                data.error ||

                "Error aceptando solicitud"

            );

        }



        alert(
            "Solicitud aceptada correctamente ✅"
        );



        cargarSolicitudes();



    }catch(error){


        console.error(

            "Error aceptando:",

            error

        );


        alert(

            error.message

        );


    }


}









// ===========================
// RECHAZAR SOLICITUD
// ===========================


async function rechazarSolicitud(id){


    try{


        const respuesta = await fetch(

            `/api/admin/requests/${id}/deny`,

            {

                method:"PUT"

            }

        );



        const data = await respuesta.json();



        if(!respuesta.ok){

            throw new Error(

                data.error ||

                "Error rechazando solicitud"

            );

        }



        alert(

            "Solicitud rechazada ❌"

        );



        cargarSolicitudes();



    }catch(error){


        console.error(

            "Error rechazando:",

            error

        );


        alert(

            error.message

        );


    }


}// ===========================
// CARGAR GRUPOS
// ===========================


async function cargarGrupos(){


    const select = document.getElementById(
        "groupSelect"
    );


    if(!select){

        console.error(
            "No existe groupSelect"
        );

        return;

    }



    try{


        const respuesta = await fetch(
            "/api/groups"
        );



        const grupos = await respuesta.json();



        if(!respuesta.ok){

            throw new Error(
                grupos.error ||
                "Error cargando grupos"
            );

        }



        select.innerHTML = `

            <option value="">

                Selecciona un grupo

            </option>

        `;



        grupos.forEach(grupo=>{


            select.innerHTML += `

                <option value="${grupo.id}">

                    ${grupo.nombre}

                </option>

            `;


        });



    }catch(error){


        console.error(

            "Error cargando grupos:",

            error

        );


    }


}







// ===========================
// CAMBIAR GRUPO SELECCIONADO
// ===========================


const groupSelect = document.getElementById(
    "groupSelect"
);



if(groupSelect){


    groupSelect.addEventListener(
        "change",
        ()=>{


            const groupId = groupSelect.value;



            if(groupId){


                cargarMiembros(groupId);


            }


        }

    );


}







// ===========================
// CARGAR MIEMBROS
// ===========================


async function cargarMiembros(groupId){


    const contenedor = document.getElementById(
        "membersContainer"
    );



    if(!contenedor){

        console.error(
            "No existe membersContainer"
        );

        return;

    }



    contenedor.innerHTML = `

        <div class="request-card">

            Cargando miembros...

        </div>

    `;



    try{


        const respuesta = await fetch(

            `/api/admin/members/${groupId}`

        );



        const miembros = await respuesta.json();



        if(!respuesta.ok){

            throw new Error(

                miembros.error ||

                "Error cargando miembros"

            );

        }




        const rangosRespuesta = await fetch(

            `/api/admin/ranks/${groupId}`

        );



        const rangos = await rangosRespuesta.json();




        contenedor.innerHTML = "";




        if(miembros.length === 0){


            contenedor.innerHTML = `

                <div class="request-card">

                    <h3>
                        No hay miembros
                    </h3>

                </div>

            `;


            return;


        }





        miembros.forEach(miembro=>{


            let opciones = "";



            rangos.forEach(rango=>{


                opciones += `

                <option value="${rango.nombre}"

                ${
                    miembro.rango === rango.nombre
                    ? "selected"
                    : ""
                }

                >

                    ${rango.nombre}

                </option>

                `;


            });





            contenedor.innerHTML += `


            <div class="request-card">


                <h2>

                    ${miembro.users.nombre}

                </h2>



                <p>

                    ${miembro.users.email}

                </p>



                <p>

                    Rango actual:

                    <b>

                    ${miembro.rango}

                    </b>

                </p>



                <select id="rango_${miembro.id}">

                    ${opciones}

                </select>



                <br><br>



                <button

                onclick="cambiarRango('${miembro.id}')">

                    Guardar rango

                </button>



            </div>


            `;



        });



    }catch(error){


        console.error(

            "Error cargando miembros:",

            error

        );


        contenedor.innerHTML = `

            <div class="request-card">

                ${error.message}

            </div>

        `;


    }


}// ===========================
// CAMBIAR RANGO
// ===========================


async function cambiarRango(memberId){


    const select = document.getElementById(

        `rango_${memberId}`

    );



    if(!select){

        return;

    }



    const rango = select.value;



    try{


        const respuesta = await fetch(

            `/api/admin/member/${memberId}/rank`,

            {

                method:"PUT",

                headers:{

                    "Content-Type":"application/json"

                },

                body:JSON.stringify({

                    rango:rango

                })

            }

        );



        const data = await respuesta.json();



        if(!respuesta.ok){


            throw new Error(

                data.error ||

                "Error cambiando rango"

            );


        }



        alert(

            "Rango actualizado correctamente ✅"

        );



    }catch(error){


        console.error(

            "Error cambiando rango:",

            error

        );


        alert(

            error.message

        );


    }


}







// ===========================
// INICIAR PANEL ADMIN
// ===========================


document.addEventListener(

"DOMContentLoaded",

()=>{


    cargarSolicitudes();


    cargarGrupos();


}

);