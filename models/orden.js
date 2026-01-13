const mongoose = require("mongoose");

const ProductoSchema = new mongoose.Schema(
  {
    productoId: { type: mongoose.Schema.Types.ObjectId, ref: "Producto", required: true },
    nombre: { type: String, required: true },
    precio: { type: Number, required: true },
    cantidad: { type: Number, required: true },
    talle: { type: String },
    subtotal: { type: Number, default: 0 } 
  },
  { _id: false }
);

const OrdenSchema = new mongoose.Schema(
  {
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true },

    productos: [ProductoSchema],

    envio: {
      nombre: { type: String, required: true },
      email: { type: String, required: true },
      direccion: { type: String },
      telefono: { type: String }
    },

    estado: {
      type: String,
      enum: ["pendiente", "pagada", "cancelada"],
      default: "pendiente"
    },

    estadoEnvio: {
      type: String,
      enum: ["pendiente", "enviado", "entregado"],
      default: "pendiente"
    },

    total: { type: Number, required: true },       
    costoEnvio: { type: Number, required: true },  
    totalFinal: { type: Number, required: true },  

    mercadoPago: {
      preference_id: { type: String, default: null },
      init_point: { type: String, default: null },
      payment_id: { type: String, default: null },
      status: { type: String, default: null },
      status_detail: { type: String, default: null },
      update_time: { type: Date } 
    },

    external_reference: { type: String, default: null },

    fechaEnvio: { type: Date },
    fechaEntrega: { type: Date }
  },
  { timestamps: true }
);

module.exports = mongoose.models.Orden || mongoose.model("Orden", OrdenSchema);
