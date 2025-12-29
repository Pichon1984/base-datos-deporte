const crypto = require("crypto");
const Usuario = require("../models/usuario");

const forgotPassword = async (req, res) => {
  const { correo } = req.body;

  try {
    if (!correo) {
      return res.status(400).json({ msg: "El correo es obligatorio" });
    }

    const usuario = await Usuario.findOne({ correo });
    if (!usuario) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }

    // Generar token aleatorio
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Hashear token para guardar en DB
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    usuario.resetToken = hashedToken;
    usuario.resetTokenExpire = Date.now() + 3600000; // 1 hora
    await usuario.save();

    // 👉 Validar FRONTEND_URL
    if (!process.env.FRONTEND_URL) {
      console.error("❌ FRONTEND_URL no está definido en el .env");
      return res.status(500).json({ msg: "Error interno: FRONTEND_URL no configurado" });
    }

    const recoveryLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    // 🔍 Logs de depuración
    console.log("🔍 FRONTEND_URL:", process.env.FRONTEND_URL);
    console.log("🔑 Enlace de recuperación generado:", recoveryLink);

    // ✅ Devolver token y link al frontend
    return res.status(200).json({
      msg: "Token de recuperación generado",
      token: resetToken,
      link: recoveryLink,
    });
  } catch (error) {
    console.error("❌ Error en forgotPassword:", error);
    return res.status(500).json({ msg: "Error interno del servidor" });
  }
};

module.exports = { forgotPassword };
