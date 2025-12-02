const { Router } = require('express');
const { login, forgotPassword, resetPassword } = require('../controllers/auth');
const { check } = require('express-validator');
const { validarCampos } = require('../middlewares/validarCampos');

const router = Router();

// Login
router.post('/login', [
  check('correo', 'El correo no es válido').isEmail(),
  check('password', 'La contraseña es obligatoria').notEmpty(),
  validarCampos
], login);

// Forgot password
router.post('/forgot-password', [
  check('correo', 'El correo no es válido').isEmail(),
  validarCampos
], forgotPassword);

// Reset password
router.post('/reset-password', [
  check('token', 'El token es obligatorio').notEmpty(),
  check('nuevaPassword', 'La nueva contraseña debe tener mínimo 6 caracteres').isLength({ min: 6 }),
  validarCampos
], resetPassword);

module.exports = router;

