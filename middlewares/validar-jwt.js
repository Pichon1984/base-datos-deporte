const jwt = require("jsonwebtoken");
const Usuario = require("../models/usuario");

const validarJWT = async (req, res, next) => {
  try {
    //  Buscar token en header o cookie
    let token = req.header("x-token") || req.cookies?.token;

    if (!token) {
      return res.status(401).json({ error: "No hay token en la petición" });
    }

    //  Verificar JWT
    const { uid } = jwt.verify(token, process.env.SECRETORPRIVATEKEY);

    // Buscar usuario en BD
    const usuario = await Usuario.findById(uid);

    if (!usuario) {
      return res.status(404).json({ error: "Usuario no existe en la base de datos" });
    }

    if (!usuario.estado) {
      return res.status(403).json({ error: "Usuario bloqueado o inhabilitado" });
    }

    //  Adjuntar usuario al request
    req.uid = uid;          
    req.usuario = usuario;  

    // Usuario validado
    next();
  } catch (error) {
    console.error("❌ Error validando token:", error.message);
    return res.status(401).json({ error: "Token no válido o expirado" });
  }
};

module.exports = { validarJWT };
