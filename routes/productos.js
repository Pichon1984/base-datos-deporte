const { Router } = require('express');
const { productoPost, productoDelete, productoPut, productosGet, productoGet } = require('../controllers/productos');
const { check } = require('express-validator');
const { productoExiste } = require('../helpers/db-validators');
const { validarCampos } = require('../middlewares/validarCampos');
const { validarJWT } = require('../middlewares/validar-jwt');
const { esAdminRole } = require('../middlewares/validar-roles');
const Producto = require('../models/producto'); // asegurate de importar tu modelo

const router = Router();

// ✅ Obtener todos los productos o filtrados por categoría
router.get('/', async (req, res) => {
  try {
    const { categoria } = req.query;

    if (categoria) {
      // trae solo los productos de esa categoría
      const productos = await Producto.find({ categoria: categoria.toLowerCase() });
      return res.json(productos);
    }

    // si no hay categoría, devuelve todos
    const productos = await Producto.find();
    res.json(productos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Obtener producto por ID
router.get('/:id', [
  check('id', 'el id no es valido').isMongoId(),
  check('id').custom(productoExiste),
  validarCampos
], productoGet);

// ✅ Crear producto
router.post('/', [
  validarJWT,
  esAdminRole,
  check('nombre', "el nombre es obligatorio").notEmpty(),
  validarCampos
], productoPost);

// ✅ Actualizar producto
router.put('/:id', [
  validarJWT,
  esAdminRole,
  check('id', "el id no es valido").isMongoId(),
  check('id').custom(productoExiste),
  validarCampos
], productoPut);

// ✅ Eliminar producto
router.delete('/:id', [
  validarJWT,
  esAdminRole,
  check('id', "el id no es valido").isMongoId(),
  check('id').custom(productoExiste),
  validarCampos
], productoDelete);

module.exports = router;

