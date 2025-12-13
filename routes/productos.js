const { Router } = require('express');
const {
  productosGet,
  productoGet,
  productoPost,
  productoPut,
  productoDelete
} = require('../controllers/productos');
const { validarJWT } = require('../middlewares/validar-jwt');

const router = Router();

// ✅ Listar productos
router.get('/', productosGet);

// ✅ Obtener producto por ID
router.get('/:id', productoGet);

// ✅ Crear producto (requiere token válido)
router.post('/', validarJWT, productoPost);

// ✅ Actualizar producto (requiere token válido)
router.put('/:id', validarJWT, productoPut);

// ✅ Eliminar producto (requiere token válido)
router.delete('/:id', validarJWT, productoDelete);

module.exports = router;

