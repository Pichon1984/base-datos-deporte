const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Usuario = require("../models/usuario");

const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    const { uid } = jwt.verify(token, process.env.SECRETORPRIVATEKEY);

    const usuario = await Usuario.findById(uid);
    if (!usuario) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }

    const salt = bcrypt.genSaltSync();
    usuario.password = bcrypt.hashSync(newPassword, salt);

    await usuario.save();

    res.json({ msg: "Contraseña actualizada correctamente" });
  } catch (error) {
    console.error(error);
    res.status(400).json({ msg: "Token inválido o expirado" });
  }
};

module.exports = { resetPassword };

