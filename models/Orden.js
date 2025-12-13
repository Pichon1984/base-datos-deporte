const mongoose = require("mongoose");

const ordenSchema = new mongoose.Schema(
  {
    cliente: {
      nombre: { type: String, required: true },
      email: { type: String, required: true },
      direccion: { type: String, required: true },
      localidad: { type: String, required: true },
      provincia: { type: String, required: true },
      codigoPostal: { type: String, required: true },
      telefono: { type: String }
    },
    productos: [
      {
        productoId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Producto",
          required: true
        },
        talle: { type: String },
        cantidad: { type: Number, required: true },
        precio: { type: Number, required: true }
      }
    ],
    total: { type: Number, required: true },
    estado: {
      type: String,
      enum: ["pendiente", "pagado", "enviado", "completado", "cancelado"],
      default: "pendiente"
    },
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Orden", ordenSchema);




