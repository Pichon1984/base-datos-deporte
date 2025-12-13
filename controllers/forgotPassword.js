const Usuario = require("../models/usuario");
const { generarJWT } = require("../helpers/generar-jwt");
const emailjs = require("@emailjs/nodejs");

const forgotPassword = async (req, res) => {
  const { correo } = req.body;

  try {
    const usuario = await Usuario.findOne({ correo });
    if (!usuario) {
      return res.status(404).json({ msg: "No existe usuario con ese correo" });
    }

    const token = await generarJWT(usuario.id);

    const templateParams = {
      to_email: correo,
      to_name: usuario.nombre,
      reset_link: `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password?token=${token}`
    };

    await emailjs.send(
      process.env.VITE_EMAILJS_SERVICE_ID,
      process.env.VITE_EMAILJS_TEMPLATE_ID_RESET,
      templateParams,
      { publicKey: process.env.VITE_EMAILJS_PUBLIC_KEY }
    );

    res.json({ msg: "Correo de recuperación enviado" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error en forgot password" });
  }
};

module.exports = { forgotPassword };
