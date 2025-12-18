const express = require('express');
const router = express.Router();
const Compra = require('../models/Compra');
const jwt = require('jsonwebtoken');
const axios = require('axios');

// Middleware para validar token JWT
function validarToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'Token requerido' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.uid;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

// ✅ Checkout por compra específica
router.get('/compra/:id', validarToken, async (req, res) => {
  try {
    const compra = await Compra.findById(req.params.id);
    if (!compra) return res.status(404).json({ error: 'Compra no encontrada' });
    res.json(compra);
  } catch (err) {
    res.status(500).json({ error: 'Error en servidor' });
  }
});

// ✅ Checkout por carrito completo
router.post('/carrito', validarToken, async (req, res) => {
  try {
    const { items } = req.body; // array de productos del carrito
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Carrito vacío' });
    }

    // Crear nueva compra con los productos del carrito
    const nuevaCompra = new Compra({
      usuario: req.userId,
      items,
      estado: 'pendiente',
      fecha: new Date()
    });

    await nuevaCompra.save();
    res.json({ compraId: nuevaCompra._id, compra: nuevaCompra });
  } catch (err) {
    res.status(500).json({ error: 'Error creando compra desde carrito' });
  }
});

// ✅ Calcular envío con Andreani
router.get('/envios/andreani', validarToken, async (req, res) => {
  const { origen, destino, peso } = req.query;
  try {
    const response = await axios.get('https://api.andreani.com/envios', {
      params: { origen, destino, peso },
      headers: {
        Authorization: `Bearer ${process.env.ANDREANI_TOKEN}`
      }
    });
    res.json(response.data);
  } catch (err) {
    if (err.response?.status === 403) {
      return res.status(403).json({ error: 'Credenciales Andreani inválidas' });
    }
    res.status(500).json({ error: 'Error consultando Andreani' });
  }
});

module.exports = router;
