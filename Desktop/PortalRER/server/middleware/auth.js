const jwt = require("jsonwebtoken");

function verifyToken(req, res, next) {

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Token no proporcionado" });
    }

    const token = authHeader.split(" ")[1];

    try {

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // decoded = { id, nombre, rol, iat, exp }
        req.userId = decoded.id;
        req.userRol = decoded.rol;

        next();

    } catch (error) {

        return res.status(401).json({ error: "Token inválido o expirado" });

    }

}

module.exports = verifyToken;