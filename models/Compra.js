const mongoose = require("mongoose");

const ProductoSchema = new mongoose.Schema({
  productoId: { type: mongoose.Schema.Types.ObjectId, ref: "Producto", required: true },
  nombre: { type: String, required: true },
  precio: { type: Number, required: true },
  cantidad: { type: Number, required: true },
  talle: { type: String }
});

const CompraSchema = new mongoose.Schema({
  usuario: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true },
  productos: [ProductoSchema],
  estado: { type: String, enum: ["pendiente", "pagada", "cancelada"], default: "pendiente" },
  total: { type: Number, required: true },
  fecha: { type: Date, default: Date.now }
});

// 👇 esta línea evita el OverwriteModelError
module.exports = mongoose.models.Compra || mongoose.model("Compra", CompraSchema);



