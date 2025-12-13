const { Router } = require('express');
const {
  usuariosGet,
  usuariosGetId,
  usuariosPost,
  usuarioDelete,
  usuarioPut
} = require('../controllers/usuarios');
const { validarJWT } = require('../middlewares/validar-jwt');
const { validarRol } = require('../middlewares/validarRol'); // middleware genérico
const { check } = require('express-validator');
const { usuarioExiste, emailExiste } = require('../helpers/db-validators'); // quitamos esRolValido
const { validarCampos } = require('../middlewares/validarCampos');
const Usuario = require('../models/usuario'); // asegúrate que el archivo se llame usuario.js

const router = Router();

/**
 * 📌 GET todos los usuarios (con búsqueda y paginación) - Solo ADMIN
 */
router.get(
  '/',
  [
    validarJWT,
    validarRol(['ADMIN'])
  ],
  usuariosGet
);

/**
 * 📌 GET usuario por ID - Solo ADMIN
 */
router.get(
  '/:id',
  [
    validarJWT,
    validarRol(['ADMIN']),
    check('id', 'El ID no es válido').isMongoId(),
    validarCampos
  ],
  usuariosGetId
);

/**
 * 📌 POST crear usuario
 */
router.post(
  '/',
  [
    check('nombre', 'El nombre es obligatorio').notEmpty(),
    check('apellido', 'El apellido es obligatorio').notEmpty(),
    check('correo', 'El correo no es válido').isEmail(),
    check('correo').custom(emailExiste),
    check('password', 'La contraseña debe tener al menos 6 caracteres').isLength({ min: 6 }),
    validarCampos
  ],
  usuariosPost
);

/**
 * 📌 PUT actualizar usuario por ID (incluye bloquear/desbloquear)
 */
router.put(
  '/:id',
  [
    validarJWT,
    check('id', 'El ID no es válido').isMongoId(),
    check('id').custom(usuarioExiste),
    validarCampos
  ],
  usuarioPut
);

/**
 * 📌 DELETE lógico (inhabilitar usuario) - Solo ADMIN
 */
router.delete(
  '/:id',
  [
    validarJWT,
    validarRol(['ADMIN']),
    check('id', 'El ID no es válido').isMongoId(),
    check('id').custom(usuarioExiste),
    validarCampos
  ],
  usuarioDelete
);

/**
 * 📌 GET perfil del usuario autenticado
 */
router.get('/me', [validarJWT], (req, res) => {
  res.json(req.usuario.toJSON()); // devuelve usuario limpio sin password ni __v
});

/**
 * 📌 PUT actualizar perfil del usuario autenticado
 */
router.put('/me', [validarJWT], async (req, res) => {
  try {
    const usuario = await Usuario.findByIdAndUpdate(
      req.usuario._id,
      req.body,
      { new: true }
    );

    if (!usuario) {
      return res.status(404).json({ msg: 'Usuario no encontrado' });
    }

    res.json(usuario.toJSON()); // devuelve usuario limpio
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error al actualizar usuario' });
  }
});

module.exports = router;

