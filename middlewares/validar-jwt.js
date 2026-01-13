const jwt = require("jsonwebtoken");
const Usuario = require("../models/usuario");

const validarJWT = async (req, res, next) => {
  try {
    let token = req.header("x-token") || req.cookies?.token;

    if (!token) {
      return res.status(401).json({ error: "No hay token en la petición" });
    }

    if (!process.env.SECRETORPRIVATEKEY) {
      console.error("❌ SECRETORPRIVATEKEY no está definido en .env");
      return res.status(500).json({ error: "Error de configuración del servidor" });
    }

    const { uid } = jwt.verify(token, process.env.SECRETORPRIVATEKEY);

    const usuario = await Usuario.findById(uid);

    if (!usuario) {
      return res.status(404).json({ error: "Usuario no existe en la base de datos" });
    }

    if (!usuario.estado) {
      return res.status(403).json({ error: "Usuario bloqueado o inhabilitado" });
    }

    req.uid = uid;
    req.usuario = usuario;

    next();
  } catch (error) {
    console.error("❌ Error validando token:", error.message);
    return res.status(401).json({ error: "Token no válido o expirado" });
  }
};

module.exports = { validarJWT };
