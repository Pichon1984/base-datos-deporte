const { Schema, model } = require('mongoose');

const CompraSchema = new Schema({
  clienteId: {
    type: Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  fecha: {
    type: Date,
    default: Date.now
  },
  total: {
    type: Number,
    required: true
  },
  items: [
    {
      productoId: {
        type: Schema.Types.ObjectId,
        ref: 'Producto',
        required: true
      },
      nombre: {
        type: String,
        required: true
      },
      cantidad: {
        type: Number,
        required: true
      },
      precioUnitario: {
        type: Number,
        required: true
      }
    }
  ]
}, {
  timestamps: true // agrega createdAt y updatedAt automáticamente
});

module.exports = model('Compra', CompraSchema);

