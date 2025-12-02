const { Router } = require('express');
const { productoPost, productoDelete, productoPut, productosGet, productoGet } = require('../controllers/productos');
const { check } = require('express-validator');
const { productoExiste } = require('../helpers/db-validators');
const { validarCampos } = require('../middlewares/validarCampos');
const { validarJWT } = require('../middlewares/validar-jwt');
const { esAdminRole } = require('../middlewares/validar-roles');

const router = Router();

 router.get('/', productosGet);

 router.get('/:id',[
    check('id', 'el id no es valido').isMongoId(),
    check('id').custom(productoExiste),
    validarCampos
 ], productoGet);

router.post('/',[
    validarJWT,
    esAdminRole,
   check('nombre', "el nombre es obligatorio").notEmpty(),
    validarCampos
], productoPost);

router.put('/:id',[
    validarJWT,
    esAdminRole,
    check('id', "el id no es valido").isMongoId(),
    check('id').custom(productoExiste),
    validarCampos
], productoPut);

router.delete('/:id',[
    validarJWT,
    esAdminRole,
    check('id', "el id no es valido").isMongoId(),
    check('id').custom(productoExiste),
    validarCampos
], productoDelete);

module.exports = router;
