const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  productoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Producto', required: true },
  talle: { type: String, default: null },
  cantidad: { type: Number, required: true, min: 1 }
}, { _id: false });

const carritoSchema = new mongoose.Schema({
  usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', unique: true, required: true },
  items: { type: [itemSchema], default: [] },
  actualizado: { type: Date, default: Date.now }
});

carritoSchema.pre('save', function(next) {
  this.actualizado = Date.now();
  next();
});

module.exports = mongoose.model('Carrito', carritoSchema);

