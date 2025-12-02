const mongoose = require('mongoose');
const { Schema } = mongoose;


const UsuarioSchema = Schema({
    nombre: { type: String, required: [true, 'el nombre es obligatorio'] },
    apellido: { type: String, required: [true, 'el apellido es obligatorio'] },
    correo: { type: String, required: [true, 'el correo es obligatorio'], unique: true },
    password: { type: String, required: [true, 'la contraseña es obligatoria'] },
    rol: {
        type: String,
        required: true,
        uppercase: true, 
        trim: true,
    },


    fechaRegistro: { type: Date, default: Date.now },
    estado: { type: Boolean, default: true }
});

module.exports = mongoose.model('Usuario', UsuarioSchema)