const { Schema, model } = require("mongoose");

const ProductoSchema = new Schema(
  {
    nombre: { type: String, required: true, trim: true },
    precio: { type: Number, required: true, min: 0 },
    descripcion: { type: String, trim: true },
    imagenes: [{ type: String }],

    //  Stock total calculado automáticamente
    stock: { type: Number, default: 0, min: 0 },

    // Talles con unidades disponibles
    tallesUnidades: [
      {
        talle: { type: String, required: true, trim: true }, 
        stock: { type: Number, default: 0, min: 0 },
      },
    ],

    //  Relación con categoría
    categoria: { type: Schema.Types.ObjectId, ref: "Categoria", required: true },

    // Relación con usuario (admin que lo creó)
    usuario: { type: Schema.Types.ObjectId, ref: "Usuario", required: true },

    //  Envío
    envio: {
      costo: { type: Number, default: 0, min: 0 },
      tiempo: { type: Number, default: 3, min: 0 }, 
      metodos: [
        {
          type: String,
          enum: ["Correo Argentino", "Andreani", "Retiro en tienda", "Otro"],
        },
      ],
    },

    //  Cuotas
    cuotas: [
      {
        cantidad: { type: Number, min: 1 },
        monto: { type: Number, min: 0 },
      },
    ],

    activo: { type: Boolean, default: true }, 
  },
  { timestamps: true }
);

//  Middleware para normalizar precio y calcular stock total en save()
ProductoSchema.pre("save", function (next) {
  if (Number.isFinite(this.precio)) {
    this.precio = Number(parseFloat(this.precio).toFixed(2));
  }

  if (Array.isArray(this.cuotas) && this.cuotas.length > 0) {
    this.cuotas = this.cuotas.map((c) => ({
      ...c,
      monto: Number.isFinite(c.monto) ? Number(parseFloat(c.monto).toFixed(2)) : 0,
    }));
  }

  if (this.envio && Number.isFinite(this.envio.costo)) {
    this.envio.costo = Number(parseFloat(this.envio.costo).toFixed(2));
  }

  if (Array.isArray(this.tallesUnidades) && this.tallesUnidades.length > 0) {
    this.stock = this.tallesUnidades.reduce((acc, t) => acc + (t.stock || 0), 0);
  } else {
    this.stock = 0;
  }

  next();
});

// Middleware para recalcular stock en findOneAndUpdate
ProductoSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();

  // Normalizar precio si viene en la actualización
  if (update.precio) {
    update.precio = Number(parseFloat(update.precio).toFixed(2));
  }

  // Normalizar cuotas si vienen
  if (update.cuotas && Array.isArray(update.cuotas)) {
    update.cuotas = update.cuotas.map((c) => ({
      ...c,
      monto: Number.isFinite(c.monto) ? Number(parseFloat(c.monto).toFixed(2)) : 0,
    }));
  }

  // Normalizar costo de envío
  if (update.envio && Number.isFinite(update.envio.costo)) {
    update.envio.costo = Number(parseFloat(update.envio.costo).toFixed(2));
  }

  // Recalcular stock si se actualizan tallesUnidades
  if (update.tallesUnidades && Array.isArray(update.tallesUnidades)) {
    update.stock = update.tallesUnidades.reduce((acc, t) => acc + (t.stock || 0), 0);
  }

  next();
});

module.exports = model("Producto", ProductoSchema);



