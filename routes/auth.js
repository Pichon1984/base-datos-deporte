const { Router } = require("express");
const bcrypt = require("bcryptjs");
const Usuario = require("../models/usuario");
const { generarJWT } = require("../helpers/generar-jwt");
const { validarJWT } = require("../middlewares/validar-jwt");

const router = Router();

// POST /api/auth/register
router.post("/register", async (req, res) => {
  const { nombre, apellido, correo, password } = req.body;

  try {
    // Verificar si el correo ya existe
    const existe = await Usuario.findOne({ correo });
    if (existe) {
      return res.status(400).json({ msg: "El correo ya está registrado" });
    }

    // Encriptar contraseña
    const salt = bcrypt.genSaltSync();
    const hashedPassword = bcrypt.hashSync(password, salt);

    // Crear usuario
    const usuario = new Usuario({
      nombre,
      apellido,
      correo,
      password: hashedPassword,
      estado: true, // activo por defecto
      rol: "CLIENTE", // rol por defecto
    });

    await usuario.save();

    // Generar JWT con helper
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
    // Buscar usuario por correo
    const usuario = await Usuario.findOne({ correo });
    if (!usuario) {
      return res.status(400).json({ msg: "Usuario / Password incorrectos - correo" });
    }

    // Verificar estado
    if (!usuario.estado) {
      return res.status(403).json({ msg: "Usuario inactivo" });
    }

    // Verificar contraseña
    const validPassword = bcrypt.compareSync(password, usuario.password);
    if (!validPassword) {
      return res.status(400).json({ msg: "Usuario / Password incorrectos - password" });
    }

    // Generar JWT con helper
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

// GET /api/auth/me (rehidratar sesión)
router.get("/me", validarJWT, async (req, res) => {
  try {
    res.json(req.usuario.toJSON());
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al obtener perfil" });
  }
});

module.exports = router;




