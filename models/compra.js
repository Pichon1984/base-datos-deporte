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
        subtotal: { type: Number, default: 0 },
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
        usuarioAccion: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario" }, // 👈 opcional
      },
    ],

    paymentId: { type: String, default: null },
    paymentStatus: { type: String, default: null },

    pagoEventos: [
      {
        status: { type: String },
        fecha: { type: Date, default: Date.now },
        paymentId: { type: String },
        usuarioAccion: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario" }, // 👈 opcional
      },
    ],

    external_reference: { type: String, default: null }, // 👈 para trazabilidad con MP
  },
  { timestamps: true }
);

// 🔑 Helper para redondear a 2 decimales
const toTwoDecimals = (num) => Math.round(num * 100) / 100;

// 🔑 Middleware para calcular subtotal y totalFinal automáticamente
compraSchema.pre("save", function (next) {
  if (Array.isArray(this.productos) && this.productos.length > 0) {
    this.total = this.productos.reduce((acc, item) => {
      if (Number.isFinite(item.precio)) {
        item.precio = toTwoDecimals(item.precio);
      }
      const subtotalItem = item.subtotal || item.precio * item.cantidad;
      item.subtotal = toTwoDecimals(subtotalItem);
      return acc + item.subtotal;
    }, 0);
  } else {
    this.total = 0;
  }

  this.total = toTwoDecimals(this.total);
  this.costoEnvio = Number.isFinite(this.costoEnvio) ? toTwoDecimals(this.costoEnvio) : 0;
  this.totalFinal = toTwoDecimals(this.total + this.costoEnvio);

  next();
});

// 🔑 Middleware para recalcular en findOneAndUpdate
compraSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();

  if (update.productos && Array.isArray(update.productos)) {
    let total = update.productos.reduce((acc, item) => {
      if (Number.isFinite(item.precio)) {
        item.precio = toTwoDecimals(item.precio);
      }
      const subtotalItem = item.subtotal || item.precio * item.cantidad;
      item.subtotal = toTwoDecimals(subtotalItem);
      return acc + item.subtotal;
    }, 0);

    update.total = toTwoDecimals(total);
    update.costoEnvio = Number.isFinite(update.costoEnvio) ? toTwoDecimals(update.costoEnvio) : 0;
    update.totalFinal = toTwoDecimals(update.total + update.costoEnvio);
  }

  next();
});

module.exports = mongoose.models.Compra || mongoose.model("Compra", compraSchema);
