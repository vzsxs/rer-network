const params = new URLSearchParams(window.location.search);
const slug = params.get("slug");

const token = localStorage.getItem("token");

let grupoActual = null;
let miMembresia = null;

const AVATAR_POR_DEFECTO =
    "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="256" height="256">
        <rect width="256" height="256" fill="#2a2b30"/>
        <circle cx="128" cy="96" r="48" fill="#50545c"/>
        <path d="M40 220 C40 160 90 140 128 140 C166 140 216 160 216 220 Z" fill="#50545c"/>
    </svg>
    `);


function formatearFecha(fechaISO) {

    if (!fechaISO) return "—";

    return new Date(fechaISO).toLocaleDateString("es-CO", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });

}


/* ==========================
   PESTAÑAS
========================== */

function mostrarTab(tab, el){

    document.getElementById("tabInfo").style.display = tab === "info" ? "block" : "none";
    document.getElementById("tabAnuncios").style.display = tab === "anuncios" ? "block" : "none";
    document.getElementById("tabMateriales").style.display = tab === "materiales" ? "block" : "none";
    document.getElementById("tabMiembros").style.display = tab === "miembros" ? "block" : "none";

    document.querySelectorAll(".tab").forEach(t => t.classList.remove("activo"));
    el.classList.add("activo");

}


/* ==========================
   SIDEBAR: TODAS LAS ORGANIZACIONES
========================== */

async function cargarListaGrupos() {

    const cont = document.getElementById("listaGrupos");

    try {

        const respuesta = await fetch("/api/groups");
        const grupos = await respuesta.json();

        if (!Array.isArray(grupos)) return;

        cont.innerHTML = "";

        grupos.forEach(g => {

            const item = document.createElement("a");

            item.className = "grupo-item" + (g.slug === slug ? " activo" : "");
            item.href = `group.html?slug=${g.slug}`;

            item.innerHTML = `
                <img src="${g.icono || AVATAR_POR_DEFECTO}" alt="${g.nombre}">
                <span>${g.nombre}</span>
            `;

            cont.appendChild(item);

        });

    } catch (error) {

        console.error(error);

    }

}


/* ==========================
   DATOS DEL GRUPO
========================== */

async function cargarGrupo() {

    if (!slug) {

        document.getElementById("nombreGrupo").textContent = "Grupo no especificado";
        return;

    }

    try {

        const respuesta = await fetch(`/api/groups/${slug}`);
        const grupo = await respuesta.json();

        if (grupo.error) {

            document.getElementById("nombreGrupo").textContent = "Grupo no encontrado";
            return;

        }

        grupoActual = grupo;

        document.getElementById("bannerGrupo").src = grupo.banner || "";
        document.getElementById("iconoGrupo").src = grupo.icono || AVATAR_POR_DEFECTO;
        document.getElementById("nombreGrupo").textContent = grupo.nombre;
        document.getElementById("breadcrumbGrupo").textContent = grupo.nombre;
        document.title = `${grupo.nombre} - Portal RER`;

        document.getElementById("descripcionGrupo").textContent =
            grupo.descripcion || "Este grupo aún no tiene descripción.";

        const reglamentoBox = document.getElementById("reglamentoGrupo");

        if (grupo.reglamento) {

            reglamentoBox.innerHTML = "";
            const p = document.createElement("p");
            p.style.whiteSpace = "pre-wrap";
            p.textContent = grupo.reglamento;
            reglamentoBox.appendChild(p);

        } else {

            reglamentoBox.innerHTML = `<p class="vacio">Aún no se ha publicado el reglamento.</p>`;

        }

        await cargarMiMembresia(grupo);

    } catch (error) {

        console.error(error);

    }

}


/* ==========================
   MI MEMBRESÍA (rango, salir, etc)
========================== */

async function cargarMiMembresia(grupo) {

    const metaBox = document.getElementById("metaGrupo");
    const accionBox = document.getElementById("accionMembresia");

    const textoMiembros = grupo.miembros === 1
        ? "1 miembro"
        : `${grupo.miembros} miembros`;

    if (!token) {

        metaBox.innerHTML = `<span>👥 <strong>${textoMiembros}</strong></span>`;
        accionBox.innerHTML = `<a href="login.html" class="btn-unirse">Iniciar sesión</a>`;
        return;

    }

    try {

        const respuesta = await fetch(`/api/groups/${slug}/me`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        const estado = await respuesta.json();

        miMembresia = estado;

        if (estado.esMiembro) {

            metaBox.innerHTML = `
                <span>👥 <strong>${textoMiembros}</strong></span>
                <span>🎖 Tu rango: <strong>${estado.rango}</strong></span>
                <span>📅 Desde <strong>${formatearFecha(estado.desde)}</strong></span>
            `;

            accionBox.innerHTML = `<button class="btn-salir" onclick="salirDelGrupo()">Salir del grupo</button>`;

        } else if (estado.solicitudPendiente) {

            metaBox.innerHTML = `<span>👥 <strong>${textoMiembros}</strong></span>`;
            accionBox.innerHTML = `<div class="estado-pendiente">⏳ Solicitud pendiente</div>`;

        } else {

            metaBox.innerHTML = `<span>👥 <strong>${textoMiembros}</strong></span>`;
            accionBox.innerHTML = `<button class="btn-unirse" onclick="solicitarIngreso()">Solicitar ingreso</button>`;

        }

    } catch (error) {

        console.error(error);
        metaBox.innerHTML = `<span>👥 <strong>${textoMiembros}</strong></span>`;

    }

}


async function solicitarIngreso() {

    if (!token) {

        alert("Debes iniciar sesión primero");
        return;

    }

    try {

        const respuesta = await fetch("/api/requests", {

            method: "POST",

            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },

            body: JSON.stringify({ group_id: grupoActual.id })

        });

        const datos = await respuesta.json();

        if (datos.error) {

            alert(datos.error);
            return;

        }

        document.getElementById("accionMembresia").innerHTML =
            `<div class="estado-pendiente">⏳ Solicitud pendiente</div>`;

    } catch (error) {

        console.error(error);
        alert("Error enviando la solicitud.");

    }

}


async function salirDelGrupo() {

    if (!confirm("¿Seguro que quieres salir de este grupo? Perderás tu rango actual.")) {
        return;
    }

    try {

        const respuesta = await fetch(`/api/groups/${slug}/leave`, {

            method: "DELETE",

            headers: { "Authorization": `Bearer ${token}` }

        });

        const datos = await respuesta.json();

        if (datos.error) {

            alert(datos.error);
            return;

        }

        location.reload();

    } catch (error) {

        console.error(error);
        alert("Error saliendo del grupo.");

    }

}


/* ==========================
   ANUNCIOS
========================== */

async function cargarAnuncios() {

    const cont = document.getElementById("listaAnuncios");

    try {

        const respuesta = await fetch(`/api/groups/${slug}/announcements`);
        const anuncios = await respuesta.json();

        if (!Array.isArray(anuncios) || anuncios.length === 0) {

            cont.innerHTML = `<div class="panel-body"><p class="vacio">No hay anuncios publicados todavía.</p></div>`;
            return;

        }

        cont.innerHTML = "";

        anuncios.forEach(a => {

            const item = document.createElement("div");
            item.className = "lista-item";

            const autor = a.users ? a.users.nombre : "Desconocido";

            item.innerHTML = `
                <div class="lista-icono">📢</div>
                <div class="lista-texto">
                    <h4></h4>
                    <p>Publicado por ${autor} · ${formatearFecha(a.created_at)}</p>
                    <p class="anuncio-contenido"></p>
                </div>
            `;

            item.querySelector("h4").textContent = a.titulo;
            item.querySelector(".anuncio-contenido").textContent = a.contenido || "";

            cont.appendChild(item);

        });

    } catch (error) {

        console.error(error);
        cont.innerHTML = `<div class="panel-body"><p class="vacio">Error cargando anuncios.</p></div>`;

    }

}


/* ==========================
   EQUIPAMIENTO
========================== */

async function cargarEquipamiento() {

    const cont = document.getElementById("listaEquipamiento");

    try {

        const respuesta = await fetch(`/api/groups/${slug}/equipment`);
        const items = await respuesta.json();

        if (!Array.isArray(items) || items.length === 0) {

            cont.innerHTML = `<div class="panel-body"><p class="vacio">Este grupo aún no tiene equipamiento registrado.</p></div>`;
            return;

        }

        cont.innerHTML = "";

        items.forEach(item => {

            const fila = document.createElement("div");
            fila.className = "lista-item";

            const contenido = `
                <div class="lista-icono">${item.icono || "📦"}</div>
                <div class="lista-texto">
                    <h4></h4>
                    <p class="equip-desc"></p>
                </div>
            `;

            if (item.url) {

                const link = document.createElement("a");
                link.href = item.url;
                link.target = "_blank";
                link.className = "lista-item-link";
                link.innerHTML = contenido;
                link.querySelector("h4").textContent = item.nombre;
                link.querySelector(".equip-desc").textContent = item.descripcion || "";
                fila.appendChild(link);

            } else {

                fila.innerHTML = contenido;
                fila.querySelector("h4").textContent = item.nombre;
                fila.querySelector(".equip-desc").textContent = item.descripcion || "";

            }

            cont.appendChild(fila);

        });

    } catch (error) {

        console.error(error);
        cont.innerHTML = `<div class="panel-body"><p class="vacio">Error cargando equipamiento.</p></div>`;

    }

}


/* ==========================
   MIEMBROS DEL GRUPO
========================== */

async function cargarMiembrosGrupo() {

    const cont = document.getElementById("listaMiembros");

    try {

        const respuesta = await fetch(`/api/groups/${slug}/members`);
        const miembros = await respuesta.json();

        if (!Array.isArray(miembros) || miembros.length === 0) {

            cont.innerHTML = `<div class="panel-body"><p class="vacio">Este grupo aún no tiene miembros.</p></div>`;
            return;

        }

        cont.innerHTML = "";

        miembros.forEach(m => {

            if (!m.users) return;

            const fila = document.createElement("div");
            fila.className = "lista-item lista-item-clickable";

            const avatar = m.users.avatar_url || AVATAR_POR_DEFECTO;

            fila.innerHTML = `
                <img src="${avatar}" class="miembro-avatar-lista" alt="">
                <div class="lista-texto">
                    <h4></h4>
                    <p></p>
                </div>
            `;

            fila.querySelector("h4").textContent = m.users.nombre;
            fila.querySelector("p").textContent = m.rango || "Sin rango";

            fila.addEventListener("click", () => {
                window.location.href = `perfil.html?id=${m.users.id}`;
            });

            cont.appendChild(fila);

        });

    } catch (error) {

        console.error(error);
        cont.innerHTML = `<div class="panel-body"><p class="vacio">Error cargando miembros.</p></div>`;

    }

}


/* ==========================
   INICIO
========================== */

cargarListaGrupos();
cargarGrupo();
cargarAnuncios();
cargarEquipamiento();
cargarMiembrosGrupo();
