const AVATAR_POR_DEFECTO =
    "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="256" height="256">
        <rect width="256" height="256" fill="#2a2b30"/>
        <circle cx="128" cy="96" r="48" fill="#50545c"/>
        <path d="M40 220 C40 160 90 140 128 140 C166 140 216 160 216 220 Z" fill="#50545c"/>
    </svg>
    `);


// Íconos en línea (SVG), los mismos de la referencia

const ICONOS = {

    globo: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/></svg>`,

    ojo: `<svg viewBox="0 0 24 24"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>`,

    usuarios: `<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.5"/><path d="M2 20c0-4 3-6 7-6s7 2 7 6"/><circle cx="17" cy="9" r="2.5"/><path d="M17 14c3 0 5 1.8 5 5"/></svg>`,

    comentario: `<svg viewBox="0 0 24 24"><path d="M21 12a8 8 0 0 1-11.5 7.2L3 21l1.8-5.5A8 8 0 1 1 21 12z"/></svg>`,

    calendario: `<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>`,

    engranaje: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/></svg>`,

    entrar: `<svg viewBox="0 0 24 24"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"/></svg>`

};


let grupos = [];
let orden = "nombre";
let estadoUsuario = null;


/* ==========================
   UTILIDADES
========================== */

// Escapa texto antes de meterlo en HTML

function esc(texto) {

    const d = document.createElement("div");
    d.textContent = texto == null ? "" : String(texto);
    return d.innerHTML;

}


function textoMiembros(n) {

    return n === 1 ? "1 miembro" : `${n} miembros`;

}


function irAlGrupo(slug) {

    window.location.href = `group.html?slug=${encodeURIComponent(slug)}`;

}


function cerrarMenus() {

    document.querySelectorAll(".menu.open").forEach(m => m.classList.remove("open"));

}


/* ==========================
   ESTADO DEL USUARIO
   (para saber si ya es miembro / tiene solicitud pendiente)
========================== */

async function cargarEstadoUsuario() {

    const token = localStorage.getItem("token");

    if (!token) return;

    try {

        const respuesta = await fetch("/api/requests/estado", {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (respuesta.ok) {
            estadoUsuario = await respuesta.json();
        }

    } catch (error) {

        console.error(error);

    }

}


function etiquetaBoton(g) {

    if (estadoUsuario && estadoUsuario.yaEsMiembro && estadoUsuario.grupoSlug === g.slug) {
        return "Entrar al grupo";
    }

    if (estadoUsuario && estadoUsuario.tieneSolicitudPendiente && estadoUsuario.grupoSolicitado === g.nombre) {
        return "Solicitud pendiente";
    }

    return "Unirse al grupo";

}


/* ==========================
   SIDEBAR (Grupos recientes / más vistos)
========================== */

function crearItemLateral(g, metaTexto, conCategoria) {

    const item = document.createElement("div");
    item.className = "rec-item";

    item.innerHTML = `
        <img class="rec-icon" alt="">
        <div>
            <div class="rec-name">${esc(g.nombre)}</div>
            <div class="rec-meta">${ICONOS.globo}${esc(metaTexto)}</div>
            ${conCategoria ? `<div class="rec-cat">Organizaciones</div>` : ""}
        </div>
    `;

    const icono = item.querySelector(".rec-icon");
    icono.src = g.icono || AVATAR_POR_DEFECTO;
    icono.onerror = () => { icono.src = AVATAR_POR_DEFECTO; };

    item.addEventListener("click", () => irAlGrupo(g.slug));

    return item;

}


function renderSidebar() {

    document.getElementById("totalGrupos").textContent = grupos.length;

    const recientes = document.getElementById("gruposRecientes");
    const masVistos = document.getElementById("gruposMasVistos");

    recientes.innerHTML = "";
    masVistos.innerHTML = "";

    if (grupos.length === 0) {

        recientes.innerHTML = `<p class="side-vacio">Todavía no hay grupos.</p>`;
        masVistos.innerHTML = `<p class="side-vacio">Todavía no hay grupos.</p>`;
        return;

    }

    [...grupos]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5)
        .forEach(g => {
            recientes.appendChild(
                crearItemLateral(g, `Grupo público · ${textoMiembros(g.miembros)}`, true)
            );
        });

    [...grupos]
        .sort((a, b) => (b.vistas || 0) - (a.vistas || 0))
        .slice(0, 5)
        .forEach(g => {
            masVistos.appendChild(
                crearItemLateral(g, `${g.vistas || 0} vistas`, false)
            );
        });

}


/* ==========================
   CARDS
========================== */

function ordenarGrupos(lista) {

    const copia = [...lista];

    if (orden === "miembros") {
        return copia.sort((a, b) => b.miembros - a.miembros);
    }

    if (orden === "vistas") {
        return copia.sort((a, b) => (b.vistas || 0) - (a.vistas || 0));
    }

    if (orden === "recientes") {
        return copia.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    return copia.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

}


function crearCard(g) {

    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
        <div class="card-banner"><img alt=""></div>

        <div class="card-head">

            <img class="card-icon" alt="">

            <div>

                <div class="card-title">
                    <span>${esc(g.nombre)}</span>
                    ${g.reciente ? `<span class="dot" title="Tiene un anuncio reciente"></span>` : ""}
                </div>

                <div class="card-sub">${ICONOS.globo}Grupo público</div>

                <div class="card-stats">
                    <span title="Vistas">${ICONOS.ojo}${g.vistas || 0}</span>
                    <span title="Miembros">${ICONOS.usuarios}${g.miembros}</span>
                    <span title="Anuncios">${ICONOS.comentario}${g.anuncios || 0}</span>
                    <span title="Eventos">${ICONOS.calendario}${g.eventos || 0}</span>
                </div>

            </div>

            <div class="gear-wrap">
                <button class="gear" type="button">${ICONOS.engranaje}▾</button>
                <div class="menu">
                    <a class="menu-ver">Ver grupo</a>
                    <a class="menu-copiar">Copiar enlace</a>
                </div>
            </div>

        </div>

        <div class="card-desc">${esc(g.descripcion)}</div>

        <div class="card-foot">
            <button class="join" type="button">${ICONOS.entrar}${esc(etiquetaBoton(g))}</button>
        </div>
    `;

    // Imágenes (se asignan por propiedad, no dentro del HTML, para no inyectar texto en atributos)

    const banner = card.querySelector(".card-banner img");

    if (g.banner) {

        banner.src = g.banner;
        banner.onerror = () => { banner.style.display = "none"; };

    } else {

        banner.style.display = "none";

    }

    const icono = card.querySelector(".card-icon");
    icono.src = g.icono || AVATAR_POR_DEFECTO;
    icono.onerror = () => { icono.src = AVATAR_POR_DEFECTO; };

    // Menú del engranaje

    const menu = card.querySelector(".menu");

    card.querySelector(".gear").addEventListener("click", (e) => {

        e.stopPropagation();

        const estabaAbierto = menu.classList.contains("open");

        cerrarMenus();

        if (!estabaAbierto) menu.classList.add("open");

    });

    card.querySelector(".menu-ver").addEventListener("click", () => irAlGrupo(g.slug));

    const copiar = card.querySelector(".menu-copiar");

    copiar.addEventListener("click", (e) => {

        e.stopPropagation();

        const url = new URL(
            `group.html?slug=${encodeURIComponent(g.slug)}`,
            window.location.href
        ).href;

        if (navigator.clipboard && navigator.clipboard.writeText) {

            navigator.clipboard.writeText(url).then(() => {

                copiar.textContent = "¡Enlace copiado!";

                setTimeout(() => {
                    copiar.textContent = "Copiar enlace";
                    cerrarMenus();
                }, 1200);

            }).catch(() => {
                window.prompt("Copia este enlace:", url);
            });

        } else {

            window.prompt("Copia este enlace:", url);

        }

    });

    // Botón de unirse / entrar

    card.querySelector(".join").addEventListener("click", () => irAlGrupo(g.slug));

    return card;

}


function renderCards() {

    const contenedor = document.getElementById("groupsContainer");

    contenedor.innerHTML = "";

    if (grupos.length === 0) {

        contenedor.innerHTML = `<p class="side-vacio">Todavía no hay grupos creados.</p>`;
        return;

    }

    ordenarGrupos(grupos).forEach(g => contenedor.appendChild(crearCard(g)));

}


/* ==========================
   CARGA INICIAL
========================== */

async function cargarGrupos() {

    const contenedor = document.getElementById("groupsContainer");

    try {

        await cargarEstadoUsuario();

        const respuesta = await fetch("/api/groups");
        const datos = await respuesta.json();

        if (!Array.isArray(datos)) {

            contenedor.innerHTML = `<p class="side-vacio">Error cargando grupos.</p>`;
            return;

        }

        grupos = datos;

        renderSidebar();
        renderCards();

    } catch (error) {

        console.error("❌ Error cargando grupos:", error);

        contenedor.innerHTML = `<p class="side-vacio">Error cargando grupos.</p>`;

    }

}


/* ==========================
   MENÚ "ORDENAR"
========================== */

const ordenBtn = document.getElementById("ordenBtn");
const ordenMenu = document.getElementById("ordenMenu");

ordenBtn.addEventListener("click", (e) => {

    e.stopPropagation();

    const estabaAbierto = ordenMenu.classList.contains("open");

    cerrarMenus();

    if (!estabaAbierto) ordenMenu.classList.add("open");

});

ordenMenu.querySelectorAll("a").forEach(opcion => {

    opcion.addEventListener("click", (e) => {

        e.preventDefault();

        orden = opcion.getAttribute("data-orden");

        ordenBtn.textContent = `${opcion.textContent} ▾`;

        cerrarMenus();
        renderCards();

    });

});

// Un clic fuera de cualquier menú los cierra

document.addEventListener("click", cerrarMenus);


cargarGrupos();
