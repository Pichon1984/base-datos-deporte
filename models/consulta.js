const { Schema, model } = require("mongoose");

const consultaSchema = new Schema({
  productoId: { type: Schema.Types.ObjectId, ref: "Producto", required: true },
  usuarioId: { type: Schema.Types.ObjectId, ref: "Usuario", required: true },
  mensaje: { type: String, required: true },
  fecha: { type: Date, default: Date.now },
  respondida: { type: Boolean, default: false },
  respuesta: { type: String } // nueva propiedad
});

module.exports = model("Consulta", consultaSchema);






