const { Router } = require('express');
const { crearCompra, obtenerHistorial } = require('../controllers/compra');
const { validarJWT } = require('../middlewares/validar-jwt');

const router = Router();

// Crear compra
router.post('/', validarJWT, crearCompra);

// Historial de compras
router.get('/historial', validarJWT, obtenerHistorial);

module.exports = router;

