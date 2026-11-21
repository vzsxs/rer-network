const jwt = require("jsonwebtoken");

const supabase = require("../config/supabase");

// Cada usuario se actualiza como máximo una vez por minuto,
// así el chat (que consulta cada pocos segundos) no llena la base de datos.

const INTERVALO_MS = 60 * 1000;

const ultimoRegistro = new Map();


function registrarPresencia(req, res, next) {

    const cabecera = req.headers.authorization;

    if (cabecera && cabecera.startsWith("Bearer ")) {

        try {

            const decoded = jwt.verify(cabecera.split(" ")[1], process.env.JWT_SECRET);

            const ahora = Date.now();
            const ultimo = ultimoRegistro.get(decoded.id);

            if (!ultimo || ahora - ultimo > INTERVALO_MS) {

                // Tope de seguridad para que el mapa no crezca sin límite

                if (ultimoRegistro.size > 20000) {
                    ultimoRegistro.clear();
                }

                ultimoRegistro.set(decoded.id, ahora);

                // Sin "await": no debe retrasar la respuesta.
                // Si la columna last_seen aún no existe, el error se ignora.

                supabase
                    .from("users")
                    .update({ last_seen: new Date().toISOString() })
                    .eq("id", decoded.id)
                    .then(() => {}, () => {});

            }

        } catch (error) {

            // Token inválido o vencido: no hacemos nada, la ruta se encarga de rechazarlo

        }

    }

    next();

}


module.exports = { registrarPresencia };
