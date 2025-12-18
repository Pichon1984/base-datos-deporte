const jwt = require("jsonwebtoken");
const Usuario = require("../models/usuario");

const validarJWT = async (req, res, next) => {
  const token = req.header("x-token");

  if (!token) {
    return res.status(401).json({ error: "No hay token en la petición" });
  }

  try {
    console.log("🔑 Token recibido:", token);

    const { uid } = jwt.verify(token, process.env.SECRETORPRIVATEKEY);

    // Guardamos el uid en el request
    req.uid = uid;

    // Buscar usuario en la BD
    const usuario = await Usuario.findById(uid);

    if (!usuario) {
      return res.status(404).json({ error: "Usuario no existe en la base de datos" });
    }

    if (!usuario.estado) {
      return res.status(403).json({ error: "Usuario bloqueado o inhabilitado" });
    }

    // Adjuntar usuario al request
    req.usuario = usuario;

    console.log("✅ Usuario validado:", usuario.correo, "Rol:", usuario.rol);

    next();
  } catch (error) {
    console.error("❌ Error validando token:", error.message);
    return res.status(401).json({ error: "Token no válido o expirado" });
  }
};

module.exports = { validarJWT };



