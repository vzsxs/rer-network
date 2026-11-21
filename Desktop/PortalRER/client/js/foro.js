/* ==========================================================
   ⚙️ CONFIGURACIÓN: edita SOLO esto
   ========================================================== */

const CONFIG = {

    // Tu enlace de invitación de Discord
    discordUrl: "https://discord.gg/TU_INVITE_AQUI",

    // Datos de la vista "Enlace del juego"
    juego: {
        url: "https://www.roblox.com/games/TU_GAME_ID",
        titulo: "Hamburgo, 1934",
        autor: "@admin",
        madurez: "Madurez: Moderada · Edades 13+"
    }

};


/* ==========================================================
   SESIÓN Y UTILIDADES
   ========================================================== */

const token = localStorage.getItem("token");
const miID = localStorage.getItem("usuarioID");
const miNombre = localStorage.getItem("usuarioNombre");

const AVATAR_POR_DEFECTO =
    "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="256" height="256">
        <rect width="256" height="256" fill="#2a2b30"/>
        <circle cx="128" cy="96" r="48" fill="#50545c"/>
        <path d="M40 220 C40 160 90 140 128 140 C166 140 216 160 216 220 Z" fill="#50545c"/>
    </svg>
    `);

function authHeaders() {

    return token ? { "Authorization": `Bearer ${token}` } : {};

}

function enlacePerfil(id) {

    return `perfil.html?id=${encodeURIComponent(id)}`;

}

function formatearFechaChat(iso) {

    const f = new Date(iso);
    const hoy = new Date();

    const hora = f.toLocaleTimeString("es-CO", { hour: "numeric", minute: "2-digit" });

    if (f.toDateString() === hoy.toDateString()) {
        return `Hoy a las ${hora}`;
    }

    const ayer = new Date(hoy);
    ayer.setDate(hoy.getDate() - 1);

    if (f.toDateString() === ayer.toDateString()) {
        return `Ayer a las ${hora}`;
    }

    const dias = (hoy - f) / 86400000;

    if (dias < 6) {

        const dia = f.toLocaleDateString("es-CO", { weekday: "long" });

        return `${dia.charAt(0).toUpperCase()}${dia.slice(1)} a las ${hora}`;

    }

    return `${f.toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" })} a las ${hora}`;

}

// Pinta la imagen de fondo de un círculo de avatar, o la inicial si no tiene foto

function pintarAvatar(elemento, nombre, avatarUrl) {

    if (avatarUrl) {

        elemento.style.backgroundImage = `url(${JSON.stringify(avatarUrl)})`;
        elemento.textContent = "";

    } else {

        elemento.textContent = (nombre || "?").charAt(0).toUpperCase();

    }

}


/* ==========================================================
   CONFIGURACIÓN → PÁGINA
   ========================================================== */

function aplicarConfig() {

    document.getElementById("infoDiscord").href = CONFIG.discordUrl;

    document.getElementById("juegoPlay").href = CONFIG.juego.url;
    document.getElementById("juegoTitulo").textContent = CONFIG.juego.titulo;
    document.getElementById("juegoAutor").textContent = CONFIG.juego.autor;
    document.getElementById("juegoMadurez").textContent = CONFIG.juego.madurez;

}


/* ==========================================================
   NAVBAR: usuario actual
   ========================================================== */

function iniciarNavUsuario() {

    const pill = document.getElementById("userPill");
    const nombre = document.getElementById("navNombre");
    const avatar = document.getElementById("navAvatar");

    if (!token || !miNombre) {

        nombre.textContent = "Iniciar sesión";
        pill.href = "index.html";
        avatar.style.display = "none";
        return;

    }

    nombre.textContent = miNombre;
    pintarAvatar(avatar, miNombre, null);

    fetch(`/api/users/${encodeURIComponent(miID)}`)
        .then(r => r.json())
        .then(u => {
            if (u && u.avatar_url) {
                pintarAvatar(avatar, miNombre, u.avatar_url);
            }
        })
        .catch(() => {});

}


/* ==========================================================
   VISTAS (Chat / Miembros / Vincular / Juego)
   ========================================================== */

const cabeceraForo = document.getElementById("cabeceraForo");
const tituloPagina = document.getElementById("tituloPagina");

function ocultarVistas() {

    document.getElementById("vistaChat").style.display = "none";
    document.getElementById("vistaMiembros").style.display = "none";
    document.getElementById("vistaVincular").style.display = "none";
    document.getElementById("vistaJuego").style.display = "none";

}

function marcarNavegacion(vista) {

    document.querySelectorAll("nav a").forEach(a => a.classList.remove("active"));

    document
        .getElementById(vista === "miembros" ? "navMiembros" : "navForo")
        .classList.add("active");

    document.getElementById("subChat").classList.toggle("activo", vista === "chat");
    document.getElementById("subMiembros").classList.toggle("activo", vista === "miembros");

}

function mostrar(vista) {

    ocultarVistas();

    document.getElementById(vista === "miembros" ? "vistaMiembros" : "vistaChat").style.display = "block";

    cabeceraForo.style.display = "block";
    tituloPagina.textContent = vista === "miembros" ? "Miembros" : "Foro general";

    marcarNavegacion(vista);

    if (vista === "miembros") {
        cargarMiembros();
    }

    window.scrollTo(0, 0);

}

function mostrarVincular() {

    ocultarVistas();

    cabeceraForo.style.display = "none";
    document.getElementById("vistaVincular").style.display = "block";

    window.scrollTo(0, 0);

}

function mostrarJuego() {

    ocultarVistas();

    cabeceraForo.style.display = "none";
    document.getElementById("vistaJuego").style.display = "block";

    window.scrollTo(0, 0);

}

function ocultarVincular() {

    mostrar("chat");

}

function irAInformacion() {

    mostrar("chat");

    document.getElementById("panelInfo").scrollIntoView({ behavior: "smooth" });

}


/* ==========================================================
   CHAT
   ========================================================== */

const mensajesContainer = document.getElementById("mensajesContainer");
const chatForm = document.getElementById("chatForm");
const mensajeInput = document.getElementById("mensajeInput");
const chatContador = document.getElementById("chatContador");

let mensajesCache = [];
let ultimaFirma = "";
let textoBusqueda = "";
let bajarAlRenderizar = true;

function firmaMensajes(lista) {

    return lista.length ? `${lista.length}:${lista[lista.length - 1].id}` : "0";

}

function renderizarMensajes() {

    // Solo bajamos solos si el usuario ya estaba leyendo el final del chat

    const estabaAbajo =
        mensajesContainer.scrollHeight - mensajesContainer.scrollTop - mensajesContainer.clientHeight < 80;

    let lista = mensajesCache;

    if (textoBusqueda) {

        lista = lista.filter(m => {

            const texto = (m.mensaje || "").toLowerCase();
            const autor = m.users ? m.users.nombre.toLowerCase() : "";

            return texto.includes(textoBusqueda) || autor.includes(textoBusqueda);

        });

    }

    mensajesContainer.innerHTML = "";

    if (lista.length === 0) {

        const vacio = document.createElement("p");
        vacio.className = "cargando";
        vacio.textContent = textoBusqueda
            ? "No hay mensajes que coincidan con tu búsqueda."
            : "Aún no hay mensajes. ¡Sé el primero!";

        mensajesContainer.appendChild(vacio);
        bajarAlRenderizar = false;
        return;

    }

    lista.forEach(m => {

        const usuario = m.users;
        const nombreTexto = usuario ? usuario.nombre : "Usuario eliminado";

        const fila = document.createElement("div");
        fila.className = "msg-fila";

        // Avatar

        const avatarLink = document.createElement(usuario ? "a" : "span");
        avatarLink.className = "msg-avatar-link";

        if (usuario) avatarLink.href = enlacePerfil(usuario.id);

        const img = document.createElement("img");
        img.className = "msg-avatar";
        img.alt = "";
        img.src = (usuario && usuario.avatar_url) ? usuario.avatar_url : AVATAR_POR_DEFECTO;

        avatarLink.appendChild(img);

        // Nombre

        const nombre = document.createElement(usuario ? "a" : "span");
        nombre.className = "msg-nombre";
        nombre.textContent = nombreTexto;

        if (usuario) nombre.href = enlacePerfil(usuario.id);

        // Mensaje + hora (la hora solo se ve al pasar el mouse)

        const cuerpo = document.createElement("div");
        cuerpo.className = "msg-cuerpo";

        const texto = document.createElement("span");
        texto.className = "msg-texto";
        texto.textContent = m.mensaje;

        const hora = document.createElement("span");
        hora.className = "msg-hora";
        hora.textContent = formatearFechaChat(m.created_at);

        cuerpo.appendChild(texto);
        cuerpo.appendChild(hora);

        fila.appendChild(avatarLink);
        fila.appendChild(nombre);
        fila.appendChild(cuerpo);

        mensajesContainer.appendChild(fila);

    });

    if (bajarAlRenderizar || estabaAbajo) {

        mensajesContainer.scrollTop = mensajesContainer.scrollHeight;
        bajarAlRenderizar = false;

    }

}

async function cargarMensajes() {

    try {

        const respuesta = await fetch("/api/chat/mensajes", { headers: authHeaders() });
        const mensajes = await respuesta.json();

        if (!Array.isArray(mensajes)) return;

        // Solo redibujamos si llegó algo nuevo

        const firma = firmaMensajes(mensajes);

        if (firma !== ultimaFirma) {

            ultimaFirma = firma;
            mensajesCache = mensajes;
            renderizarMensajes();

        }

    } catch (error) {

        console.error(error);

    }

}

function actualizarContador() {

    chatContador.textContent = `${mensajeInput.value.length} / 500`;

}

async function enviarMensaje(e) {

    if (e) e.preventDefault();

    const texto = mensajeInput.value.trim();

    if (!texto) return;

    if (!token) {

        alert("Debes iniciar sesión para escribir en el chat.");
        return;

    }

    mensajeInput.disabled = true;

    try {

        const respuesta = await fetch("/api/chat/mensajes", {

            method: "POST",

            headers: {
                "Content-Type": "application/json",
                ...authHeaders()
            },

            body: JSON.stringify({ mensaje: texto })

        });

        const datos = await respuesta.json();

        if (!respuesta.ok) {

            alert(datos.error || "No se pudo enviar el mensaje.");
            return;

        }

        mensajeInput.value = "";
        actualizarContador();

        bajarAlRenderizar = true;

        await cargarMensajes();

    } catch (error) {

        console.error(error);
        alert("Error de conexión al enviar el mensaje.");

    } finally {

        mensajeInput.disabled = false;
        mensajeInput.focus();

    }

}

chatForm.addEventListener("submit", enviarMensaje);

// Enter envía; Shift+Enter hace un salto de línea

mensajeInput.addEventListener("keydown", (e) => {

    if (e.key === "Enter" && !e.shiftKey) {

        e.preventDefault();
        enviarMensaje();

    }

});

mensajeInput.addEventListener("input", actualizarContador);


/* ==========================================================
   BÚSQUEDA EN EL CHAT
   ========================================================== */

const chatBusqueda = document.getElementById("chatBusqueda");
const chatBuscarInput = document.getElementById("chatBuscarInput");

function abrirBusqueda() {

    mostrar("chat");

    chatBusqueda.style.display = "block";
    chatBuscarInput.focus();

}

function cerrarBusqueda() {

    chatBuscarInput.value = "";
    textoBusqueda = "";
    chatBusqueda.style.display = "none";

    renderizarMensajes();

}

chatBuscarInput.addEventListener("input", () => {

    textoBusqueda = chatBuscarInput.value.trim().toLowerCase();

    renderizarMensajes();

});

chatBuscarInput.addEventListener("keydown", (e) => {

    if (e.key === "Escape") cerrarBusqueda();

});


/* ==========================================================
   BOTONES DEL TÍTULO Y DE LA BARRA SECUNDARIA
   ========================================================== */

document.getElementById("btnNuevos").addEventListener("click", () => {

    mostrar("chat");

    mensajesContainer.scrollTop = mensajesContainer.scrollHeight;

    cargarMensajes();

});

document.getElementById("btnEscribir").addEventListener("click", () => {

    mostrar("chat");

    mensajeInput.focus();
    mensajeInput.scrollIntoView({ behavior: "smooth", block: "center" });

});

document.getElementById("navBuscarBtn").addEventListener("click", abrirBusqueda);

document.getElementById("subBuscar").addEventListener("click", (e) => {

    e.preventDefault();
    abrirBusqueda();

});

document.getElementById("subInfo").addEventListener("click", (e) => {

    e.preventDefault();
    irAInformacion();

});


/* ==========================================================
   MIEMBROS
   ========================================================== */

async function cargarMiembros() {

    const grid = document.getElementById("miembrosGrid");

    try {

        const respuesta = await fetch("/api/users");
        const usuarios = await respuesta.json();

        if (!Array.isArray(usuarios)) {

            grid.innerHTML = `<p class="vacio">Error cargando miembros.</p>`;
            return;

        }

        grid.innerHTML = "";

        usuarios.forEach(usuario => {

            const card = document.createElement("div");
            card.className = "miembro-card";

            const img = document.createElement("img");
            img.className = "miembro-avatar-grande";
            img.alt = "";
            img.src = usuario.avatar_url || AVATAR_POR_DEFECTO;

            const nombre = document.createElement("h3");
            nombre.textContent = usuario.nombre;

            const grupo = document.createElement("p");
            grupo.textContent = usuario.grupo
                ? `${usuario.grupo} — ${usuario.rango}`
                : "Sin grupo asignado";

            card.appendChild(img);
            card.appendChild(nombre);
            card.appendChild(grupo);

            card.addEventListener("click", () => {
                window.location.href = enlacePerfil(usuario.id);
            });

            grid.appendChild(card);

        });

    } catch (error) {

        console.error(error);
        grid.innerHTML = `<p class="vacio">Error cargando miembros.</p>`;

    }

}


/* ==========================================================
   WIDGETS: en línea y estadísticas
   ========================================================== */

async function cargarOnline() {

    const staffBox = document.getElementById("staffOnline");
    const miembrosBox = document.getElementById("miembrosOnline");
    const totalBox = document.getElementById("totalOnline");

    try {

        const respuesta = await fetch("/api/users/online");
        const datos = await respuesta.json();

        const staff = datos.staff || [];
        const miembros = datos.miembros || [];

        // Staff

        staffBox.innerHTML = "";

        if (staff.length === 0) {

            staffBox.innerHTML = `<p class="vacio">Nadie del staff en línea.</p>`;

        } else {

            staff.forEach(u => {

                const fila = document.createElement("div");
                fila.className = "staff-fila";

                const avatar = document.createElement("div");
                avatar.className = "staff-avatar";
                pintarAvatar(avatar, u.nombre, u.avatar_url);

                const textos = document.createElement("div");

                const nombre = document.createElement("a");
                nombre.className = "staff-nombre";
                nombre.href = enlacePerfil(u.id);
                nombre.textContent = u.nombre;

                const rol = document.createElement("div");
                rol.className = "staff-rol";
                rol.textContent = "Administrador";

                textos.appendChild(nombre);
                textos.appendChild(rol);

                fila.appendChild(avatar);
                fila.appendChild(textos);

                staffBox.appendChild(fila);

            });

        }

        // Miembros

        miembrosBox.innerHTML = "";

        if (miembros.length === 0) {

            miembrosBox.innerHTML = `<p class="vacio">Nadie en línea en este momento.</p>`;

        } else {

            const lista = document.createElement("div");
            lista.className = "lista-online";

            miembros.forEach((u, i) => {

                const enlace = document.createElement("a");
                enlace.href = enlacePerfil(u.id);
                enlace.textContent = u.nombre;

                lista.appendChild(enlace);

                if (i < miembros.length - 1) {
                    lista.appendChild(document.createTextNode(", "));
                }

            });

            miembrosBox.appendChild(lista);

        }

        totalBox.textContent = `Total: ${miembros.length} (activos en los últimos 5 minutos)`;

    } catch (error) {

        console.error(error);

    }

}

async function cargarStats() {

    try {

        const respuesta = await fetch("/api/users/stats");
        const datos = await respuesta.json();

        if (!respuesta.ok) return;

        document.getElementById("statNoticias").textContent = datos.noticias;
        document.getElementById("statMensajes").textContent = datos.mensajes;
        document.getElementById("statMiembros").textContent = datos.miembros;

        const ultimo = document.getElementById("statUltimo");

        ultimo.innerHTML = "";

        if (datos.ultimoMiembro) {

            const enlace = document.createElement("a");
            enlace.href = enlacePerfil(datos.ultimoMiembro.id);
            enlace.style.color = "#e6e6e6";
            enlace.style.textDecoration = "none";
            enlace.textContent = datos.ultimoMiembro.nombre;

            ultimo.appendChild(enlace);

        } else {

            ultimo.textContent = "—";

        }

    } catch (error) {

        console.error(error);

    }

}


/* ==========================================================
   COMPARTIR (copiar enlace de esta página)
   ========================================================== */

document.getElementById("copiarEnlaceBtn").addEventListener("click", () => {

    const url = window.location.href.split("#")[0].split("?")[0];
    const etiqueta = document.getElementById("copiarEnlaceTexto");

    const confirmar = () => {

        etiqueta.textContent = "¡Enlace copiado!";

        setTimeout(() => { etiqueta.textContent = "Copiar enlace"; }, 1500);

    };

    if (navigator.clipboard && navigator.clipboard.writeText) {

        navigator.clipboard.writeText(url).then(confirmar).catch(() => {
            window.prompt("Copia este enlace:", url);
        });

    } else {

        window.prompt("Copia este enlace:", url);

    }

});


/* ==========================================================
   VINCULAR ROBLOX
   ========================================================== */

const robloxLinkBtn = document.getElementById("robloxLinkBtn");
const robloxProfileLink = document.getElementById("robloxProfileLink");
const robloxStatus = document.getElementById("robloxStatus");

robloxLinkBtn.addEventListener("click", async () => {

    if (!token) {

        robloxStatus.style.color = "#f28b82";
        robloxStatus.textContent = "❌ Debes iniciar sesión primero.";
        return;

    }

    const profileLink = robloxProfileLink.value.trim();

    if (!profileLink) {

        robloxStatus.style.color = "#f28b82";
        robloxStatus.textContent = "❌ Pega primero el enlace de tu perfil de Roblox.";
        return;

    }

    robloxStatus.style.color = "#b8bac0";
    robloxStatus.textContent = "⏳ Verificando cuenta de Roblox...";

    try {

        const respuesta = await fetch("/api/roblox/link", {

            method: "POST",

            headers: {
                "Content-Type": "application/json",
                ...authHeaders()
            },

            body: JSON.stringify({ profileLink })

        });

        const datos = await respuesta.json();

        if (!respuesta.ok) {

            robloxStatus.style.color = "#f28b82";
            robloxStatus.textContent = "❌ " + (datos.error || "No se pudo vincular la cuenta.");
            return;

        }

        robloxStatus.style.color = "#8fd39a";
        robloxStatus.textContent = `✅ Roblox vinculado: ${datos.robloxName}`;

    } catch (error) {

        console.error(error);

        robloxStatus.style.color = "#f28b82";
        robloxStatus.textContent = "❌ No se pudo conectar con el servidor.";

    }

});


/* ==========================================================
   INICIO
   ========================================================== */

aplicarConfig();
iniciarNavUsuario();
actualizarContador();

cargarMensajes();
cargarStats();
cargarOnline();

setInterval(cargarMensajes, 4000);
setInterval(cargarOnline, 30000);
setInterval(cargarStats, 60000);

// Los demás enlaces del sitio abren esta página con ?tab=miembros

if (new URLSearchParams(window.location.search).get("tab") === "miembros") {

    mostrar("miembros");

}
