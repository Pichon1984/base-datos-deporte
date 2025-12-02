const { request, response } = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/usuario');
const { generarJWT } = require('../helpers/generar-jwt');

// 🔑 LOGIN
const login = async (req = request, res = response) => {
  const { correo, password } = req.body;

  try {
    // Buscar usuario por correo
    const usuario = await Usuario.findOne({ correo });

    if (!usuario) {
      return res.status(400).json({ msg: "Correo o password incorrectos | usuario inexistente" });
    }

    if (!usuario.estado) {
      return res.status(400).json({ msg: "Correo o password incorrecto | usuario inactivo" });
    }

    // Validar contraseña
    const validPassword = bcrypt.compareSync(password, usuario.password);
    if (!validPassword) {
      return res.status(400).json({ msg: "Correo o password incorrectos" });
    }

    // Generar JWT
    const token = await generarJWT(usuario.id);

    res.json({
      msg: "Login ok",
      usuario: {
        _id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.correo,
        rol: usuario.rol,
        telefono: usuario.telefono,
        direccion: usuario.direccion
      },
      token
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: 'Hable con el administrador del sistema' });
  }
};

// 🔑 FORGOT PASSWORD
const forgotPassword = async (req = request, res = response) => {
  const { correo } = req.body;

  try {
    const usuario = await Usuario.findOne({ correo });
    if (!usuario) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }

    // Generar token temporal
    const token = jwt.sign(
      { id: usuario._id },
      process.env.SECRETORPRIVATEKEY,
      { expiresIn: '15m' }
    );

    // El frontend con EmailJS se encargará de enviar este token por correo
    res.json({ token, msg: "Token generado, envíalo por correo al usuario" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error en forgot-password" });
  }
};

// 🔑 RESET PASSWORD
const resetPassword = async (req = request, res = response) => {
  const { token, nuevaPassword } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.SECRETORPRIVATEKEY);

    const usuario = await Usuario.findById(decoded.id);
    if (!usuario) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }

    // Encriptar nueva contraseña
    const salt = bcrypt.genSaltSync(10);
    usuario.password = bcrypt.hashSync(nuevaPassword, salt);

    await usuario.save();

    res.json({ msg: "Contraseña actualizada correctamente" });

  } catch (error) {
    console.error(error);
    res.status(400).json({ msg: "Token inválido o expirado" });
  }
};

module.exports = { login, forgotPassword, resetPassword };

