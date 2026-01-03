const mongoose = require("mongoose");

const compraSchema = new mongoose.Schema(
  {
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true },
    ordenId: { type: mongoose.Schema.Types.ObjectId, ref: "Orden", required: true },

    productos: [
      {
        productoId: { type: mongoose.Schema.Types.ObjectId, ref: "Producto", required: true },
        nombre: String,
        precio: Number,
        cantidad: Number,
        talle: String,
        subtotal: Number,
      },
    ],

    total: { type: Number, required: true },
    costoEnvio: { type: Number, required: true, default: 0 },
    totalFinal: { type: Number, required: true },

    estado: {
      type: String,
      enum: ["pendiente", "pagada", "cancelada", "fallida", "reembolsada"],
      default: "pendiente",
    },

    estadoEnvio: {
      type: String,
      enum: ["pendiente", "enviado", "entregado"],
      default: "pendiente",
    },

    trackingNumber: { type: String, default: null },
    courier: { type: String, default: null },

    fechaEnvio: { type: Date, default: null },
    fechaEntrega: { type: Date, default: null },

    // 📌 Historial de eventos de envío
    envioEventos: [
      {
        status: { type: String }, // ej. "EN_CAMINO", "ENTREGADO"
        fecha: { type: Date, default: Date.now },
        origen: { type: String }, // opcional: sucursal/origen
        destino: { type: String }, // opcional: CP destino
      },
    ],

    // 📌 Información de pago
    paymentId: { type: String, default: null }, // ID de MercadoPago
    paymentStatus: { type: String, default: null }, // Estado actual del pago

    // 📌 Historial de eventos de pago
    pagoEventos: [
      {
        status: { type: String }, // ej. "approved", "rejected", "refunded"
        fecha: { type: Date, default: Date.now },
        paymentId: { type: String }, // ID del pago en MercadoPago
      },
    ],
  },
  { timestamps: true }
);

// 🔑 Middleware para calcular subtotal y totalFinal automáticamente
compraSchema.pre("save", function (next) {
  this.total = this.productos.reduce((acc, item) => {
    const subtotalItem = item.subtotal || item.precio * item.cantidad;
    item.subtotal = subtotalItem;
    return acc + subtotalItem;
  }, 0);

  this.totalFinal = this.total + (this.costoEnvio || 0);
  next();
});

module.exports = mongoose.models.Compra || mongoose.model("Compra", compraSchema);


