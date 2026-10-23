// Si ya hay una sesión válida (token que no ha expirado),
// saltamos directo al dashboard sin mostrar el login.

(function () {

    const token = localStorage.getItem("token");

    if (!token) return;

    try {

        const payload = JSON.parse(
            atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
        );

        if (payload.exp && payload.exp * 1000 > Date.now()) {
            window.location.href = "/dashboard.html";
        }

    } catch (error) {

        // Token con formato raro: lo ignoramos y dejamos el login visible

    }

})();


// Botón Mostrar / Ocultar contraseña

const passwordInput = document.getElementById("password");
const togglePassword = document.getElementById("togglePassword");

togglePassword.addEventListener("click", () => {

    const estabaVisible = passwordInput.type === "text";

    passwordInput.type = estabaVisible ? "password" : "text";

    togglePassword.setAttribute(
        "data-i18n",
        estabaVisible ? "inicio_mostrar" : "inicio_ocultar"
    );

    // Reaplica el idioma actual para que el botón cambie de texto
    aplicarIdioma(obtenerIdioma());

});
