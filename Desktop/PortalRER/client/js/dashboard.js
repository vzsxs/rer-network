document.addEventListener("DOMContentLoaded", () => {

    const usuarioID = localStorage.getItem("usuarioID");
    const usuarioNombre = localStorage.getItem("usuarioNombre");
    const usuarioRol = localStorage.getItem("usuarioRol");
    const token = localStorage.getItem("token");

    if (!usuarioID || !token) {

        window.location.href = "/login.html";
        return;

    }

    const nombreMini = document.getElementById("nombreMini");

    if (nombreMini) {
        nombreMini.textContent = usuarioNombre;
    }

    const adminLink = document.getElementById("adminLink");

    if (adminLink) {

        if (usuarioRol && usuarioRol.toLowerCase() === "admin") {

            adminLink.style.display = "inline-block";

        } else {

            adminLink.style.display = "none";

        }

    }

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

});
