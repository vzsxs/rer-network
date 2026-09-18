async function cargarGrupos() {


    const contenedor = document.getElementById("groupsContainer");


    if(!contenedor){

        console.error("❌ No existe groupsContainer");

        return;

    }



    try {


        const respuesta = await fetch("/api/groups");


        const grupos = await respuesta.json();



        contenedor.innerHTML = "";



        grupos.forEach(grupo => {



            const textoMiembros = grupo.miembros === 1
                ? "1 miembro"
                : `${grupo.miembros} miembros`;



            contenedor.innerHTML += `


            <div class="group-card">


                <div class="group-banner">

                    <img src="${grupo.banner}" alt="${grupo.nombre}">

                </div>



                <div class="group-content">



                    <div class="group-header">


                        <img 
                        src="${grupo.icono}" 
                        alt="${grupo.nombre}"
                        >


                        <h2>${grupo.nombre}</h2>


                    </div>




                    <p>

                        ${grupo.descripcion}

                    </p>




                    <div class="group-footer">


                        <span class="members">

                            👥 ${textoMiembros}

                        </span>



                        <button 
                        class="enter-btn"
                        onclick="entrarGrupo('${grupo.slug}')">

                            Entrar →

                        </button>



                    </div>



                </div>



            </div>


            `;



        });



    } catch(error){


        console.error("❌ Error cargando grupos:", error);


        contenedor.innerHTML = `

        <h2>Error cargando grupos</h2>

        `;


    }


}




function entrarGrupo(slug){


    window.location.href = `group.html?slug=${slug}`;


}




cargarGrupos();
