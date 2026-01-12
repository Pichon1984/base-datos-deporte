const { Router } = require("express");
const bcrypt = require("bcryptjs");
const Usuario = require("../models/usuario");
const { generarJWT } = require("../helpers/generar-jwt");
const crypto = require("crypto");
const jwt = require("jsonwebtoken"); // 👈 necesario para leer cookie en /check

const router = Router();

// 👉 Validación de contraseña
function validarPassword(password) {
  const regex = /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/;
  return regex.test(password);
}

// 👉 Registro
router.post("/register", async (req, res) => {
  const {
    nombre, apellido, correo, password,
    telefono, direccion, provincia, localidad,
    codigoPostal, dni,
  } = req.body;

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

    // 🔐 Hashear contraseña antes de guardar
    const salt = bcrypt.genSaltSync();
    const hashedPassword = bcrypt.hashSync(password, salt);

    const usuario = new Usuario({
      nombre, apellido, correo, password: hashedPassword,
      telefono, direccion, provincia, localidad,
      codigoPostal, dni,
      estado: true,
      rol: "CLIENTE",
    });

    await usuario.save();
    const token = await generarJWT(usuario.id);

    if (process.env.NODE_ENV === "production") {
      res.cookie("token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 12 * 60 * 60 * 1000,
      });
      return res.status(201).json({ msg: "Usuario registrado" });
    }

    return res.status(201).json({ msg: "Usuario registrado", token });
  } catch (error) {
    console.error("❌ Error en register:", error.message);
    return res.status(500).json({ msg: "Error interno del servidor" });
  }
});

// 👉 Login
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
        maxAge: 12 * 60 * 60 * 1000,
      });
      return res.json({ msg: "Login correcto", usuario: usuarioData });
    }

    return res.json({ msg: "Login correcto", token, usuario: usuarioData });
  } catch (error) {
    console.error("❌ Error en login:", error.message);
    return res.status(500).json({ msg: "Error interno del servidor" });
  }
});

// 👉 Logout
router.post("/logout", (req, res) => {
  try {
    if (process.env.NODE_ENV === "production") {
      res.clearCookie("token", {
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


// 👉 Check sesión (lee cookie en prod, header en dev)
router.get("/check", async (req, res) => {
  try {
    let token;

    if (process.env.NODE_ENV === "production") {
      token = req.cookies.token; // 👈 cookie httpOnly
    } else {
      token = req.header("x-token"); // 👈 header en dev
    }

    if (!token) {
      return res.status(401).json({ ok: false, msg: "No hay token en la petición" });
    }

    const { uid } = jwt.verify(token, process.env.SECRETORPRIVATEKEY);
    const usuario = await Usuario.findById(uid);

    if (!usuario) {
      return res.status(404).json({ ok: false, msg: "Usuario no encontrado" });
    }

    return res.json({
      ok: true,
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        correo: usuario.correo,
        rol: usuario.rol,
      },
    });
  } catch (error) {
    console.error("❌ Error en check:", error.message);
    return res.status(401).json({ ok: false, msg: "Token inválido o expirado" });
  }
});

// 👉 Forgot password
router.post("/forgot-password", async (req, res) => {
  try {
    const { correo } = req.body;
    if (!correo) return res.status(400).json({ msg: "El correo es obligatorio" });

    const usuario = await Usuario.findOne({ correo });
    if (!usuario) return res.status(404).json({ msg: "Usuario no encontrado" });

    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    usuario.resetToken = hashedToken;
    usuario.resetTokenExpire = Date.now() + 3600000;
    await usuario.save();

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    return res.json({ msg: "Enlace de recuperación generado", link: resetLink });
  } catch (error) {
    console.error("❌ Error en forgot-password:", error.message);
    return res.status(500).json({ msg: "Error interno del servidor" });
  }
});

// 👉 Reset password
router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ msg: "Token y nueva contraseña son obligatorios" });
    }

    if (!validarPassword(newPassword)) {
      return res.status(400).json({
        msg: "La contraseña debe tener mínimo 8 caracteres, incluir una mayúscula y un número",
      });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const usuario = await Usuario.findOne({
      resetToken: hashedToken,
      resetTokenExpire: { $gt: Date.now() },
    });

    if (!usuario) {
      return res.status(400).json({ msg: "Token inválido o expirado" });
    }

    const salt = bcrypt.genSaltSync();
    usuario.password = bcrypt.hashSync(newPassword, salt);

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

