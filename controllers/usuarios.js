const Usuario = require("../models/usuario");
const bcrypt = require("bcryptjs");
const { generarJWT } = require('../helpers/generar-jwt');

// 🔍 GET todos los usuarios
const usuariosGet = async (req, res) => {
  const { search = "", page = 1, limit = 10 } = req.query;

  const filtro = search
    ? {
        $or: [
          { nombre: { $regex: search, $options: "i" } },
          { apellido: { $regex: search, $options: "i" } },
          { correo: { $regex: search, $options: "i" } }
        ]
      }
    : {};

  const skip = (Number(page) - 1) * Number(limit);

  const [usuarios, total] = await Promise.all([
    Usuario.find(filtro).skip(skip).limit(Number(limit)),
    Usuario.countDocuments(filtro)
  ]);

  res.json({ total, usuarios });
};

// 🔍 GET usuario por ID
const usuariosGetId = async (req, res) => {
  const { id } = req.params;
  const usuario = await Usuario.findById(id);
  if (!usuario) return res.status(404).json({ msg: "Usuario no encontrado" });
  res.json(usuario.toJSON());
};

// ➕ POST crear usuario
const usuariosPost = async (req, res) => {
  const { nombre, apellido, correo, password, rol } = req.body;
  try {
    const existe = await Usuario.findOne({ correo });
    if (existe) return res.status(400).json({ msg: "El correo ya está registrado" });

    const usuario = new Usuario({ nombre, apellido, correo, password, rol });

    // encriptar contraseña
    const salt = bcrypt.genSaltSync();
    usuario.password = bcrypt.hashSync(password, salt);

    await usuario.save();

    // generar JWT
    const token = await generarJWT(usuario.id);

    res.status(201).json({
      usuario: usuario.toJSON(),
      token
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ msg: "Error al crear usuario" });
  }
};

// ✏️ PUT actualizar usuario por ID
const usuarioPut = async (req, res) => {
  const { id } = req.params;
  const { nombre, apellido, telefono, direccion, provincia, localidad, codigoPostal, dni } = req.body;
  try {
    const usuario = await Usuario.findById(id);
    if (!usuario) return res.status(404).json({ msg: "Usuario no encontrado" });

    if (nombre !== undefined) usuario.nombre = nombre;
    if (apellido !== undefined) usuario.apellido = apellido;
    if (telefono !== undefined) usuario.telefono = telefono;
    if (direccion !== undefined) usuario.direccion = direccion;
    if (provincia !== undefined) usuario.provincia = provincia;
    if (localidad !== undefined) usuario.localidad = localidad;
    if (codigoPostal !== undefined) usuario.codigoPostal = codigoPostal;
    if (dni !== undefined) usuario.dni = dni;

    await usuario.save();

    res.json(usuario.toJSON());
  } catch (e) {
    console.error(e);
    res.status(500).json({ msg: "Error al actualizar usuario" });
  }
};

// 🗑️ DELETE lógico
const usuarioDelete = async (req, res) => {
  const { id } = req.params;
  const usuario = await Usuario.findByIdAndUpdate(id, { estado: false }, { new: true });
  res.json(usuario.toJSON());
};

// 👤 GET perfil propio
const me = async (req, res) => {
  const usuario = await Usuario.findById(req.usuario._id);
  if (!usuario) return res.status(404).json({ msg: "Usuario no encontrado" });
  res.json(usuario.toJSON());
};

// 📍 POST guardar ubicación del usuario logueado
const guardarUbicacion = async (req, res) => {
  try {
    const { ciudad, provincia, pais, lat, lon } = req.body;
    const usuarioId = req.usuario._id;

    const usuario = await Usuario.findById(usuarioId);
    if (!usuario) return res.status(404).json({ msg: "Usuario no encontrado" });

    usuario.ubicacion = {
      ciudad,
      provincia,
      pais,
      lat,
      lon,
      updatedAt: new Date()
    };

    await usuario.save();

    res.json({
      ok: true,
      message: "Ubicación guardada correctamente",
      ubicacion: usuario.ubicacion
    });
  } catch (error) {
    console.error("Error al guardar ubicación:", error);
    res.status(500).json({ ok: false, msg: "Error al guardar ubicación" });
  }
};

module.exports = {
  usuariosGet,
  usuariosGetId,
  usuariosPost,
  usuarioPut,
  usuarioDelete,
  me,
  guardarUbicacion
};

