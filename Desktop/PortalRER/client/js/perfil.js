const params = new URLSearchParams(window.location.search);

// Si viene ?id=xxx en la URL, estamos viendo el perfil de OTRO usuario.
// Si no viene nada, estamos viendo nuestro propio perfil.

const idEnURL = params.get("id");

const token = localStorage.getItem("token");
const miID = localStorage.getItem("usuarioID");

const idAVer = idEnURL || miID;

const esMiPropioPerfil = idAVer === miID;

// Avatar por defecto genérico (silueta gris), sin depender de ningún archivo subido
const AVATAR_POR_DEFECTO =
    "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="256" height="256">
        <rect width="256" height="256" fill="#2a2b30"/>
        <circle cx="128" cy="96" r="48" fill="#50545c"/>
        <path d="M40 220 C40 160 90 140 128 140 C166 140 216 160 216 220 Z" fill="#50545c"/>
    </svg>
    `);


/* ==========================
   CARGAR PERFIL
========================== */

async function cargarPerfil() {

    if (!idAVer) {

        window.location.href = "/login.html";
        return;

    }

    try {

        const respuesta = await fetch(`/api/users/${idAVer}`);
        const usuario = await respuesta.json();

        if (usuario.error) {

            document.getElementById("perfilNombre").textContent = "Usuario no encontrado";
            return;

        }

        document.getElementById("avatarImg").src = usuario.avatar_url || AVATAR_POR_DEFECTO;
        document.getElementById("perfilNombre").textContent = usuario.nombre;

        const grupoRango = document.getElementById("perfilGrupoRango");

        if (usuario.grupo) {

            grupoRango.textContent = `${usuario.grupo} — ${usuario.rango}`;

        } else {

            grupoRango.textContent = "Sin grupo asignado";

        }

        document.getElementById("perfilDescripcion").textContent =
            usuario.descripcion || "Este usuario no ha escrito una descripción todavía.";


        // Si es TU perfil, mostramos los controles de edición

        if (esMiPropioPerfil) {

            document.getElementById("cambiarFotoBox").style.display = "block";
            document.getElementById("editarDescripcionBox").style.display = "block";
            document.getElementById("descripcionView").style.display = "none";

            document.getElementById("descripcionInput").value = usuario.descripcion || "";

        }


    } catch (error) {

        console.error(error);

    }

}


/* ==========================
   RECORTAR IMAGEN A CUADRADA
   (recorte central, igual que hace Discord)
========================== */

function recortarImagenCuadrada(file) {

    return new Promise((resolve, reject) => {

        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {

            const canvas = document.getElementById("cropCanvas");
            const ctx = canvas.getContext("2d");

            const tamaño = Math.min(img.width, img.height);

            const offsetX = (img.width - tamaño) / 2;
            const offsetY = (img.height - tamaño) / 2;

            canvas.width = 256;
            canvas.height = 256;

            ctx.clearRect(0, 0, 256, 256);

            ctx.drawImage(
                img,
                offsetX, offsetY, tamaño, tamaño,
                0, 0, 256, 256
            );

            canvas.toBlob((blob) => {

                URL.revokeObjectURL(url);
                resolve(blob);

            }, "image/png");

        };

        img.onerror = reject;

        img.src = url;

    });

}


/* ==========================
   SUBIR AVATAR
========================== */

async function subirAvatar() {

    const input = document.getElementById("avatarInput");
    const mensaje = document.getElementById("perfilMensaje");

    if (!input.files || input.files.length === 0) {

        mensaje.textContent = "❌ Selecciona una imagen primero.";
        return;

    }

    const archivoOriginal = input.files[0];

    mensaje.textContent = "⏳ Procesando imagen...";

    try {

        const blobRecortado = await recortarImagenCuadrada(archivoOriginal);

        const formData = new FormData();
        formData.append("avatar", blobRecortado, "avatar.png");

        mensaje.textContent = "⏳ Subiendo foto...";

        const respuesta = await fetch("/api/users/me/avatar", {

            method: "POST",

            headers: {
                "Authorization": `Bearer ${token}`
            },

            body: formData

        });

        const datos = await respuesta.json();

        if (!respuesta.ok) {

            mensaje.textContent = "❌ " + (datos.error || "No se pudo subir la foto.");
            return;

        }

        document.getElementById("avatarImg").src = datos.avatar_url;
        mensaje.textContent = "✅ Foto actualizada.";

    } catch (error) {

        console.error(error);
        mensaje.textContent = "❌ No se pudo procesar la imagen.";

    }

}


/* ==========================
   GUARDAR DESCRIPCIÓN
========================== */

async function guardarDescripcion() {

    const texto = document.getElementById("descripcionInput").value.trim();
    const mensaje = document.getElementById("perfilMensaje");

    try {

        const respuesta = await fetch("/api/users/me", {

            method: "PUT",

            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },

            body: JSON.stringify({ descripcion: texto })

        });

        const datos = await respuesta.json();

        if (!respuesta.ok) {

            mensaje.textContent = "❌ " + (datos.error || "No se pudo guardar.");
            return;

        }

        document.getElementById("perfilDescripcion").textContent = datos.descripcion || "";
        mensaje.textContent = "✅ Descripción guardada.";

    } catch (error) {

        console.error(error);
        mensaje.textContent = "❌ Error guardando la descripción.";

    }

}


document.getElementById("avatarInput")?.addEventListener("change", (e) => {

    const nombreSpan = document.getElementById("avatarFileName");

    if (e.target.files && e.target.files.length > 0) {

        nombreSpan.textContent = e.target.files[0].name;

    } else {

        nombreSpan.textContent = "Ningún archivo seleccionado";

    }

});

document.getElementById("subirAvatarBtn")?.addEventListener("click", subirAvatar);
document.getElementById("guardarDescripcionBtn")?.addEventListener("click", guardarDescripcion);


cargarPerfil();
