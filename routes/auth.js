const { Router } = require("express");
const bcrypt = require("bcryptjs");
const Usuario = require("../models/usuario");
const { generarJWT } = require("../helpers/generar-jwt");
const { validarJWT } = require("../middlewares/validar-jwt");

const router = Router();

// POST /api/auth/register
router.post("/register", async (req, res) => {
  const {
    nombre,
    apellido,
    correo,
    password,
    telefono,
    direccion,
    provincia,
    localidad,
    codigoPostal,
    dni
  } = req.body;

  try {
    // Verificar si el correo ya existe
    const existe = await Usuario.findOne({ correo });
    if (existe) {
      return res.status(400).json({ msg: "El correo ya está registrado" });
    }

    // Encriptar contraseña
    const salt = bcrypt.genSaltSync();
    const hashedPassword = bcrypt.hashSync(password, salt);

    // Crear usuario con todos los campos
    const usuario = new Usuario({
      nombre,
      apellido,
      correo,
      password: hashedPassword,
      telefono,
      direccion,
      provincia,
      localidad,
      codigoPostal,
      dni,
      estado: true,
      rol: "CLIENTE",
    });

    await usuario.save();

    // Generar JWT
    const token = await generarJWT(usuario.id);

    res.status(201).json({
      msg: "Usuario registrado",
      usuario: usuario.toJSON(),
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error interno del servidor" });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { correo, password } = req.body;

  try {
    const usuario = await Usuario.findOne({ correo });
    if (!usuario) {
      return res.status(400).json({ msg: "Usuario / Password incorrectos - correo" });
    }

    if (!usuario.estado) {
      return res.status(403).json({ msg: "Usuario inactivo" });
    }

    const validPassword = bcrypt.compareSync(password, usuario.password);
    if (!validPassword) {
      return res.status(400).json({ msg: "Usuario / Password incorrectos - password" });
    }

    const token = await generarJWT(usuario.id);

    res.json({
      usuario: usuario.toJSON(),
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error interno del servidor" });
  }
});

// GET /api/auth/me
router.get("/me", validarJWT, async (req, res) => {
  try {
    res.json(req.usuario.toJSON());
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al obtener perfil" });
  }
});

module.exports = router;

