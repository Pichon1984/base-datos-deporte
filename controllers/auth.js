const bcrypt = require("bcryptjs");
const Usuario = require("../models/usuario");
const { generarJWT } = require("../helpers/generar-jwt");

// 🔑 LOGIN
const login = async (req, res) => {
  const { correo, password } = req.body;

  try {
    const usuario = await Usuario.findOne({ correo });
    if (!usuario) {
      return res.status(400).json({ msg: "Correo/contraseña incorrectos" });
    }

    if (!usuario.estado) {
      return res.status(403).json({ msg: "Usuario inhabilitado" });
    }

    const valid = bcrypt.compareSync(password, usuario.password);
    if (!valid) {
      return res.status(400).json({ msg: "Correo/contraseña incorrectos" });
    }

    const token = await generarJWT(usuario._id); // ✅ corregido

    const obj = usuario.toObject();
    delete obj.password;

    res.json({ token, usuario: obj });
  } catch (e) {
    console.error(e);
    res.status(500).json({ msg: "Error en login" });
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

    const salt = bcrypt.genSaltSync();
    const hashedPassword = bcrypt.hashSync(password, salt);

    const usuario = new Usuario({ nombre, apellido, correo, password: hashedPassword });
    await usuario.save();

    const token = await generarJWT(usuario._id); // ✅ corregido

    const obj = usuario.toObject();
    delete obj.password;

    res.status(201).json({ msg: "Usuario registrado", token, usuario: obj });
  } catch (e) {
    console.error(e);
    res.status(500).json({ msg: "Error al registrar" });
  }
};

module.exports = { login, registrar };
