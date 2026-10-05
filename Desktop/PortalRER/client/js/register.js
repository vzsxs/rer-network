document
.getElementById("registerForm")
.addEventListener("submit", async (e) => {

    e.preventDefault();

    const nombre = document.getElementById("nombre").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const inviteCode = document.getElementById("inviteCode").value;
    const mensaje = document.getElementById("mensaje");

    mensaje.textContent = "";

    if (password !== confirmPassword) {

        mensaje.textContent = "Las contraseñas no coinciden.";
        return;

    }

    // Token del captcha resuelto por el usuario

    const hcaptchaToken = typeof hcaptcha !== "undefined" ? hcaptcha.getResponse() : "";

    if (!hcaptchaToken) {

        mensaje.textContent = "Por favor completa el captcha.";
        return;

    }

    try {

        const respuesta = await fetch("/api/auth/register", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                nombre,
                email,
                password,
                invite_code: inviteCode,
                hcaptchaToken
            })

        });

        const data = await respuesta.json();

        if (data.error) {

            mensaje.textContent = data.error;

            // Si el captcha venció o fue inválido, lo reseteamos para que lo resuelva de nuevo
            if (typeof hcaptcha !== "undefined") {
                hcaptcha.reset();
            }

            return;

        }

        mensaje.textContent = data.message || "Cuenta creada. Revisa tu correo para verificarla.";

        document.getElementById("registerForm").reset();

        if (typeof hcaptcha !== "undefined") {
            hcaptcha.reset();
        }

    } catch (error) {

        console.error("Error registro:", error);
        mensaje.textContent = "Error conectando con el servidor";

        if (typeof hcaptcha !== "undefined") {
            hcaptcha.reset();
        }

    }

});
