const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
  productoId: { type: mongoose.Schema.Types.ObjectId, ref: "Producto", required: true },
  nombre: { type: String },
  precio: { type: Number, required: true },
  talle: { type: String, default: null },
  cantidad: { type: Number, required: true, min: 1 },
  subtotal: { type: Number, default: 0 }
}, { _id: false });

const carritoSchema = new mongoose.Schema({
  usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", unique: true, required: true },
  items: { type: [itemSchema], default: [] },
  estado: { type: String, enum: ["activo", "cerrado"], default: "activo" },
  total: { type: Number, default: 0 }
}, { timestamps: true });

/**
 * 🔑 Middleware para recalcular subtotales y total del carrito
 */
function calcularTotales(doc) {
  if (Array.isArray(doc.items) && doc.items.length > 0) {
    let total = doc.items.reduce((acc, item) => {
      if (Number.isFinite(item.precio)) {
        item.precio = Number(parseFloat(item.precio).toFixed(2));
      }
      const subtotalItem = item.subtotal || item.precio * item.cantidad;
      item.subtotal = Number(parseFloat(subtotalItem).toFixed(2));
      return acc + item.subtotal;
    }, 0);
    doc.total = Number(parseFloat(total).toFixed(2));
  } else {
    doc.total = 0;
  }
}

// Antes de guardar
carritoSchema.pre("save", function (next) {
  calcularTotales(this);
  next();
});

// Antes de actualizar con findOneAndUpdate
carritoSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();
  if (update.items && Array.isArray(update.items)) {
    let total = update.items.reduce((acc, item) => {
      if (Number.isFinite(item.precio)) {
        item.precio = Number(parseFloat(item.precio).toFixed(2));
      }
      const subtotalItem = item.subtotal || item.precio * item.cantidad;
      item.subtotal = Number(parseFloat(subtotalItem).toFixed(2));
      return acc + item.subtotal;
    }, 0);
    update.total = Number(parseFloat(total).toFixed(2));
  }
  next();
});

module.exports = mongoose.models.Carrito || mongoose.model("Carrito", carritoSchema);
