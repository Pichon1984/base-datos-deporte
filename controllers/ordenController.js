const Carrito = require('../models/Carrito');
const Orden = require('../models/Orden');

exports.crearOrdenDesdeCarrito = async (req, res) => {
  try {
    const usuarioId = req.usuario.id; 
    const carrito = await Carrito.findOne({ usuarioId, estado: 'activo' }).populate('items.productoId');

    if (!carrito || carrito.items.length === 0) {
      return res.status(400).json({ error: 'Carrito vacío' });
    }

    // snapshot de productos
    const productos = carrito.items.map(item => ({
      productoId: item.productoId._id,
      nombre: item.productoId.nombre,
      precio: item.productoId.precio,
      cantidad: item.cantidad,
      talle: item.talle
    }));

    const subtotal = productos.reduce((acc, p) => acc + p.precio * p.cantidad, 0);
    const costoEnvio = req.body.costoEnvio || 0;
    const totalFinal = subtotal + costoEnvio;

    const orden = new Orden({
      usuario: usuarioId,
      productos,
      envio: req.body.envio, 
      costoEnvio,
      total: subtotal,
      totalFinal
    });

    await orden.save();

    // cerrar carrito
    carrito.estado = 'cerrado';
    await carrito.save();

    res.json({ orden });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error creando orden' });
  }
};
