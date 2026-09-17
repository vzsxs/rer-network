async function verificarCuenta() {

    const mensaje = document.getElementById("verifyMensaje");
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {

        mensaje.textContent = "❌ Link de verificación inválido.";
        return;

    }

    try {

        const respuesta = await fetch(`/api/auth/verify/${token}`);
        const datos = await respuesta.json();

        if (!respuesta.ok) {

            mensaje.textContent = "❌ " + (datos.error || "No se pudo verificar tu cuenta.");
            return;

        }

        mensaje.textContent = "✅ " + datos.message;

    } catch (error) {

        console.error(error);
        mensaje.textContent = "❌ Error de conexión con el servidor.";

    }

}

verificarCuenta();
