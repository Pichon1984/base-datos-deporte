const { Router } = require('express');
const { get } = require('mongoose');
const { usuariosGet, usuariosGetId, usuariosPost, usuarioDelete, usuarioPut } = require('../controllers/usuarios');
const { validarJWT } = require('../middlewares/validar-jwt');
const { esAdminRole } = require('../middlewares/validar-roles');
const { check } = require('express-validator');
const { usuarioExiste, emailExiste, esRolValido } = require('../helpers/db-validators');
const { validarCampos } = require('../middlewares/validarCampos');



const router = Router();
validarJWT,
    esAdminRole,
    router.get('/', [

    ], usuariosGet);

router.get('/:id', [
    check('id', "el id no es valido").isMongoId(),
    check('id').custom(usuarioExiste),
    validarCampos
], usuariosGetId);

router.post('/', [
    check('nombre', "el nombre es obligatorio").notEmpty(),
    check("apellido", "el apellido es obligatorio").notEmpty(),
    check("correo").custom(emailExiste),
    check("password", "la contraseña debe tener un minimo de 6 caracteres").isLength({ min: 6 }),
    check("rol").custom(esRolValido),
    validarCampos
], usuariosPost);

router.put('/:id',[
validarJWT,
check("id", "no es un ID valido").isMongoId(),
check("id").custom(usuarioExiste),
validarCampos,
], usuarioPut);

router.delete('/:id',[
    validarJWT,
    esAdminRole,
    check("id", "no es un id valido ").isMongoId(),
    check("id").custom(usuarioExiste),
    validarCampos
], usuarioDelete);

module.exports = router; 