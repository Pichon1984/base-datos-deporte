const { Router } = require("express");
const { check } = require("express-validator");
const {
  productosGet,
  productoGet,
  productoPost,
  productoPut,
  productoDelete,
} = require("../controllers/productos");
const { validarJWT } = require("../middlewares/validar-jwt");
const { validarCampos } = require("../middlewares/validarCampos");
const { productoExiste, categoriaExiste } = require("../helpers/db-validators");
const { validarRol } = require("../middlewares/validarRol");

const router = Router();

/**
 * ✅ Listar productos (público, con búsqueda/filtros/paginación)
 * GET /api/productos
 */
router.get("/", productosGet);

/**
 * ✅ Obtener producto por ID (público)
 * GET /api/productos/:id
 */
router.get(
  "/:id",
  [
    check("id", "El ID no es válido").isMongoId(),
    check("id").custom(productoExiste),
    validarCampos,
  ],
  productoGet
);

/**
 * ✅ Crear producto (solo ADMIN)
 * POST /api/productos
 */
router.post(
  "/",
  [
    validarJWT,
    validarRol(["ADMIN"]),
    check("nombre", "El nombre es obligatorio").notEmpty(),
    check("precio", "El precio debe ser un número válido").isNumeric(),
    check("categoria", "La categoría es obligatoria y debe ser un ID válido").isMongoId(),
    check("categoria").custom(categoriaExiste),
    validarCampos,
  ],
  productoPost
);

/**
 * ✅ Actualizar producto (solo ADMIN)
 * PUT /api/productos/:id
 */
router.put(
  "/:id",
  [
    validarJWT,
    validarRol(["ADMIN"]),
    check("id", "El ID no es válido").isMongoId(),
    check("id").custom(productoExiste),
    validarCampos,
  ],
  productoPut
);

/**
 * ✅ Eliminar producto (solo ADMIN)
 * DELETE /api/productos/:id
 */
router.delete(
  "/:id",
  [
    validarJWT,
    validarRol(["ADMIN"]),
    check("id", "El ID no es válido").isMongoId(),
    check("id").custom(productoExiste),
    validarCampos,
  ],
  productoDelete
);

module.exports = router;
