const { Schema, model } = require('mongoose');

const ProductoSchema = new Schema({
    nombre: { type: String, required: [true, 'el nombre es obligatorio'], unique: true },
    estado: { type: Boolean, required: true, default: true },
    precio: { type: Number, default: 0 },
    descripcion: { type: String },
    img: { type: String },
    destacado: { type: Boolean, default: false },
    stock: { type: Number, default: 0 },
    fechaRegistro: { type: Date, default: Date.now },
    usuario: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
    categoria: { type: Schema.Types.ObjectId, ref: 'categoria', required: true }
});

module.exports = model('Producto', ProductoSchema);

