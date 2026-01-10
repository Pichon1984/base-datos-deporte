const jwt = require("jsonwebtoken");
const Usuario = require("../models/usuario");

const validarJWT = async (req, res, next) => {
  // 1️⃣ Buscar token en header o cookie
  let token = req.header("x-token");
  if (!token && req.cookies?.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ error: "No hay token en la petición" });
  }

  try {
    console.log("🔑 Token recibido:", token);

    // 2️⃣ Verificar JWT
    const { uid } = jwt.verify(token, process.env.SECRETORPRIVATEKEY);

    // 3️⃣ Guardar uid en request
    req.uid = uid;

    // 4️⃣ Buscar usuario en BD
    const usuario = await Usuario.findById(uid);

    if (!usuario) {
      return res.status(404).json({ error: "Usuario no existe en la base de datos" });
    }

    if (!usuario.estado) {
      return res.status(403).json({ error: "Usuario bloqueado o inhabilitado" });
    }

    // 5️⃣ Adjuntar usuario al request
    req.usuario = usuario;

    console.log("✅ Usuario validado:", usuario.correo, "Rol:", usuario.rol);

    next();
  } catch (error) {
    console.error("❌ Error validando token:", error.message);
    return res.status(401).json({ error: "Token no válido o expirado" });
  }
};

module.exports = { validarJWT };
