const express = require("express");
const { validarJWT } = require("../middlewares/validar-jwt");
const { iniciarPago } = require("../controllers/pagos");

const router = express.Router();

// Endpoint para iniciar pago de una compra pendiente
router.get("/:id", validarJWT, iniciarPago);

module.exports = router;

