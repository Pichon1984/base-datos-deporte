const { Schema, model } = require("mongoose");

const ProductoSchema = new Schema({
  nombre: { type: String, required: true },
  precio: { type: Number, required: true },   // 👈 número, no string
  descripcion: { type: String },
  imagenes: [{ type: String }], // array de URLs
  stock: { type: Number, default: 0 },
  categoria: { type: Schema.Types.ObjectId, ref: "Categoria", required: true },
  usuario: { type: Schema.Types.ObjectId, ref: "Usuario", required: true },
  estado: { type: Boolean, default: true },
  fechaRegistro: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = model("Producto", ProductoSchema);


