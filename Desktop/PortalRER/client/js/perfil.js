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
   EDITOR DE RECORTE (arrastrar + zoom)
========================== */

const TAMAÑO_CONTENEDOR = 260; // debe coincidir con .crop-container en el CSS
const TAMAÑO_SALIDA = 256;     // tamaño final de la imagen subida

const cropModal = document.getElementById("cropModal");
const cropContainer = document.getElementById("cropContainer");
const cropImage = document.getElementById("cropImage");
const zoomSlider = document.getElementById("zoomSlider");

let imgNaturalWidth = 0;
let imgNaturalHeight = 0;
let minScale = 1;
let escalaActual = 1;
let offsetX = 0;
let offsetY = 0;
let arrastrando = false;
let inicioMouseX = 0;
let inicioMouseY = 0;
let inicioOffsetX = 0;
let inicioOffsetY = 0;


function aplicarTransformImagen() {

    cropImage.style.width = (imgNaturalWidth * escalaActual) + "px";
    cropImage.style.height = (imgNaturalHeight * escalaActual) + "px";
    cropImage.style.left = offsetX + "px";
    cropImage.style.top = offsetY + "px";

}


function limitarOffsets() {

    const anchoImg = imgNaturalWidth * escalaActual;
    const altoImg = imgNaturalHeight * escalaActual;

    const minX = TAMAÑO_CONTENEDOR - anchoImg;
    const minY = TAMAÑO_CONTENEDOR - altoImg;

    offsetX = Math.min(0, Math.max(minX, offsetX));
    offsetY = Math.min(0, Math.max(minY, offsetY));

}


function abrirEditorRecorte(file) {

    const url = URL.createObjectURL(file);

    cropImage.onload = () => {

        imgNaturalWidth = cropImage.naturalWidth;
        imgNaturalHeight = cropImage.naturalHeight;

        minScale = Math.max(
            TAMAÑO_CONTENEDOR / imgNaturalWidth,
            TAMAÑO_CONTENEDOR / imgNaturalHeight
        );

        escalaActual = minScale;

        offsetX = (TAMAÑO_CONTENEDOR - imgNaturalWidth * escalaActual) / 2;
        offsetY = (TAMAÑO_CONTENEDOR - imgNaturalHeight * escalaActual) / 2;

        zoomSlider.value = 0; // 0 = sin zoom extra (mínimo que cubre el círculo)

        aplicarTransformImagen();

        cropModal.style.display = "flex";

    };

    cropImage.src = url;

}


// ===== ZOOM =====

zoomSlider.addEventListener("input", () => {

    const porcentaje = Number(zoomSlider.value) / 100; // 0 a 1

    const nuevaEscala = minScale + porcentaje * (minScale * 2); // hasta 3x el mínimo

    // Mantener el punto central del contenedor fijo al hacer zoom

    const centroXImagen = (TAMAÑO_CONTENEDOR / 2 - offsetX) / escalaActual;
    const centroYImagen = (TAMAÑO_CONTENEDOR / 2 - offsetY) / escalaActual;

    escalaActual = nuevaEscala;

    offsetX = TAMAÑO_CONTENEDOR / 2 - centroXImagen * escalaActual;
    offsetY = TAMAÑO_CONTENEDOR / 2 - centroYImagen * escalaActual;

    limitarOffsets();
    aplicarTransformImagen();

});


// ===== ARRASTRAR (mouse) =====

cropContainer.addEventListener("mousedown", (e) => {

    arrastrando = true;
    inicioMouseX = e.clientX;
    inicioMouseY = e.clientY;
    inicioOffsetX = offsetX;
    inicioOffsetY = offsetY;

});

window.addEventListener("mousemove", (e) => {

    if (!arrastrando) return;

    offsetX = inicioOffsetX + (e.clientX - inicioMouseX);
    offsetY = inicioOffsetY + (e.clientY - inicioMouseY);

    limitarOffsets();
    aplicarTransformImagen();

});

window.addEventListener("mouseup", () => {

    arrastrando = false;

});


// ===== ARRASTRAR (touch, para móvil) =====

cropContainer.addEventListener("touchstart", (e) => {

    arrastrando = true;
    inicioMouseX = e.touches[0].clientX;
    inicioMouseY = e.touches[0].clientY;
    inicioOffsetX = offsetX;
    inicioOffsetY = offsetY;

});

window.addEventListener("touchmove", (e) => {

    if (!arrastrando) return;

    offsetX = inicioOffsetX + (e.touches[0].clientX - inicioMouseX);
    offsetY = inicioOffsetY + (e.touches[0].clientY - inicioMouseY);

    limitarOffsets();
    aplicarTransformImagen();

});

window.addEventListener("touchend", () => {

    arrastrando = false;

});


// ===== GENERAR LA IMAGEN FINAL RECORTADA =====

function generarBlobRecortado() {

    return new Promise((resolve) => {

        const canvas = document.getElementById("cropCanvas");
        const ctx = canvas.getContext("2d");

        canvas.width = TAMAÑO_SALIDA;
        canvas.height = TAMAÑO_SALIDA;

        ctx.clearRect(0, 0, TAMAÑO_SALIDA, TAMAÑO_SALIDA);

        // Mapeamos exactamente lo que se ve dentro del círculo (0,0)-(260,260)
        // de vuelta a coordenadas de la imagen original

        const sx = (0 - offsetX) / escalaActual;
        const sy = (0 - offsetY) / escalaActual;
        const sSize = TAMAÑO_CONTENEDOR / escalaActual;

        ctx.drawImage(
            cropImage,
            sx, sy, sSize, sSize,
            0, 0, TAMAÑO_SALIDA, TAMAÑO_SALIDA
        );

        canvas.toBlob((blob) => resolve(blob), "image/png");

    });

}


document.getElementById("cropCancelBtn").addEventListener("click", () => {

    cropModal.style.display = "none";
    document.getElementById("avatarInput").value = "";

});


document.getElementById("cropConfirmBtn").addEventListener("click", async () => {

    const mensaje = document.getElementById("perfilMensaje");
    const confirmBtn = document.getElementById("cropConfirmBtn");

    confirmBtn.disabled = true;
    confirmBtn.textContent = "Subiendo...";

    try {

        const blob = await generarBlobRecortado();

        const formData = new FormData();
        formData.append("avatar", blob, "avatar.png");

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

        cropModal.style.display = "none";
        document.getElementById("avatarInput").value = "";

    } catch (error) {

        console.error(error);
        mensaje.textContent = "❌ No se pudo procesar la imagen.";

    } finally {

        confirmBtn.disabled = false;
        confirmBtn.textContent = "Guardar foto";

    }

});


document.getElementById("avatarInput")?.addEventListener("change", (e) => {

    if (e.target.files && e.target.files.length > 0) {

        abrirEditorRecorte(e.target.files[0]);

    }

});


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


document.getElementById("guardarDescripcionBtn")?.addEventListener("click", guardarDescripcion);


cargarPerfil();
