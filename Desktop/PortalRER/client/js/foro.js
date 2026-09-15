const token = localStorage.getItem("token");
const miID = localStorage.getItem("usuarioID");

const AVATAR_POR_DEFECTO =
    "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="256" height="256">
        <rect width="256" height="256" fill="#2a2b30"/>
        <circle cx="128" cy="96" r="48" fill="#50545c"/>
        <path d="M40 220 C40 160 90 140 128 140 C166 140 216 160 216 220 Z" fill="#50545c"/>
    </svg>
    `);


/* ==========================
   CAMBIAR DE VISTA (Foro / Miembros / Vincular)
========================== */

function mostrar(vista, el){

    document.getElementById("vistaChat").style.display = vista === "chat" ? "block" : "none";
    document.getElementById("vistaMiembros").style.display = vista === "miembros" ? "block" : "none";
    document.getElementById("vistaVincular").style.display = "none";

    document.querySelectorAll("nav a").forEach(a => a.classList.remove("active"));

    if (el) el.classList.add("active");

    if (vista === "miembros") {
        cargarMiembros();
    }

}

function mostrarVincular(){

    document.getElementById("vistaChat").style.display = "none";
    document.getElementById("vistaMiembros").style.display = "none";
    document.getElementById("vistaVincular").style.display = "block";

}

function ocultarVincular(){

    mostrar("chat", document.querySelector("nav a.active") || document.querySelectorAll("nav a")[1]);

}


/* ==========================
   CHAT
========================== */

const mensajesContainer = document.getElementById("mensajesContainer");
const chatForm = document.getElementById("chatForm");
const mensajeInput = document.getElementById("mensajeInput");


function formatearHora(fechaISO) {

    const fecha = new Date(fechaISO);

    return fecha.toLocaleTimeString("es-CO", {
        hour: "2-digit",
        minute: "2-digit"
    });

}


function renderizarMensajes(mensajes) {

    if (!mensajes || mensajes.length === 0) {

        mensajesContainer.innerHTML = `<p class="cargando">Aún no hay mensajes. ¡Sé el primero!</p>`;
        return;

    }

    mensajesContainer.innerHTML = "";

    mensajes.forEach(m => {

        const nombre = m.users ? m.users.nombre : "Usuario eliminado";
        const avatar = (m.users && m.users.avatar_url) ? m.users.avatar_url : AVATAR_POR_DEFECTO;

        const fila = document.createElement("div");
        fila.className = "mensaje-fila";

        fila.innerHTML = `
            <img src="${avatar}" class="mensaje-avatar" alt="${nombre}">
            <div class="mensaje-contenido">
                <div class="mensaje-header">
                    <span class="mensaje-nombre">${nombre}</span>
                    <span class="mensaje-hora">${formatearHora(m.created_at)}</span>
                </div>
                <p class="mensaje-texto"></p>
            </div>
        `;

        fila.querySelector(".mensaje-texto").textContent = m.mensaje;

        mensajesContainer.appendChild(fila);

    });

    mensajesContainer.scrollTop = mensajesContainer.scrollHeight;

}


async function cargarMensajes() {

    try {

        const respuesta = await fetch("/api/chat/mensajes");
        const mensajes = await respuesta.json();

        if (Array.isArray(mensajes)) {

            renderizarMensajes(mensajes);
            document.getElementById("statMensajes").textContent = mensajes.length;

        }

    } catch (error) {

        console.error(error);

    }

}


async function enviarMensaje(e) {

    e.preventDefault();

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
                "Authorization": `Bearer ${token}`
            },

            body: JSON.stringify({ mensaje: texto })

        });

        const datos = await respuesta.json();

        if (!respuesta.ok) {

            alert(datos.error || "No se pudo enviar el mensaje.");
            return;

        }

        mensajeInput.value = "";

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


/* ==========================
   MIEMBROS
========================== */

let miembrosCargados = false;

async function cargarMiembros() {

    const grid = document.getElementById("miembrosGrid");

    try {

        const respuesta = await fetch("/api/users");
        const usuarios = await respuesta.json();

        if (!Array.isArray(usuarios)) {

            grid.innerHTML = "<p>Error cargando miembros.</p>";
            return;

        }

        grid.innerHTML = "";

        usuarios.forEach(usuario => {

            const avatar = usuario.avatar_url || AVATAR_POR_DEFECTO;

            const grupoTexto = usuario.grupo
                ? `${usuario.grupo} — ${usuario.rango}`
                : "Sin grupo asignado";

            const card = document.createElement("div");

            card.className = "miembro-card";

            card.innerHTML = `
                <img src="${avatar}" alt="${usuario.nombre}" class="miembro-avatar-grande">
                <h3>${usuario.nombre}</h3>
                <p>${grupoTexto}</p>
            `;

            card.addEventListener("click", () => {
                window.location.href = `perfil.html?id=${usuario.id}`;
            });

            grid.appendChild(card);

        });

        document.getElementById("statMiembros").textContent = usuarios.length;

        document.getElementById("statsMiembros").textContent =
            `${usuarios.length} miembro${usuarios.length === 1 ? "" : "s"} registrados`;

    } catch (error) {

        console.error(error);
        grid.innerHTML = "<p>Error cargando miembros.</p>";

    }

}


/* ==========================
   VINCULAR ROBLOX
========================== */

const robloxLinkBtn = document.getElementById("robloxLinkBtn");
const robloxProfileLink = document.getElementById("robloxProfileLink");
const robloxStatus = document.getElementById("robloxStatus");

if (robloxLinkBtn) {

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
                    "Authorization": `Bearer ${token}`
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

}


/* ==========================
   INICIO
========================== */

cargarMensajes();
cargarMiembros(); // para tener las estadísticas del sidebar desde ya

setInterval(cargarMensajes, 4000);
