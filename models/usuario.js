const { Schema, model } = require('mongoose');

const UsuarioSchema = new Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre es obligatorio']
  },
  apellido: {
    type: String,
    required: [true, 'El apellido es obligatorio']
  },
  correo: {
    type: String,
    required: [true, 'El correo es obligatorio'],
    unique: true
  },
  password: {
    type: String,
    required: [true, 'La contraseña es obligatoria']
  },
  rol: {
    type: String,
    enum: ['ADMIN', 'CLIENTE'],
    default: 'CLIENTE'
  },
  telefono: {
    type: String,
    default: ''
  },
  direccion: {
    type: String,
    default: ''
  },
  estado: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true // agrega createdAt y updatedAt automáticamente
});

// Método para ocultar password en las respuestas JSON
UsuarioSchema.methods.toJSON = function () {
  const { __v, password, ...usuario } = this.toObject();
  return usuario;
};

module.exports = model('Usuario', UsuarioSchema);

