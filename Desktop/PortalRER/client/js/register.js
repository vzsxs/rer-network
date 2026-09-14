document
.getElementById("registerForm")
.addEventListener("submit", async (e) => {

    e.preventDefault();

    const nombre = document
        .getElementById("nombre")
        .value
        .trim();

    const email = document
        .getElementById("email")
        .value
        .trim();

    const password = document
        .getElementById("password")
        .value;

    const confirmPassword = document
        .getElementById("confirmPassword")
        .value;

    const inviteCode = document
        .getElementById("inviteCode")
        .value
        .trim();

    const mensaje = document
        .getElementById("mensaje");

    mensaje.style.color = "#ff5555";
    mensaje.textContent = "";



    // ==========================
    // VALIDACIONES
    // ==========================

    if (nombre.length < 3) {

        mensaje.textContent =
        "El nombre debe tener al menos 3 caracteres.";

        return;

    }



    if (password.length < 6) {

        mensaje.textContent =
        "La contraseña debe tener al menos 6 caracteres.";

        return;

    }



    if (password !== confirmPassword) {

        mensaje.textContent =
        "Las contraseñas no coinciden.";

        return;

    }



    try {

        const respuesta = await fetch(
            "/api/auth/register",
            {

                method: "POST",

                headers: {

                    "Content-Type": "application/json"

                },

                body: JSON.stringify({

                    nombre,
                    email,
                    password,

                    invite_code: inviteCode

                })

            }
        );



        const data = await respuesta.json();



        if (!respuesta.ok) {

            mensaje.style.color = "#ff5555";
            mensaje.textContent =
            data.error || "No se pudo registrar.";

            return;

        }



        mensaje.style.color = "#22c55e";
        mensaje.textContent =
        "✅ Cuenta creada correctamente.";



        setTimeout(() => {

            window.location.href =
            "/login.html";

        }, 1500);



    } catch (error) {

        console.error(error);

        mensaje.style.color = "#ff5555";
        mensaje.textContent =
        "Error conectando con el servidor.";

    }

});