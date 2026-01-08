const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  productoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Producto', required: true },
  nombre: { type: String }, 
  precio: { type: Number, required: true }, 
  talle: { type: String, default: null },
  cantidad: { type: Number, required: true, min: 1 }
}, { _id: false });

const carritoSchema = new mongoose.Schema({
  usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', unique: true, required: true },
  items: { type: [itemSchema], default: [] },
  estado: { type: String, enum: ['activo', 'cerrado'], default: 'activo' }
}, { timestamps: true });

module.exports = mongoose.model('Carrito', carritoSchema);
