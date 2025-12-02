const { request, response } = require('express');
const bcrypt = require('bcryptjs');
const Usuario = require('../models/usuario');

// GET usuarios con paginación
const usuariosGet = async (req = request, res = response) => {
  try {
    const { desde = 0, limite = 5 } = req.query;
    const query = { estado: true };

    const [total, usuarios] = await Promise.all([
      Usuario.countDocuments(query),
      Usuario.find(query).skip(Number(desde)).limit(Number(limite))
    ]);

    res.json({
      mensaje: 'Usuarios obtenidos',
      total,
      usuarios
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error al obtener usuarios' });
  }
};

// GET usuario por ID
const usuariosGetId = async (req = request, res = response) => {
  try {
    const { id } = req.params;
    const usuario = await Usuario.findById(id);

    if (!usuario) {
      return res.status(404).json({ msg: 'Usuario no encontrado' });
    }

    res.json({
      mensaje: 'Usuario obtenido',
      usuario
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error al obtener usuario' });
  }
};

// POST crear usuario
const usuariosPost = async (req = request, res = response) => {
  try {
    req.body.rol = req.body.rol?.toUpperCase();

    const { nombre, apellido, correo, password, rol } = req.body;
    const usuario = new Usuario({ nombre, apellido, correo, password, rol });

    // Encriptar contraseña
    const salt = bcrypt.genSaltSync(10);
    usuario.password = bcrypt.hashSync(password, salt);

    await usuario.save();

    res.json({
      mensaje: 'Usuario cargado correctamente',
      usuario
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error al crear usuario' });
  }
};

// PUT actualizar usuario
const usuarioPut = async (req = request, res = response) => {
  try {
    const { id } = req.params;
    const { password, correo, ...resto } = req.body;

    if (password) {
      const salt = bcrypt.genSaltSync(10);
      resto.password = bcrypt.hashSync(password, salt);
    }

    if (correo) {
      resto.correo = correo;
    }

    const usuario = await Usuario.findByIdAndUpdate(id, resto, { new: true });

    if (!usuario) {
      return res.status(404).json({ msg: 'Usuario no encontrado' });
    }

    res.json({
      mensaje: 'Usuario actualizado correctamente',
      usuario
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error al actualizar usuario' });
  }
};

// DELETE lógico (inhabilitar usuario)
const usuarioDelete = async (req = request, res = response) => {
  try {
    const { id } = req.params;
    const usuario = await Usuario.findById(id);

    if (!usuario) {
      return res.status(404).json({ msg: 'Usuario no encontrado' });
    }

    if (!usuario.estado) {
      return res.status(400).json({ msg: 'Usuario ya está inhabilitado' });
    }

    const usuarioInhabilitado = await Usuario.findByIdAndUpdate(
      id,
      { estado: false },
      { new: true }
    );

    res.json({
      mensaje: 'Usuario inhabilitado exitosamente',
      usuarioInhabilitado
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error al eliminar usuario' });
  }
};

module.exports = {
  usuariosGet,
  usuariosGetId,
  usuariosPost,
  usuarioPut,
  usuarioDelete,
};

