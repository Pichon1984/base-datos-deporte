const mongoose = require('mongoose');

const ProductoSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  descripcion: String,
  precio: { type: Number, required: true },
  imagen: String,
  categoria: {
    type: String,
    required: true,
    enum: ['accesorios', 'calzado', 'indumentaria'] // opcional: limitar categorías
  }
});

// 👇 evita el OverwriteModelError
module.exports = mongoose.models.Producto || mongoose.model('Producto', ProductoSchema);

