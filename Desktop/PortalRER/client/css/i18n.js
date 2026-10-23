/* ==========================================================
   SISTEMA DE TRADUCCIÓN - Portal RER
   Uso: agrega data-i18n="clave" a cualquier elemento de texto,
        o data-i18n-placeholder="clave" para inputs con placeholder.
   ========================================================== */

const TRADUCCIONES = {

    es: {

        // ===== NAVBAR (compartido en todas las páginas) =====
        nav_inicio: "Inicio",
        nav_foro: "Foro",
        nav_miembros: "Miembros",
        nav_grupos: "Grupos",
        nav_noticias: "Noticias",
        nav_perfil: "Perfil",
        nav_solicitudes: "Solicitudes",
        nav_cerrar_sesion: "Cerrar sesión",

        disclaimer_ww2: "⚠️ No apoyamos ni glorificamos ninguno de los acontecimientos sucedidos en la WW2.",

        // ===== INDEX =====
        index_titulo: "Portal RER",
        index_subtitulo: "Bienvenido al portal oficial.",
        index_btn_login: "Iniciar Sesión",
        index_btn_registro: "Registrarse",

        // ===== LOGIN =====
        login_titulo: "Iniciar sesión",
        login_label_email: "Correo electrónico:",
        login_label_password: "Contraseña:",
        login_requerido: "Obligatorio",
        login_btn: "Entrar",
        login_link_registro: "← Crear una cuenta",

        // ===== REGISTRO =====
        registro_titulo: "Registro",
        registro_label_nombre: "Nombre de usuario:",
        registro_label_email: "Correo electrónico:",
        registro_label_password: "Contraseña:",
        registro_label_confirmar: "Confirmar contraseña:",
        registro_label_invite: "Código de invitación:",
        registro_requerido: "Obligatorio",
        registro_btn: "Registrarse",
        registro_link_login: "← Ya tengo una cuenta",

        // ===== DASHBOARD =====
        dash_hero_titulo: "Bienvenido al Portal RER",
        dash_hero_subtitulo: "Plataforma de gestión y organizaciones",
        dash_panel_titulo: "Panel principal",
        dash_card_grupos_titulo: "🛡 Grupos",
        dash_card_grupos_desc: "Explora organizaciones disponibles y solicita ingreso.",
        dash_card_grupos_link: "Ver grupos →",
        dash_card_foro_titulo: "💬 Foro",
        dash_card_foro_desc: "Chatea con la comunidad y consulta información importante.",
        dash_card_foro_link: "Ir al foro →",
        dash_card_noticias_titulo: "📢 Noticias",
        dash_card_noticias_desc: "Revisa comunicados oficiales del portal.",
        dash_card_documentos_titulo: "📂 Documentos",
        dash_card_documentos_desc: "Archivos y reglamentos importantes.",
        dash_card_miembros_titulo: "👥 Miembros",
        dash_card_miembros_desc: "Consulta el personal registrado en el portal.",
        dash_card_miembros_link: "Ver miembros →",

        // ===== LOGIN INICIAL (index) =====
        inicio_banner: "Debes iniciar sesión para acceder al portal.",
        inicio_mostrar: "Mostrar",
        inicio_ocultar: "Ocultar",
        inicio_sin_cuenta: "¿No tienes una cuenta?",
        inicio_registrate_ahora: "Registrarse ahora"

    },

    en: {

        // ===== NAVBAR =====
        nav_inicio: "Home",
        nav_foro: "Forum",
        nav_miembros: "Members",
        nav_grupos: "Groups",
        nav_noticias: "News",
        nav_perfil: "Profile",
        nav_solicitudes: "Requests",
        nav_cerrar_sesion: "Log out",

        disclaimer_ww2: "⚠️ We do not support or glorify any of the events that took place in WW2.",

        // ===== INDEX =====
        index_titulo: "Portal RER",
        index_subtitulo: "Welcome to the official portal.",
        index_btn_login: "Log In",
        index_btn_registro: "Sign Up",

        // ===== LOGIN =====
        login_titulo: "Log in",
        login_label_email: "Email:",
        login_label_password: "Password:",
        login_requerido: "Required",
        login_btn: "Log in",
        login_link_registro: "← Create an account",

        // ===== REGISTRO =====
        registro_titulo: "Sign up",
        registro_label_nombre: "Username:",
        registro_label_email: "Email:",
        registro_label_password: "Password:",
        registro_label_confirmar: "Confirm password:",
        registro_label_invite: "Invite code:",
        registro_requerido: "Required",
        registro_btn: "Sign up",
        registro_link_login: "← I already have an account",

        // ===== DASHBOARD =====
        dash_hero_titulo: "Welcome to Portal RER",
        dash_hero_subtitulo: "Management platform and organizations",
        dash_panel_titulo: "Main panel",
        dash_card_grupos_titulo: "🛡 Groups",
        dash_card_grupos_desc: "Explore available organizations and request to join.",
        dash_card_grupos_link: "View groups →",
        dash_card_foro_titulo: "💬 Forum",
        dash_card_foro_desc: "Chat with the community and check important info.",
        dash_card_foro_link: "Go to forum →",
        dash_card_noticias_titulo: "📢 News",
        dash_card_noticias_desc: "Check official announcements from the portal.",
        dash_card_documentos_titulo: "📂 Documents",
        dash_card_documentos_desc: "Important files and regulations.",
        dash_card_miembros_titulo: "👥 Members",
        dash_card_miembros_desc: "See the personnel registered on the portal.",
        dash_card_miembros_link: "View members →",

        // ===== LOGIN INICIAL (index) =====
        inicio_banner: "You must be logged in to access the portal.",
        inicio_mostrar: "Show",
        inicio_ocultar: "Hide",
        inicio_sin_cuenta: "Don't have an account?",
        inicio_registrate_ahora: "Register now"

    }

};


function obtenerIdioma() {

    return localStorage.getItem("idioma") || "es";

}


function aplicarIdioma(idioma) {

    localStorage.setItem("idioma", idioma);

    document.documentElement.lang = idioma;

    const dict = TRADUCCIONES[idioma] || TRADUCCIONES.es;

    document.querySelectorAll("[data-i18n]").forEach(el => {

        const clave = el.getAttribute("data-i18n");

        if (dict[clave]) {
            el.textContent = dict[clave];
        }

    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {

        const clave = el.getAttribute("data-i18n-placeholder");

        if (dict[clave]) {
            el.placeholder = dict[clave];
        }

    });

    // Actualiza el estado visual del switch ES/EN, si existe en la página

    const btnEs = document.getElementById("idiomaEs");
    const btnEn = document.getElementById("idiomaEn");

    if (btnEs && btnEn) {

        btnEs.classList.toggle("idioma-activo", idioma === "es");
        btnEn.classList.toggle("idioma-activo", idioma === "en");

    }

}


function cambiarIdioma(idioma) {

    aplicarIdioma(idioma);

}


document.addEventListener("DOMContentLoaded", () => {

    aplicarIdioma(obtenerIdioma());

});
