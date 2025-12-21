const { Router } = require("express");
const bcrypt = require("bcryptjs");
const Usuario = require("../models/usuario");
const { generarJWT } = require("../helpers/generar-jwt");
const { validarJWT } = require("../middlewares/validar-jwt");
const crypto = require("crypto");

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
    if (!correo || !password) {
      return res.status(400).json({ msg: "Correo y contraseña son obligatorios" });
    }

    const existe = await Usuario.findOne({ correo });
    if (existe) {
      return res.status(400).json({ msg: "El correo ya está registrado" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

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

    const token = await generarJWT(usuario.id);

    res.status(201).json({
      msg: "Usuario registrado",
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        correo: usuario.correo,
        rol: usuario.rol,
      },
      token,
    });
  } catch (error) {
    console.error("❌ Error en register:", error);
    res.status(500).json({ msg: "Error interno del servidor" });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { correo, password } = req.body;

  try {
    if (!correo || !password) {
      return res.status(400).json({ msg: "Correo y contraseña son obligatorios" });
    }

    const usuario = await Usuario.findOne({ correo });
    if (!usuario) {
      return res.status(400).json({ msg: "Usuario / Password incorrectos" });
    }

    if (!usuario.estado) {
      return res.status(403).json({ msg: "Usuario inactivo" });
    }

    const validPassword = await bcrypt.compare(password, usuario.password);
    if (!validPassword) {
      return res.status(400).json({ msg: "Usuario / Password incorrectos" });
    }

    const token = await generarJWT(usuario.id);

    res.json({
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        correo: usuario.correo,
        rol: usuario.rol,
      },
      token,
    });
  } catch (error) {
    console.error("❌ Error en login:", error);
    res.status(500).json({ msg: "Error interno del servidor" });
  }
});

// GET /api/auth/me
router.get("/me", validarJWT, async (req, res) => {
  try {
    res.json({
      id: req.usuario.id,
      nombre: req.usuario.nombre,
      apellido: req.usuario.apellido,
      correo: req.usuario.correo,
      rol: req.usuario.rol,
    });
  } catch (error) {
    console.error("❌ Error en /me:", error);
    res.status(500).json({ msg: "Error al obtener perfil" });
  }
});

// POST /api/auth/forgot-password
router.post("/forgot-password", async (req, res) => {
  try {
    const { correo } = req.body;
    if (!correo) {
      return res.status(400).json({ msg: "El correo es obligatorio" });
    }

    const usuario = await Usuario.findOne({ correo });
    if (!usuario) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }

    // Generar token de reset
    const resetToken = crypto.randomBytes(32).toString("hex");
    usuario.resetToken = resetToken;
    usuario.resetTokenExpire = Date.now() + 3600000; // 1 hora
    await usuario.save();

    // Aquí podrías enviar el token por email con nodemailer
    // Ejemplo: enviar un link https://frontend/reset-password?token=resetToken

    res.json({ msg: "Token de recuperación generado", token: resetToken });
  } catch (error) {
    console.error("❌ Error en forgot-password:", error);
    res.status(500).json({ msg: "Error interno del servidor" });
  }
});

// POST /api/auth/reset-password
router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ msg: "Token y nueva contraseña son obligatorios" });
    }

    const usuario = await Usuario.findOne({
      resetToken: token,
      resetTokenExpire: { $gt: Date.now() }
    });

    if (!usuario) {
      return res.status(400).json({ msg: "Token inválido o expirado" });
    }

    const salt = await bcrypt.genSalt(10);
    usuario.password = await bcrypt.hash(newPassword, salt);
    usuario.resetToken = undefined;
    usuario.resetTokenExpire = undefined;

    await usuario.save();

    res.json({ msg: "Contraseña actualizada correctamente" });
  } catch (error) {
    console.error("❌ Error en reset-password:", error);
    res.status(500).json({ msg: "Error interno del servidor" });
  }
});

module.exports = router;

