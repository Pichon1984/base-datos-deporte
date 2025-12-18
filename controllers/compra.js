const Compra = require('../models/Compra');
const Producto = require('../models/producto');
const mongoose = require('mongoose');

const crearCompra = async (req, res) => {
  try {
    const { items } = req.body;
    const clienteId = req.usuario._id;  // viene del JWT

    let total = 0;
    const itemsProcesados = [];

    for (const item of items) {
      // Validar que el ID sea válido
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

      // Actualizar stock
      producto.stock -= item.cantidad;
      await producto.save();

      const subtotal = item.cantidad * producto.precio;
      total += subtotal;

      itemsProcesados.push({
        productoId: producto._id,
        nombre: producto.nombre,
        cantidad: item.cantidad,
        precioUnitario: producto.precio
      });
    }

    const nuevaCompra = new Compra({
      clienteId,
      total,
      items: itemsProcesados,
      fecha: new Date() // aseguramos que se guarde la fecha
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

const obtenerHistorial = async (req, res) => {
  try {
    const clienteId = req.usuario._id; // viene del JWT

    const compras = await Compra.find({ clienteId })
      .populate('items.productoId', 'nombre precio') // opcional: mostrar info del producto
      .sort({ fecha: -1 }); // orden descendente

    res.json({
      msg: 'Historial de compras',
      compras
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error al obtener historial' });
  }
};

module.exports = {
  crearCompra,
  obtenerHistorial
};



