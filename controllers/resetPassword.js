const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const Usuario = require("../models/usuario");

const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    if (!token || !newPassword) {
      return res.status(400).json({ msg: "Token y nueva contraseña son obligatorios" });
    }

    // Hashear el token recibido para compararlo con el guardado
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Buscar usuario con token válido y no expirado
    const usuario = await Usuario.findOne({
      resetToken: hashedToken,
      resetTokenExpire: { $gt: Date.now() }
    });

    if (!usuario) {
      return res.status(400).json({ msg: "Token inválido o expirado" });
    }

    // Hashear nueva contraseña
    const salt = await bcrypt.genSalt(10);
    usuario.password = await bcrypt.hash(newPassword, salt);

    // Limpiar token de recuperación
    usuario.resetToken = undefined;
    usuario.resetTokenExpire = undefined;

    await usuario.save();

    res.json({ msg: "Contraseña actualizada correctamente" });
  } catch (error) {
    console.error("❌ Error en resetPassword:", error);
    res.status(500).json({ msg: "Error interno del servidor" });
  }
};

module.exports = { resetPassword };

