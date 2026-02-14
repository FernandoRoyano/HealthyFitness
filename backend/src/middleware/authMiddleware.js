import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const proteger = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Rechazar tokens de cliente (tipo: 'cliente') en rutas de usuario
      if (decoded.tipo === 'cliente') {
        return res.status(401).json({ mensaje: 'No autorizado, token de cliente no válido para esta ruta' });
      }

      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return res.status(401).json({ mensaje: 'No autorizado, usuario no encontrado' });
      }

      req.user = user;
      req.usuario = user;
      return next();
    } catch (error) {
      return res.status(401).json({ mensaje: 'No autorizado, token inválido' });
    }
  }

  if (!token) {
    return res.status(401).json({ mensaje: 'No autorizado, no hay token' });
  }
};

export const esGerente = (req, res, next) => {
  if (req.user && req.user.rol === 'gerente') {
    next();
  } else {
    res.status(403).json({ mensaje: 'Acceso denegado, se requiere rol de gerente' });
  }
};
