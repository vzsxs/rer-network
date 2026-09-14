// ===========================
// CARGAR DASHBOARD
// ===========================

document.addEventListener("DOMContentLoaded", () => {

    const usuarioID = localStorage.getItem("usuarioID");
    const usuarioNombre = localStorage.getItem("usuarioNombre");
    const usuarioRol = localStorage.getItem("usuarioRol");
    const token = localStorage.getItem("token");

    // Si no existe sesión
    if (!usuarioID || !token) {

        window.location.href = "/login.html";

        return;
    }


    // ===========================
    // PERFIL
    // ===========================

    const nombre = document.getElementById("nombreUsuario");
    const rol = document.getElementById("rolUsuario");
    const nombreMini = document.getElementById("nombreMini");

    if (nombre) {
        nombre.textContent = usuarioNombre;
    }

    if (rol) {
        rol.textContent = usuarioRol;
    }

    if (nombreMini) {
        nombreMini.textContent = usuarioNombre;
    }


    // ===========================
    // BOTÓN ADMIN
    // ===========================

    const adminLink = document.getElementById("adminLink");

    if (adminLink) {

        if (
            usuarioRol &&
            usuarioRol.toLowerCase() === "admin"
        ) {

            adminLink.style.display = "inline-block";

        } else {

            adminLink.style.display = "none";

        }
    }


    // ===========================
    // VINCULAR ROBLOX
    // ===========================

    const robloxLinkBtn = document.getElementById("robloxLinkBtn");
    const robloxProfileLink = document.getElementById("robloxProfileLink");
    const robloxStatus = document.getElementById("robloxStatus");

    if (robloxLinkBtn) {

        robloxLinkBtn.addEventListener("click", async () => {

            const profileLink = robloxProfileLink.value.trim();

            if (!profileLink) {

                robloxStatus.textContent =
                    "❌ Pega primero el enlace de tu perfil de Roblox.";

                return;
            }


            robloxStatus.textContent =
                "⏳ Verificando cuenta de Roblox...";


            try {

                const respuesta = await fetch(
                    "http://localhost:3000/api/roblox/link",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`
                        },

                        body: JSON.stringify({
                            profileLink: profileLink
                        })
                    }
                );


                const datos = await respuesta.json();


                if (!respuesta.ok) {

                    robloxStatus.textContent =
                        "❌ " + (datos.error || "No se pudo vincular la cuenta.");

                    return;
                }


                robloxStatus.textContent =
                    `✅ Roblox vinculado: ${datos.robloxName}`;


            } catch (error) {

                console.error(error);

                robloxStatus.textContent =
                    "❌ No se pudo conectar con el servidor.";

            }

        });

    }

});


// ===========================
// CERRAR SESIÓN
// ===========================

document.addEventListener("DOMContentLoaded", () => {

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