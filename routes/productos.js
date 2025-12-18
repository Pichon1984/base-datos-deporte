const { Router } = require("express");
const { check } = require("express-validator");
const {
  productosGet,
  productoGet,
  productoPost,
  productoPut,
  productoDelete
} = require("../controllers/productos");
const { validarJWT } = require("../middlewares/validar-jwt");
const { validarCampos } = require("../middlewares/validarCampos");
const { productoExiste } = require("../helpers/db-validators");
const { validarRol } = require("../middlewares/validarRol");

const router = Router();

// ✅ Listar productos (con búsqueda)
router.get("/", productosGet);

// ✅ Obtener producto por ID
router.get(
  "/:id",
  [
    check("id", "El ID no es válido").isMongoId(),
    check("id").custom(productoExiste),
    validarCampos
  ],
  productoGet
);

// ✅ Crear producto (solo admin)
router.post(
  "/",
  [
    validarJWT,
    validarRol(["ADMIN"]), // 👈 corregido
    check("nombre", "El nombre es obligatorio").notEmpty(),
    validarCampos
  ],
  productoPost
);

// ✅ Actualizar producto (solo admin)
router.put(
  "/:id",
  [
    validarJWT,
    validarRol(["ADMIN"]),
    check("id", "El ID no es válido").isMongoId(),
    check("id").custom(productoExiste),
    validarCampos
  ],
  productoPut
);

// ✅ Eliminar producto (solo admin)
router.delete(
  "/:id",
  [
    validarJWT,
    validarRol(["ADMIN"]),
    check("id", "El ID no es válido").isMongoId(),
    check("id").custom(productoExiste),
    validarCampos
  ],
  productoDelete
);

module.exports = router;



