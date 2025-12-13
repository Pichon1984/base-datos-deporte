const validarRol = (rolesPermitidos = []) => {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(500).json({ msg: 'Se quiere verificar el rol sin validar el token primero' });
    }
    if (!rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({ msg: `Acceso denegado. Rol requerido: ${rolesPermitidos.join(', ')}` });
    }
    next();
  };
};

module.exports = { validarRol };











