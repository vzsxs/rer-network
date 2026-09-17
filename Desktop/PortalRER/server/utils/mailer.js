const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({

    service: "gmail",

    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }

});


async function enviarCorreoVerificacion(destinatario, nombre, token) {

    const link = `${process.env.APP_URL}/verify.html?token=${token}`;

    await transporter.sendMail({

        from: `"Portal RER" <${process.env.EMAIL_USER}>`,

        to: destinatario,

        subject: "Verifica tu cuenta - Portal RER",

        html: `
            <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">

                <h2>Bienvenido a Portal RER, ${nombre}</h2>

                <p>Confirma tu correo para activar tu cuenta:</p>

                <p style="margin: 24px 0;">
                    <a href="${link}"
                       style="background:#3a3b40; color:#fff; padding:12px 24px; border-radius:6px; text-decoration:none; display:inline-block;">
                        Verificar mi cuenta
                    </a>
                </p>

                <p style="color:#888; font-size:13px;">
                    Si el botón no funciona, copia y pega este link en tu navegador:<br>
                    ${link}
                </p>

                <p style="color:#888; font-size:13px;">
                    Este link expira en 24 horas.
                </p>

            </div>
        `

    });

}


module.exports = { enviarCorreoVerificacion };
