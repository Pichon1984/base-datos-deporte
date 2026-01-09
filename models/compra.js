const mongoose = require("mongoose");

const compraSchema = new mongoose.Schema(
  {
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true },
    ordenId: { type: mongoose.Schema.Types.ObjectId, ref: "Orden", required: true },

    productos: [
      {
        productoId: { type: mongoose.Schema.Types.ObjectId, ref: "Producto", required: true },
        nombre: String,
        precio: { type: Number, required: true },
        cantidad: { type: Number, required: true },
        talle: String,
        subtotal: Number,
      },
    ],

    total: { type: Number, required: true, default: 0 },
    costoEnvio: { type: Number, required: true, default: 0 },
    totalFinal: { type: Number, required: true, default: 0 },

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

    envioEventos: [
      {
        status: { type: String },
        fecha: { type: Date, default: Date.now },
        origen: { type: String },
        destino: { type: String },
      },
    ],

    paymentId: { type: String, default: null },
    paymentStatus: { type: String, default: null },

    pagoEventos: [
      {
        status: { type: String },
        fecha: { type: Date, default: Date.now },
        paymentId: { type: String },
      },
    ],
  },
  { timestamps: true }
);

// 🔑 Middleware para calcular subtotal y totalFinal automáticamente con dos decimales
compraSchema.pre("save", function (next) {
  if (Array.isArray(this.productos) && this.productos.length > 0) {
    this.total = this.productos.reduce((acc, item) => {
      // normalizamos precio
      if (Number.isFinite(item.precio)) {
        item.precio = Number(parseFloat(item.precio).toFixed(2));
      }

      // calculamos subtotal
      const subtotalItem = item.subtotal || item.precio * item.cantidad;
      item.subtotal = Number(parseFloat(subtotalItem).toFixed(2));

      return acc + item.subtotal;
    }, 0);
  } else {
    this.total = 0;
  }

  // normalizamos total y costo de envío
  this.total = Number(parseFloat(this.total).toFixed(2));
  this.costoEnvio = Number.isFinite(this.costoEnvio)
    ? Number(parseFloat(this.costoEnvio).toFixed(2))
    : 0;

  // calculamos totalFinal
  this.totalFinal = Number(parseFloat(this.total + this.costoEnvio).toFixed(2));

  next();
});

// 🔑 Middleware para recalcular en findOneAndUpdate
compraSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();

  if (update.productos && Array.isArray(update.productos)) {
    let total = update.productos.reduce((acc, item) => {
      if (Number.isFinite(item.precio)) {
        item.precio = Number(parseFloat(item.precio).toFixed(2));
      }
      const subtotalItem = item.subtotal || item.precio * item.cantidad;
      item.subtotal = Number(parseFloat(subtotalItem).toFixed(2));
      return acc + item.subtotal;
    }, 0);

    update.total = Number(parseFloat(total).toFixed(2));
    update.costoEnvio = Number.isFinite(update.costoEnvio)
      ? Number(parseFloat(update.costoEnvio).toFixed(2))
      : 0;
    update.totalFinal = Number(parseFloat(update.total + update.costoEnvio).toFixed(2));
  }

  next();
});

module.exports = mongoose.models.Compra || mongoose.model("Compra", compraSchema);
