const { Router } = require("express");
const {
  usuariosGet,
  usuariosGetId,
  usuariosPost,
  usuarioDelete,
  usuarioPut,
  guardarUbicacion,
  me
} = require("../controllers/usuarios");
const { validarJWT } = require("../middlewares/validar-jwt");
const { validarRol } = require("../middlewares/validarRol");
const { check } = require("express-validator");
const { usuarioExiste, emailExiste } = require("../helpers/db-validators");
const { validarCampos } = require("../middlewares/validarCampos");
const Usuario = require("../models/usuario");

const router = Router();

// 📌 GET todos los usuarios - Solo ADMIN
router.get("/", [validarJWT, validarRol(["ADMIN"])], usuariosGet);

// 📌 GET perfil del usuario autenticado (antes que :id)
router.get("/me", [validarJWT], async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.usuario._id);
    if (!usuario) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }
    const obj = usuario.toObject();
    delete obj.password;
    res.json(obj);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al obtener perfil" });
  }
});

// 📌 PUT actualizar perfil del usuario autenticado
router.put("/me", [validarJWT], async (req, res) => {
  try {
    const usuario = await Usuario.findByIdAndUpdate(req.usuario._id, req.body, { new: true });
    if (!usuario) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }
    const obj = usuario.toObject();
    delete obj.password;
    res.json(obj);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al actualizar perfil" });
  }
});

// 📌 GET usuario por ID - Solo ADMIN
router.get("/:id", [
  validarJWT,
  validarRol(["ADMIN"]),
  check("id", "El ID no es válido").isMongoId(),
  validarCampos
], usuariosGetId);

// 📌 POST crear usuario
router.post("/", [
  check("nombre", "El nombre es obligatorio").notEmpty(),
  check("apellido", "El apellido es obligatorio").notEmpty(),
  check("correo", "El correo no es válido").isEmail(),
  check("correo").custom(emailExiste),
  check("password", "La contraseña debe tener al menos 6 caracteres").isLength({ min: 6 }),
  validarCampos
], usuariosPost);

// 📌 PUT actualizar usuario por ID
router.put("/:id", [
  validarJWT,
  check("id", "El ID no es válido").isMongoId(),
  check("id").custom(usuarioExiste),
  validarCampos
], usuarioPut);

// 📌 DELETE usuario - Solo ADMIN
router.delete("/:id", [
  validarJWT,
  validarRol(["ADMIN"]),
  check("id", "El ID no es válido").isMongoId(),
  check("id").custom(usuarioExiste),
  validarCampos
], usuarioDelete);

// 📌 POST guardar ubicación del usuario autenticado
router.post("/ubicacion", [validarJWT], guardarUbicacion);

module.exports = router;


