const { Router } = require("express");
const bcrypt = require("bcryptjs");
const Usuario = require("../models/usuario");
const { generarJWT } = require("../helpers/generar-jwt");
const jwt = require("jsonwebtoken");
const { validarJWT } = require("../middlewares/validar-jwt");
const { forgotPassword } = require("../controllers/forgotPassword"); // 🔹 Ajusta el path según tu controlador

const router = Router();

// 🔹 Validación de contraseña
function validarPassword(password) {
  const regex = /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/;
  return regex.test(password);
}

// 🔹 Helper para generar refresh token
function generarRefreshToken(uid) {
  return jwt.sign({ uid }, process.env.REFRESH_SECRET, { expiresIn: "7d" });
}

// --- Registro ---
router.post("/register", async (req, res) => {
  const { nombre, apellido, correo, password, telefono, direccion, provincia, localidad, codigoPostal, dni } = req.body;

  try {
    if (!correo || !password) {
      return res.status(400).json({ msg: "Correo y contraseña son obligatorios" });
    }

    const correoRegex = /^\S+@\S+\.\S+$/;
    if (!correoRegex.test(correo)) {
      return res.status(400).json({ msg: "Formato de correo inválido" });
    }

    if (!validarPassword(password)) {
      return res.status(400).json({
        msg: "La contraseña debe tener mínimo 8 caracteres, incluir una mayúscula y un número",
      });
    }

    const existe = await Usuario.findOne({ correo });
    if (existe) {
      return res.status(400).json({ msg: "El correo ya está registrado" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const usuario = new Usuario({
      nombre, apellido, correo, password: hashedPassword,
      telefono, direccion, provincia, localidad,
      codigoPostal, dni,
      estado: true,
      rol: "CLIENTE",
    });

    await usuario.save();

    const token = await generarJWT(usuario.id);
    const refreshToken = generarRefreshToken(usuario.id);

    if (process.env.NODE_ENV === "production") {
      res.cookie("token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 15 * 60 * 1000,
      });
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      return res.status(201).json({ msg: "Usuario registrado" });
    }

    return res.status(201).json({ msg: "Usuario registrado", token, refreshToken });
  } catch (error) {
    console.error("❌ Error en register:", error.message);
    return res.status(500).json({ msg: "Error interno del servidor" });
  }
});

// --- Login ---
router.post("/login", async (req, res) => {
  const { correo, password } = req.body;

  try {
    if (!correo || !password) {
      return res.status(400).json({ msg: "Correo y contraseña son obligatorios" });
    }

    const usuario = await Usuario.findOne({ correo });
    if (!usuario || !usuario.estado) {
      return res.status(400).json({ msg: "Usuario / Password incorrectos" });
    }

    const validPassword = await bcrypt.compare(password, usuario.password);
    if (!validPassword) {
      return res.status(400).json({ msg: "Usuario / Password incorrectos" });
    }

    const token = await generarJWT(usuario.id);
    const refreshToken = generarRefreshToken(usuario.id);

    const usuarioData = {
      id: usuario._id,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      correo: usuario.correo,
      rol: usuario.rol,
      telefono: usuario.telefono,
      direccion: usuario.direccion,
      provincia: usuario.provincia,
      localidad: usuario.localidad,
      codigoPostal: usuario.codigoPostal,
      dni: usuario.dni,
    };

    if (process.env.NODE_ENV === "production") {
      res.cookie("token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 15 * 60 * 1000,
      });
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      return res.json({ msg: "Login correcto", usuario: usuarioData });
    }

    return res.json({ msg: "Login correcto", token, refreshToken, usuario: usuarioData });
  } catch (error) {
    console.error("❌ Error en login:", error.message);
    return res.status(500).json({ msg: "Error interno del servidor" });
  }
});

// --- Refresh token ---
router.post("/refresh", (req, res) => {
  try {
    const refreshToken = process.env.NODE_ENV === "production"
      ? req.cookies.refreshToken
      : req.body.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ msg: "No hay refresh token" });
    }

    const { uid } = jwt.verify(refreshToken, process.env.REFRESH_SECRET);
    const newToken = generarJWT(uid);

    if (process.env.NODE_ENV === "production") {
      res.cookie("token", newToken, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 15 * 60 * 1000,
      });
      return res.json({ msg: "Token renovado" }); // 🔹 En producción no devolvemos el token, sólo confirmamos
    }

    return res.json({ msg: "Token renovado", token: newToken });
  } catch (error) {
    console.error("❌ Error en refresh:", error.message);
    return res.status(401).json({ msg: "Refresh token inválido o expirado" });
  }
});

// --- Logout ---
router.post("/logout", (req, res) => {
  try {
    if (process.env.NODE_ENV === "production") {
      res.clearCookie("token", {
        httpOnly: true,
        secure: true,
        sameSite: "none",
      });
      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: true,
        sameSite: "none",
      });
    }
    return res.json({ msg: "Sesión cerrada" });
  } catch (error) {
    console.error("❌ Error en logout:", error.message);
    return res.status(500).json({ msg: "Error interno del servidor" });
  }
});

// --- Check sesión ---
router.get("/check", validarJWT, (req, res) => {
  const u = req.usuario;
  const usuarioData = {
    id: u._id,
    nombre: u.nombre,
    apellido: u.apellido,
    correo: u.correo,
    rol: (u.rol || "").toUpperCase(),
    telefono: u.telefono,
    direccion: u.direccion,
    provincia: u.provincia,
    localidad: u.localidad,
    codigoPostal: u.codigoPostal,
    dni: u.dni,
  };
  res.json({ usuario: usuarioData });
});

// --- Forgot Password ---
router.post("/forgot-password", forgotPassword);

// --- Reset Password ---
router.post("/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    if (!token || !newPassword) {
      return res.status(400).json({ msg: "Token y nueva contraseña son obligatorios" });
    }

    // Hashear el token recibido para compararlo con el guardado
    const hashedToken = require("crypto")
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const usuario = await Usuario.findOne({
      resetToken: hashedToken,
      resetTokenExpire: { $gt: Date.now() },
    });

    if (!usuario) {
      return res.status(400).json({ msg: "Token inválido o expirado" });
    }

    // Validar nueva contraseña
    if (!validarPassword(newPassword)) {
      return res.status(400).json({
        msg: "La contraseña debe tener mínimo 8 caracteres, incluir una mayúscula y un número",
      });
    }

    // Guardar nueva contraseña
    const salt = await bcrypt.genSalt(10);
    usuario.password = await bcrypt.hash(newPassword, salt);

    // Limpiar token de recuperación
    usuario.resetToken = undefined;
    usuario.resetTokenExpire = undefined;

    await usuario.save();

    return res.json({ msg: "Contraseña actualizada correctamente" });
  } catch (error) {
    console.error("❌ Error en reset-password:", error.message);
    return res.status(500).json({ msg: "Error interno del servidor" });
  }
});
module.exports = router;