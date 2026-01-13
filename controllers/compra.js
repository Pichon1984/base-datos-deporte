const Compra = require('../models/Compra');
const Producto = require('../models/producto');
const mongoose = require('mongoose');

// 📌 Crear compra
const crearCompra = async (req, res) => {
  try {
    const { items } = req.body;
    const usuarioId = req.usuario._id;  

    let total = 0;
    const productosProcesados = [];

    for (const item of items) {
      if (!mongoose.Types.ObjectId.isValid(item.productoId)) {
        return res.status(400).json({ msg: `ID inválido: ${item.productoId}` });
      }

      const producto = await Producto.findById(item.productoId);
      if (!producto) {
        return res.status(404).json({ msg: `Producto no encontrado: ${item.productoId}` });
      }

      if (producto.stock < item.cantidad) {
        return res.status(400).json({ msg: `Stock insuficiente para ${producto.nombre}` });
      }

      producto.stock -= item.cantidad;
      await producto.save();

      const subtotal = item.cantidad * producto.precio;
      total += subtotal;

      productosProcesados.push({
        productoId: producto._id,
        nombre: producto.nombre,
        cantidad: item.cantidad,
        precio: producto.precio,  
        talle: item.talle || null,
        subtotal               
      });
    }

    // 🚚 Lógica de envío
    const ENVIO_BASE = 30000;
    const LIMITE_ENVIO_GRATIS = 200000;

    let costoEnvio = 0;
    if (total >= LIMITE_ENVIO_GRATIS) {
      costoEnvio = 0; // envío gratis
    } else {
      costoEnvio = ENVIO_BASE;
      
    }

    const nuevaCompra = new Compra({
      usuario: usuarioId,               
      productos: productosProcesados,   
      total,
      costoEnvio,
      totalFinal: total + costoEnvio,
      estado: "pendiente"
    });

    await nuevaCompra.save();

    res.status(201).json({
      msg: 'Compra realizada con éxito',
      compra: nuevaCompra
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error al procesar la compra' });
  }
};

module.exports = { crearCompra };
