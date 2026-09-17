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
        document.getElementById("bannerImg").src = usuario.banner_url || "";
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
            document.getElementById("cambiarBannerBox").style.display = "block";
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
   Genérico: sirve para el avatar (círculo) y el banner (rectángulo)
========================== */

const MODOS = {

    avatar: {
        contenedorAncho: 260,
        contenedorAlto: 260,
        salidaAncho: 256,
        salidaAlto: 256,
        titulo: "Ajusta tu foto",
        formaCirculo: true
    },

    banner: {
        contenedorAncho: 340,
        contenedorAlto: 106,
        salidaAncho: 960,
        salidaAlto: 300,
        titulo: "Ajusta tu banner",
        formaCirculo: false
    }

};

let modoActual = "avatar";

const cropModal = document.getElementById("cropModal");
const cropContainer = document.getElementById("cropContainer");
const cropImage = document.getElementById("cropImage");
const cropModalTitle = document.getElementById("cropModalTitle");
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


function config() {
    return MODOS[modoActual];
}


function aplicarTransformImagen() {

    cropImage.style.width = (imgNaturalWidth * escalaActual) + "px";
    cropImage.style.height = (imgNaturalHeight * escalaActual) + "px";
    cropImage.style.left = offsetX + "px";
    cropImage.style.top = offsetY + "px";

}


function limitarOffsets() {

    const c = config();

    const anchoImg = imgNaturalWidth * escalaActual;
    const altoImg = imgNaturalHeight * escalaActual;

    const minX = c.contenedorAncho - anchoImg;
    const minY = c.contenedorAlto - altoImg;

    offsetX = Math.min(0, Math.max(minX, offsetX));
    offsetY = Math.min(0, Math.max(minY, offsetY));

}


function abrirEditorRecorte(file, modo) {

    modoActual = modo;

    const c = config();

    cropModalTitle.textContent = c.titulo;

    cropContainer.style.width = c.contenedorAncho + "px";
    cropContainer.style.height = c.contenedorAlto + "px";
    cropContainer.style.borderRadius = c.formaCirculo ? "50%" : "10px";

    const url = URL.createObjectURL(file);

    cropImage.onload = () => {

        imgNaturalWidth = cropImage.naturalWidth;
        imgNaturalHeight = cropImage.naturalHeight;

        minScale = Math.max(
            c.contenedorAncho / imgNaturalWidth,
            c.contenedorAlto / imgNaturalHeight
        );

        escalaActual = minScale;

        offsetX = (c.contenedorAncho - imgNaturalWidth * escalaActual) / 2;
        offsetY = (c.contenedorAlto - imgNaturalHeight * escalaActual) / 2;

        zoomSlider.value = 0;

        aplicarTransformImagen();

        cropModal.style.display = "flex";

    };

    cropImage.src = url;

}


// ===== ZOOM =====

zoomSlider.addEventListener("input", () => {

    const c = config();

    const porcentaje = Number(zoomSlider.value) / 100;

    const nuevaEscala = minScale + porcentaje * (minScale * 2);

    const centroXImagen = (c.contenedorAncho / 2 - offsetX) / escalaActual;
    const centroYImagen = (c.contenedorAlto / 2 - offsetY) / escalaActual;

    escalaActual = nuevaEscala;

    offsetX = c.contenedorAncho / 2 - centroXImagen * escalaActual;
    offsetY = c.contenedorAlto / 2 - centroYImagen * escalaActual;

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

        const c = config();

        const canvas = document.getElementById("cropCanvas");
        const ctx = canvas.getContext("2d");

        canvas.width = c.salidaAncho;
        canvas.height = c.salidaAlto;

        ctx.clearRect(0, 0, c.salidaAncho, c.salidaAlto);

        const sx = (0 - offsetX) / escalaActual;
        const sy = (0 - offsetY) / escalaActual;
        const sWidth = c.contenedorAncho / escalaActual;
        const sHeight = c.contenedorAlto / escalaActual;

        ctx.drawImage(
            cropImage,
            sx, sy, sWidth, sHeight,
            0, 0, c.salidaAncho, c.salidaAlto
        );

        canvas.toBlob((blob) => resolve(blob), "image/png");

    });

}


document.getElementById("cropCancelBtn").addEventListener("click", () => {

    cropModal.style.display = "none";
    document.getElementById("avatarInput").value = "";
    document.getElementById("bannerInput").value = "";

});


document.getElementById("cropConfirmBtn").addEventListener("click", async () => {

    const mensaje = document.getElementById("perfilMensaje");
    const confirmBtn = document.getElementById("cropConfirmBtn");

    confirmBtn.disabled = true;
    confirmBtn.textContent = "Subiendo...";

    const esBanner = modoActual === "banner";

    const endpoint = esBanner ? "/api/users/me/banner" : "/api/users/me/avatar";
    const campo = esBanner ? "banner" : "avatar";

    try {

        const blob = await generarBlobRecortado();

        const formData = new FormData();
        formData.append(campo, blob, `${campo}.png`);

        const respuesta = await fetch(endpoint, {

            method: "POST",

            headers: {
                "Authorization": `Bearer ${token}`
            },

            body: formData

        });

        const datos = await respuesta.json();

        if (!respuesta.ok) {

            mensaje.textContent = "❌ " + (datos.error || "No se pudo subir la imagen.");
            return;

        }

        if (esBanner) {

            document.getElementById("bannerImg").src = datos.banner_url;
            mensaje.textContent = "✅ Banner actualizado.";

        } else {

            document.getElementById("avatarImg").src = datos.avatar_url;
            mensaje.textContent = "✅ Foto actualizada.";

        }

        cropModal.style.display = "none";
        document.getElementById("avatarInput").value = "";
        document.getElementById("bannerInput").value = "";

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

        abrirEditorRecorte(e.target.files[0], "avatar");

    }

});


document.getElementById("bannerInput")?.addEventListener("change", (e) => {

    if (e.target.files && e.target.files.length > 0) {

        abrirEditorRecorte(e.target.files[0], "banner");

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
