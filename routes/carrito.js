const { Router } = require("express");
const { validarJWT } = require("../middlewares/validar-jwt");
const Usuario = require("../models/usuario");

const router = Router();

// GET /api/carrito → obtener carrito del usuario logueado
router.get("/", validarJWT, async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.usuario._id).populate("carrito.productoId");
    if (!usuario) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }
    res.json(usuario.carrito || []);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al obtener carrito" });
  }
});

// POST /api/carrito → agregar producto al carrito
router.post("/", validarJWT, async (req, res) => {
  const { productoId, talle, cantidad } = req.body;
  try {
    if (!productoId || !talle || !cantidad || cantidad <= 0) {
      return res.status(400).json({ msg: "Datos inválidos" });
    }

    const usuario = await Usuario.findById(req.usuario._id);
    if (!usuario) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }

    // Buscar si ya existe ese producto+talle
    const idx = usuario.carrito.findIndex(
      i => i.productoId.toString() === productoId && i.talle === talle
    );

    if (idx >= 0) {
      usuario.carrito[idx].cantidad += cantidad;
    } else {
      usuario.carrito.push({ productoId, talle, cantidad });
    }

    await usuario.save();
    await usuario.populate("carrito.productoId");

    res.json(usuario.carrito);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al agregar producto" });
  }
});

// PUT /api/carrito/:productoId → actualizar cantidad
router.put("/:productoId", validarJWT, async (req, res) => {
  const { productoId } = req.params;
  const { talle, cantidad } = req.body;
  try {
    if (!talle || cantidad == null) {
      return res.status(400).json({ msg: "Datos inválidos" });
    }

    const usuario = await Usuario.findById(req.usuario._id);
    if (!usuario) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }

    const idx = usuario.carrito.findIndex(
      i => i.productoId.toString() === productoId && i.talle === talle
    );

    if (idx < 0) {
      return res.status(404).json({ msg: "Producto no encontrado en el carrito" });
    }

    usuario.carrito[idx].cantidad = cantidad;
    if (usuario.carrito[idx].cantidad <= 0) {
      usuario.carrito.splice(idx, 1);
    }

    await usuario.save();
    await usuario.populate("carrito.productoId");

    res.json(usuario.carrito);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al actualizar producto" });
  }
});

// DELETE /api/carrito/:productoId → eliminar producto
router.delete("/:productoId", validarJWT, async (req, res) => {
  const { productoId } = req.params;
  const { talle } = req.query;
  try {
    if (!talle) {
      return res.status(400).json({ msg: "Debe especificar el talle" });
    }

    const usuario = await Usuario.findById(req.usuario._id);
    if (!usuario) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }

    const beforeLength = usuario.carrito.length;
    usuario.carrito = usuario.carrito.filter(
      i => !(i.productoId.toString() === productoId && i.talle === talle)
    );

    if (usuario.carrito.length === beforeLength) {
      return res.status(404).json({ msg: "Producto no encontrado en el carrito" });
    }

    await usuario.save();
    await usuario.populate("carrito.productoId");

    res.json(usuario.carrito);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al eliminar producto" });
  }
});

// DELETE /api/carrito → vaciar carrito
router.delete("/", validarJWT, async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.usuario._id);
    if (!usuario) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }

    usuario.carrito = [];
    await usuario.save();

    res.json([]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al vaciar carrito" });
  }
});

module.exports = router;

