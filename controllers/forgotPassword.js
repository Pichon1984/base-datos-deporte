const Usuario = require("../models/usuario");
const emailjs = require("@emailjs/nodejs");
const crypto = require("crypto");

const forgotPassword = async (req, res) => {
  const { correo } = req.body;

  try {
    const usuario = await Usuario.findOne({ correo });
    if (!usuario) {
      return res.status(404).json({ msg: "No existe usuario con ese correo" });
    }

    // 🔑 Generar token único y temporal
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    usuario.resetToken = hashedToken;
    usuario.resetTokenExpire = Date.now() + 3600000; // 1 hora
    await usuario.save();

    // 📧 Parámetros para EmailJS
    const templateParams = {
      to_email: correo,
      to_name: usuario.nombre,
      reset_link: `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password?token=${resetToken}`
    };

    await emailjs.send(
      process.env.EMAILJS_SERVICE_ID,
      process.env.EMAILJS_TEMPLATE_ID_RESET,
      templateParams,
      { publicKey: process.env.EMAILJS_PUBLIC_KEY }
    );

    res.json({ msg: "Correo de recuperación enviado" });
  } catch (error) {
    console.error("❌ Error en forgotPassword:", error);
    res.status(500).json({ msg: "Error en forgot password" });
  }
};

module.exports = { forgotPassword };

