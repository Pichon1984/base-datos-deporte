const { Router } = require("express");
const bcrypt = require("bcryptjs");
const Usuario = require("../models/usuario");
const { generarJWT } = require("../helpers/generar-jwt");
const crypto = require("crypto");
const { validarJWT } = require("../middlewares/validar-jwt");
const router = Router();

// Función auxiliar para validar contraseña
function validarPassword(password) {
  // mínimo 8 caracteres, al menos una mayúscula y un número
  const regex = /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/;
  return regex.test(password);
}

// Registro
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
    dni,
  } = req.body;

  try {
    if (!correo || !password) {
      return res.status(400).json({ msg: "Correo y contraseña son obligatorios" });
    }

    // Validar formato de correo
    const correoRegex = /^\S+@\S+\.\S+$/;
    if (!correoRegex.test(correo)) {
      return res.status(400).json({ msg: "Formato de correo inválido" });
    }

    // Validar complejidad de contraseña
    if (!validarPassword(password)) {
      return res.status(400).json({
        msg: "La contraseña debe tener mínimo 8 caracteres, incluir una mayúscula y un número",
      });
    }

    const existe = await Usuario.findOne({ correo });
    if (existe) {
      return res.status(400).json({ msg: "El correo ya está registrado" });
    }

    const usuario = new Usuario({
      nombre,
      apellido,
      correo,
      password, // texto plano, el modelo lo hashea en pre('save')
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

    return res.status(201).json({
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
    console.error("❌ Error en register:", error.message);
    return res.status(500).json({ msg: "Error interno del servidor" });
  }
});

// Login
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

    return res.json({
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
    console.error("❌ Error en login:", error.message);
    return res.status(500).json({ msg: "Error interno del servidor" });
  }
});
// Logout
router.post("/logout", (req, res) => {
  try {
    if (process.env.NODE_ENV === "production") {
      // 🧹 En producción: limpiar cookie httpOnly
      res.clearCookie("token", {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
      });
      return res.json({ msg: "Sesión cerrada correctamente (cookie eliminada)" });
    } else {
      // 🛠 En desarrollo: frontend borra localStorage
      return res.json({ msg: "Sesión cerrada correctamente (borra localStorage en frontend)" });
    }
  } catch (error) {
    console.error("❌ Error en logout:", error.message);
    return res.status(500).json({ msg: "Error interno del servidor" });
  }
});
// Check sesión
router.get("/check", validarJWT, (req, res) => {
  try {
    return res.json({
      ok: true,
      usuario: {
        id: req.usuario.id,
        nombre: req.usuario.nombre,
        apellido: req.usuario.apellido,
        correo: req.usuario.correo,
        rol: req.usuario.rol,
      }
    });
  } catch (error) {
    console.error("❌ Error en check:", error.message);
    return res.status(500).json({ ok: false, msg: "Error interno del servidor" });
  }
});


// Forgot password
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

    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    usuario.resetToken = hashedToken;
    usuario.resetTokenExpire = Date.now() + 3600000; // 1 hora
    await usuario.save();

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    return res.json({ msg: "Se ha generado el enlace de recuperación", link: resetLink });
  } catch (error) {
    console.error("❌ Error en forgot-password:", error.message);
    return res.status(500).json({ msg: "Error interno del servidor" });
  }
});

// Reset password
router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ msg: "Token y nueva contraseña son obligatorios" });
    }

    console.log("📩 Body recibido en reset-password:", req.body);

    // Validar complejidad de contraseña
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

    usuario.password = newPassword; // texto plano, el modelo lo hashea en pre('save')
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
