const Carrito = require('../models/Carrito');

// Obtener carrito del usuario
exports.obtenerCarrito = async (req, res) => {
  const usuarioId = req.usuario._id; // viene del validarJWT
  const carrito = await Carrito.findOne({ usuarioId }).lean();
  res.json(carrito ? carrito.items : []);
};

// Agregar item al carrito
exports.agregarItem = async (req, res) => {
  const usuarioId = req.usuario._id;
  const { productoId, talle, cantidad } = req.body;

  if (!productoId || cantidad < 1) {
    return res.status(400).json({ error: 'Datos inválidos' });
  }

  const carrito = await Carrito.findOneAndUpdate(
    { usuarioId },
    { $setOnInsert: { usuarioId, items: [] } },
    { upsert: true, new: true }
  );

  const idx = carrito.items.findIndex(
    i => String(i.productoId) === String(productoId) && (i.talle || '') === (talle || '')
  );

  if (idx >= 0) {
    carrito.items[idx].cantidad += cantidad;
  } else {
    carrito.items.push({ productoId, talle, cantidad });
  }

  await carrito.save();
  res.status(201).json(carrito.items);
};

// Actualizar cantidad de un item
exports.actualizarItem = async (req, res) => {
  const usuarioId = req.usuario._id;
  const { productoId } = req.params;
  const { talle, cantidad } = req.body;

  const carrito = await Carrito.findOne({ usuarioId });
  if (!carrito) return res.json([]);

  const idx = carrito.items.findIndex(
    i => String(i.productoId) === String(productoId) && (i.talle || '') === (talle || '')
  );

  if (idx < 0) return res.status(404).json({ error: 'Item no encontrado' });

  carrito.items[idx].cantidad = cantidad;
  await carrito.save();
  res.json(carrito.items);
};

// Eliminar item del carrito
exports.eliminarItem = async (req, res) => {
  const usuarioId = req.usuario._id;
  const { productoId } = req.params;
  const { talle } = req.query;

  const carrito = await Carrito.findOne({ usuarioId });
  if (!carrito) return res.json([]);

  carrito.items = carrito.items.filter(
    i => !(String(i.productoId) === String(productoId) && (i.talle || '') === (talle || ''))
  );

  await carrito.save();
  res.json(carrito.items);
};

// Vaciar carrito completo
exports.vaciarCarrito = async (req, res) => {
  const usuarioId = req.usuario._id;
  const carrito = await Carrito.findOne({ usuarioId });
  if (!carrito) return res.json([]);

  carrito.items = [];
  await carrito.save();
  res.json(carrito.items);
};

// Merge carrito anónimo con el del usuario
exports.mergeCarrito = async (req, res) => {
  const usuarioId = req.usuario._id;
  const { items = [] } = req.body;

  const validItems = Array.isArray(items)
    ? items.filter(i => i && i.productoId && Number(i.cantidad) > 0)
    : [];

  const carrito = await Carrito.findOneAndUpdate(
    { usuarioId },
    { $setOnInsert: { usuarioId, items: [] } },
    { upsert: true, new: true }
  );

  const map = new Map();

  // Items ya en backend
  carrito.items.forEach(i => {
    const k = `${String(i.productoId)}:${i.talle || ''}`;
    map.set(k, { ...i.toObject?.() ?? i });
  });

  // Items locales a mergear
  validItems.forEach(i => {
    const k = `${String(i.productoId)}:${i.talle || ''}`;
    if (map.has(k)) {
      const curr = map.get(k);
      map.set(k, { ...curr, cantidad: curr.cantidad + Number(i.cantidad) });
    } else {
      map.set(k, { productoId: i.productoId, talle: i.talle ?? null, cantidad: Number(i.cantidad) });
    }
  });

  carrito.items = Array.from(map.values());
  await carrito.save();

  res.status(200).json(carrito.items);
};

