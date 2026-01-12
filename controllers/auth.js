const bcrypt = require("bcryptjs");
const Usuario = require("../models/usuario");
const { generarJWT } = require("../helpers/generar-jwt");

// 🔑 LOGIN
const login = async (req, res) => {
  const { correo, password } = req.body;

  try {
    const usuario = await Usuario.findOne({ correo });
    if (!usuario || !usuario.estado) {
      return res.status(400).json({ msg: "Credenciales inválidas" });
    }

    const valid = await bcrypt.compare(password, usuario.password);
    if (!valid) {
      return res.status(400).json({ msg: "Credenciales inválidas" });
    }

    const token = await generarJWT(usuario._id);

    const { password: _, ...usuarioSinPassword } = usuario.toObject();

    res.json({ token, usuario: usuarioSinPassword });
  } catch (e) {
    console.error(e);
    res.status(500).json({ msg: "Error interno del servidor" });
  }
};

// 📝 REGISTRO
const registrar = async (req, res) => {
  const { nombre, apellido, correo, password } = req.body;

  try {
    const existe = await Usuario.findOne({ correo });
    if (existe) {
      return res.status(400).json({ msg: "El correo ya está registrado" });
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    const usuario = new Usuario({ nombre, apellido, correo, password: hashedPassword });
    await usuario.save();

    const token = await generarJWT(usuario._id);

    const { password: _, ...usuarioSinPassword } = usuario.toObject();

    res.status(201).json({ msg: "Usuario registrado", token, usuario: usuarioSinPassword });
  } catch (e) {
    console.error(e);
    res.status(500).json({ msg: "Error interno del servidor" });
  }
};

module.exports = { login, registrar };
