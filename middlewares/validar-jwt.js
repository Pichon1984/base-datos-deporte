const jwt = require("jsonwebtoken");
const Usuario = require("../models/usuario");

const validarJWT = async (req, res, next) => {
  const token = req.header("x-token");

  if (!token) {
    return res.status(401).json({ msg: "No hay token en la petición" });
  }

  try {
    // 👀 Log para depuración
    console.log("Token recibido:", token);

    const { uid } = jwt.verify(token, process.env.SECRETORPRIVATEKEY);

    // Buscar usuario en la BD
    const usuario = await Usuario.findById(uid);

    if (!usuario) {
      return res.status(404).json({ msg: "Usuario no existe en la base de datos" });
    }

    if (!usuario.estado) {
      return res.status(403).json({ msg: "Usuario bloqueado o inhabilitado" });
    }

    // Adjuntar usuario al request
    req.usuario = usuario;

    next();
  } catch (error) {
    console.error("Error validando token:", error.message);
    return res.status(401).json({ msg: "Token no válido o expirado" });
  }
};

module.exports = { validarJWT };

