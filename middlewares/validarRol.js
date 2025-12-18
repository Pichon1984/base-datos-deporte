const validarRol = (rolesPermitidos = []) => {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({ error: 'Token debe validarse antes de verificar rol' });
    }

    const rolUsuario = req.usuario.rol; // 👈 usamos el rol tal cual viene del token/BD

    if (!rolesPermitidos.includes(rolUsuario)) {
      return res.status(403).json({
        error: `Acceso denegado. Rol requerido: ${rolesPermitidos.join(', ')}`,
        rolUsuario
      });
    }

    next();
  };
};

module.exports = { validarRol };

















