const AVATAR_POR_DEFECTO =
    "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="256" height="256">
        <rect width="256" height="256" fill="#2a2b30"/>
        <circle cx="128" cy="96" r="48" fill="#50545c"/>
        <path d="M40 220 C40 160 90 140 128 140 C166 140 216 160 216 220 Z" fill="#50545c"/>
    </svg>
    `);


async function cargarMiembrosDeGrupo(slug) {

    try {

        const respuesta = await fetch(`/api/groups/${slug}/members`);
        const miembros = await respuesta.json();

        if (!Array.isArray(miembros)) return [];

        return miembros;

    } catch (error) {

        console.error(error);
        return [];

    }

}


async function cargarGrupos() {


    const contenedor = document.getElementById("groupsContainer");
    const gruposRecientesBox = document.getElementById("gruposRecientes");
    const totalGruposBadge = document.getElementById("totalGrupos");


    if(!contenedor){

        console.error("❌ No existe groupsContainer");

        return;

    }



    try {


        const respuesta = await fetch("/api/groups");


        const grupos = await respuesta.json();


        if (!Array.isArray(grupos)) {

            contenedor.innerHTML = "<p>Error cargando grupos.</p>";
            return;

        }


        if (totalGruposBadge) totalGruposBadge.textContent = grupos.length;


        // ================= SIDEBAR: GRUPOS RECIENTES =================
        // (solo si el HTML tiene el contenedor; si no, se salta sin romper nada)

        if (gruposRecientesBox) {

            const recientes = [...grupos]
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .slice(0, 5);

            gruposRecientesBox.innerHTML = "";

            recientes.forEach(grupo => {

                const item = document.createElement("div");
                item.className = "grupo-reciente";

                item.innerHTML = `
                    <img class="grupo-reciente-icono" src="${grupo.icono || AVATAR_POR_DEFECTO}">
                    <div class="grupo-reciente-texto">
                        <h4>${grupo.nombre}</h4>
                        <p>Grupo público · ${grupo.miembros} miembro${grupo.miembros === 1 ? "" : "s"}</p>
                    </div>
                `;

                item.addEventListener("click", () => entrarGrupo(grupo.slug));

                gruposRecientesBox.appendChild(item);

            });

        }


        // ================= CARDS DE GRUPOS =================

        contenedor.innerHTML = "";


        for (const grupo of grupos) {


            const textoMiembros = grupo.miembros === 1
                ? "1 miembro"
                : `${grupo.miembros} miembros`;


            const card = document.createElement("div");
            card.className = "group-card";

            card.innerHTML = `
                <div class="group-banner-wrap">
                    <img src="${grupo.banner}" alt="${grupo.nombre}">
                </div>

                <div class="group-body">

                    <div class="group-header-row">
                        <img class="group-icon" src="${grupo.icono || AVATAR_POR_DEFECTO}" alt="${grupo.nombre}">
                        <div class="group-title-col">
                            <div class="group-title-row">
                                <h3>${grupo.nombre}</h3>
                                <span class="dot-activo"></span>
                            </div>
                            <p class="group-meta">Grupo público</p>
                        </div>
                    </div>

                    <div class="group-stats">
                        <span>👥 ${textoMiembros}</span>
                    </div>

                    <p class="group-desc">${grupo.descripcion || ""}</p>

                    <div class="group-footer">
                        <div class="avatares-miembros" data-slug="${grupo.slug}"></div>
                        <button class="join-btn" onclick="entrarGrupo('${grupo.slug}')">Entrar →</button>
                    </div>

                </div>
            `;

            contenedor.appendChild(card);


            // Cargamos los avatares de los primeros miembros de este grupo (sin bloquear el resto)

            cargarMiembrosDeGrupo(grupo.slug).then(miembros => {

                const cont = card.querySelector(".avatares-miembros");

                const primeros = miembros.slice(0, 4);

                cont.innerHTML = primeros.map(m => {

                    const avatar = (m.users && m.users.avatar_url) ? m.users.avatar_url : AVATAR_POR_DEFECTO;
                    const nombre = m.users ? m.users.nombre : "Miembro";

                    return `<img src="${avatar}" alt="${nombre}" title="${nombre}">`;

                }).join("");

            });


        }



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
