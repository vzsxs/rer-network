// ===========================
// PROTEGER PANEL ADMIN
// ===========================

const usuarioRol = localStorage.getItem("usuarioRol");
const token = localStorage.getItem("token");

const nombreUsuario = document.getElementById("nombreUsuario");
const rolUsuario = document.getElementById("rolUsuario");
const nombreMini = document.getElementById("nombreMini");

const usuarioNombre = localStorage.getItem("usuarioNombre");

if (nombreUsuario) nombreUsuario.textContent = usuarioNombre || "Usuario";
if (rolUsuario) rolUsuario.textContent = usuarioRol || "Sin rol";
if (nombreMini) nombreMini.textContent = usuarioNombre || "Administrador";

if (!token || !usuarioRol) {
    window.location.href = "/login.html";
}

if (usuarioRol.toLowerCase() !== "admin") {
    alert("No tienes permisos para acceder al panel.");
    window.location.href = "/dashboard.html";
}


// Header reutilizable con el token, para todas las peticiones admin

function authHeaders(extra = {}) {

    return {
        "Authorization": `Bearer ${token}`,
        ...extra
    };

}


// ===========================
// CARGAR SOLICITUDES
// ===========================

async function cargarSolicitudes() {

    const contenedor = document.getElementById("requestsContainer");

    if (!contenedor) return;

    try {

        const respuesta = await fetch("/api/admin/requests", {
            headers: authHeaders()
        });

        const solicitudes = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(solicitudes.error || "Error en la API");
        }

        contenedor.innerHTML = "";

        if (solicitudes.length === 0) {

            contenedor.innerHTML = `
            <div class="request-card">
                <h3>No hay solicitudes pendientes</h3>
                <p>Actualmente no existen solicitudes nuevas.</p>
            </div>
            `;

            return;

        }

        solicitudes.forEach(solicitud => {

            const usuario = solicitud.users?.nombre || "Usuario desconocido";
            const email = solicitud.users?.email || "Sin correo";
            const grupo = solicitud.groups?.nombre || "Grupo desconocido";

            contenedor.innerHTML += `
            <div class="request-card">
                <h2>👤 ${usuario}</h2>
                <p>📧 ${email}</p>
                <p>🛡 ${grupo}</p>
                <p>Estado: <b>${solicitud.estado}</b></p>
                <button class="accept" onclick="aceptarSolicitud('${solicitud.id}')">Aceptar</button>
                <button class="deny" onclick="rechazarSolicitud('${solicitud.id}')">Denegar</button>
            </div>
            `;

        });

    } catch (error) {

        console.error(error);

        contenedor.innerHTML = `
        <div class="request-card">
            <h3>Error cargando solicitudes</h3>
            <p>${error.message}</p>
        </div>
        `;

    }

}


async function aceptarSolicitud(id) {

    try {

        const respuesta = await fetch(`/api/admin/requests/${id}/accept`, {
            method: "PUT",
            headers: authHeaders()
        });

        const data = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(data.error || "Error aceptando solicitud");
        }

        alert("Solicitud aceptada correctamente ✅");
        cargarSolicitudes();

    } catch (error) {

        console.error("Error aceptando:", error);
        alert(error.message);

    }

}


async function rechazarSolicitud(id) {

    try {

        const respuesta = await fetch(`/api/admin/requests/${id}/deny`, {
            method: "PUT",
            headers: authHeaders()
        });

        const data = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(data.error || "Error rechazando solicitud");
        }

        alert("Solicitud rechazada ❌");
        cargarSolicitudes();

    } catch (error) {

        console.error("Error rechazando:", error);
        alert(error.message);

    }

}


// ===========================
// CARGAR GRUPOS (select compartido)
// ===========================

async function cargarGrupos() {

    const select = document.getElementById("groupSelect");

    if (!select) return;

    try {

        const respuesta = await fetch("/api/groups");
        const grupos = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(grupos.error || "Error cargando grupos");
        }

        select.innerHTML = `<option value="">Selecciona un grupo</option>`;

        grupos.forEach(grupo => {

            select.innerHTML += `
                <option value="${grupo.id}">${grupo.nombre}</option>
            `;

        });

    } catch (error) {

        console.error("Error cargando grupos:", error);

    }

}


const groupSelect = document.getElementById("groupSelect");

if (groupSelect) {

    groupSelect.addEventListener("change", () => {

        const groupId = groupSelect.value;

        if (groupId) {

            cargarMiembros(groupId);
            cargarReglamento(groupId);
            cargarAnunciosAdmin(groupId);

        }

    });

}


// ===========================
// MIEMBROS Y RANGOS
// ===========================

async function cargarMiembros(groupId) {

    const contenedor = document.getElementById("membersContainer");

    if (!contenedor) return;

    contenedor.innerHTML = `<div class="request-card">Cargando miembros...</div>`;

    try {

        const respuesta = await fetch(`/api/admin/members/${groupId}`, {
            headers: authHeaders()
        });

        const miembros = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(miembros.error || "Error cargando miembros");
        }

        const rangosRespuesta = await fetch(`/api/admin/ranks/${groupId}`, {
            headers: authHeaders()
        });

        const rangos = await rangosRespuesta.json();

        contenedor.innerHTML = "";

        if (miembros.length === 0) {

            contenedor.innerHTML = `<div class="request-card"><h3>No hay miembros</h3></div>`;
            return;

        }

        miembros.forEach(miembro => {

            let opciones = "";

            rangos.forEach(rango => {

                opciones += `
                <option value="${rango.nombre}" ${miembro.rango === rango.nombre ? "selected" : ""}>
                    ${rango.nombre}
                </option>
                `;

            });

            contenedor.innerHTML += `
            <div class="request-card">
                <h2>${miembro.users.nombre}</h2>
                <p>${miembro.users.email}</p>
                <p>Rango actual: <b>${miembro.rango}</b></p>
                <select id="rango_${miembro.id}">${opciones}</select>
                <br><br>
                <button onclick="cambiarRango('${miembro.id}')">Guardar rango</button>
            </div>
            `;

        });

    } catch (error) {

        console.error("Error cargando miembros:", error);

        contenedor.innerHTML = `<div class="request-card">${error.message}</div>`;

    }

}


async function cambiarRango(memberId) {

    const select = document.getElementById(`rango_${memberId}`);

    if (!select) return;

    const rango = select.value;

    try {

        const respuesta = await fetch(`/api/admin/member/${memberId}/rank`, {

            method: "PUT",

            headers: authHeaders({ "Content-Type": "application/json" }),

            body: JSON.stringify({ rango })

        });

        const data = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(data.error || "Error cambiando rango");
        }

        alert("Rango actualizado correctamente ✅");

    } catch (error) {

        console.error("Error cambiando rango:", error);
        alert(error.message);

    }

}


// ===========================
// REGLAMENTO DEL GRUPO
// ===========================

async function cargarReglamento(groupId) {

    const textarea = document.getElementById("reglamentoTextarea");
    const mensaje = document.getElementById("reglamentoMensaje");

    if (!textarea) return;

    mensaje.textContent = "";
    textarea.value = "Cargando...";

    try {

        const grupos = await fetch("/api/groups").then(r => r.json());

        const grupo = grupos.find(g => g.id === groupId);

        textarea.value = (grupo && grupo.reglamento) || "";

    } catch (error) {

        console.error(error);
        textarea.value = "";

    }

}


async function guardarReglamento() {

    const groupId = document.getElementById("groupSelect").value;
    const textarea = document.getElementById("reglamentoTextarea");
    const mensaje = document.getElementById("reglamentoMensaje");

    if (!groupId) {

        mensaje.textContent = "❌ Selecciona un grupo primero.";
        return;

    }

    try {

        const respuesta = await fetch(`/api/admin/groups/${groupId}/reglamento`, {

            method: "PUT",

            headers: authHeaders({ "Content-Type": "application/json" }),

            body: JSON.stringify({ reglamento: textarea.value })

        });

        const data = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(data.error || "Error guardando el reglamento");
        }

        mensaje.style.color = "#8fd39a";
        mensaje.textContent = "✅ Reglamento guardado.";

    } catch (error) {

        console.error(error);
        mensaje.style.color = "#f28b82";
        mensaje.textContent = "❌ " + error.message;

    }

}


// ===========================
// ANUNCIOS DEL GRUPO
// ===========================

async function cargarAnunciosAdmin(groupId) {

    const contenedor = document.getElementById("anunciosContainer");

    if (!contenedor) return;

    contenedor.innerHTML = `<div class="request-card">Cargando anuncios...</div>`;

    try {

        const respuesta = await fetch(`/api/admin/announcements/${groupId}`, {
            headers: authHeaders()
        });

        const anuncios = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(anuncios.error || "Error cargando anuncios");
        }

        if (anuncios.length === 0) {

            contenedor.innerHTML = `<div class="request-card"><p>Este grupo aún no tiene anuncios.</p></div>`;
            return;

        }

        contenedor.innerHTML = "";

        anuncios.forEach(a => {

            contenedor.innerHTML += `
            <div class="request-card">
                <h2>${a.titulo}</h2>
                <p>${a.contenido || ""}</p>
                <button class="deny" onclick="borrarAnuncio('${a.id}', '${groupId}')">Eliminar</button>
            </div>
            `;

        });

    } catch (error) {

        console.error(error);
        contenedor.innerHTML = `<div class="request-card">${error.message}</div>`;

    }

}


async function publicarAnuncio() {

    const groupId = document.getElementById("groupSelect").value;
    const titulo = document.getElementById("anuncioTitulo");
    const contenido = document.getElementById("anuncioContenido");
    const mensaje = document.getElementById("anuncioMensaje");

    if (!groupId) {

        mensaje.textContent = "❌ Selecciona un grupo primero.";
        return;

    }

    if (!titulo.value.trim()) {

        mensaje.textContent = "❌ El anuncio necesita un título.";
        return;

    }

    try {

        const respuesta = await fetch(`/api/admin/announcements/${groupId}`, {

            method: "POST",

            headers: authHeaders({ "Content-Type": "application/json" }),

            body: JSON.stringify({
                titulo: titulo.value,
                contenido: contenido.value
            })

        });

        const data = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(data.error || "Error publicando el anuncio");
        }

        mensaje.style.color = "#8fd39a";
        mensaje.textContent = "✅ Anuncio publicado.";

        titulo.value = "";
        contenido.value = "";

        cargarAnunciosAdmin(groupId);

    } catch (error) {

        console.error(error);
        mensaje.style.color = "#f28b82";
        mensaje.textContent = "❌ " + error.message;

    }

}


async function borrarAnuncio(id, groupId) {

    if (!confirm("¿Eliminar este anuncio?")) return;

    try {

        const respuesta = await fetch(`/api/admin/announcements/${id}`, {
            method: "DELETE",
            headers: authHeaders()
        });

        const data = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(data.error || "Error eliminando el anuncio");
        }

        cargarAnunciosAdmin(groupId);

    } catch (error) {

        console.error(error);
        alert(error.message);

    }

}


// ===========================
// CANAL DE NOTICIAS
// ===========================

async function cargarNoticiasAdmin() {

    const contenedor = document.getElementById("noticiasAdminContainer");

    if (!contenedor) return;

    try {

        const respuesta = await fetch("/api/news");
        const noticias = await respuesta.json();

        if (!Array.isArray(noticias) || noticias.length === 0) {

            contenedor.innerHTML = `<div class="request-card"><p class="vacio">No hay noticias publicadas todavía.</p></div>`;
            return;

        }

        contenedor.innerHTML = "";

        noticias.forEach(n => {

            contenedor.innerHTML += `
            <div class="request-card">
                ${n.imagen_url ? `<img src="${n.imagen_url}" style="width:100%; border-radius:6px; margin-bottom:8px;">` : ""}
                <h2>${n.titulo}</h2>
                <p>${n.contenido || ""}</p>
                <button class="deny" onclick="borrarNoticia('${n.id}')">Eliminar</button>
            </div>
            `;

        });

    } catch (error) {

        console.error(error);
        contenedor.innerHTML = `<div class="request-card">Error cargando noticias.</div>`;

    }

}


async function publicarNoticia() {

    const titulo = document.getElementById("noticiaTitulo");
    const contenido = document.getElementById("noticiaContenido");
    const imagen = document.getElementById("noticiaImagen");
    const mensaje = document.getElementById("noticiaMensaje");
    const btn = document.getElementById("publicarNoticiaBtn");

    if (!titulo.value.trim()) {

        mensaje.style.color = "#f28b82";
        mensaje.textContent = "❌ La noticia necesita un título.";
        return;

    }

    btn.disabled = true;
    btn.textContent = "Publicando...";

    try {

        const formData = new FormData();
        formData.append("titulo", titulo.value);
        formData.append("contenido", contenido.value);

        if (imagen.files && imagen.files.length > 0) {
            formData.append("imagen", imagen.files[0]);
        }

        const respuesta = await fetch("/api/news", {

            method: "POST",

            headers: authHeaders(),

            body: formData

        });

        const data = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(data.error || "Error publicando la noticia");
        }

        mensaje.style.color = "#8fd39a";
        mensaje.textContent = "✅ Noticia publicada.";

        titulo.value = "";
        contenido.value = "";
        imagen.value = "";

        cargarNoticiasAdmin();

    } catch (error) {

        console.error(error);
        mensaje.style.color = "#f28b82";
        mensaje.textContent = "❌ " + error.message;

    } finally {

        btn.disabled = false;
        btn.textContent = "Publicar noticia";

    }

}


async function borrarNoticia(id) {

    if (!confirm("¿Eliminar esta noticia?")) return;

    try {

        const respuesta = await fetch(`/api/news/${id}`, {
            method: "DELETE",
            headers: authHeaders()
        });

        const data = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(data.error || "Error eliminando la noticia");
        }

        cargarNoticiasAdmin();

    } catch (error) {

        console.error(error);
        alert(error.message);

    }

}


// ===========================
// CERRAR SESIÓN
// ===========================

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {

    logoutBtn.addEventListener("click", () => {

        localStorage.removeItem("token");
        localStorage.removeItem("usuarioID");
        localStorage.removeItem("usuarioNombre");
        localStorage.removeItem("usuarioEmail");
        localStorage.removeItem("usuarioRol");

        window.location.href = "/login.html";

    });

}


// ===========================
// INICIAR PANEL ADMIN
// ===========================

document.addEventListener("DOMContentLoaded", () => {

    cargarSolicitudes();
    cargarGrupos();
    cargarNoticiasAdmin();

    const btnGuardarReglamento = document.getElementById("guardarReglamentoBtn");
    if (btnGuardarReglamento) btnGuardarReglamento.addEventListener("click", guardarReglamento);

    const btnPublicarAnuncio = document.getElementById("publicarAnuncioBtn");
    if (btnPublicarAnuncio) btnPublicarAnuncio.addEventListener("click", publicarAnuncio);

    const btnPublicarNoticia = document.getElementById("publicarNoticiaBtn");
    if (btnPublicarNoticia) btnPublicarNoticia.addEventListener("click", publicarNoticia);

});
