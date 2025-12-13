const { Schema, model } = require("mongoose");

const CompraSchema = new Schema({
  cliente: { type: Schema.Types.ObjectId, ref: "Usuario", required: true },
  productos: [
    {
      productoId: { type: Schema.Types.ObjectId, ref: "Producto", required: true },
      cantidad: { type: Number, required: true },
      precio: { type: Number, required: true }
    }
  ],
  total: { type: Number, required: true },
  fecha: { type: Date, default: Date.now }
});

module.exports = model("Compra", CompraSchema);


