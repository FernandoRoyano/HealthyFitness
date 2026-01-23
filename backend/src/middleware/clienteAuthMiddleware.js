import jwt from 'jsonwebtoken';
import Cliente from '../models/Cliente.js';

// Middleware para proteger rutas de cliente
export const protegerCliente = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Verificar que sea un token de tipo cliente
      if (decoded.tipo !== 'cliente') {
        return res.status(401).json({ mensaje: 'No autorizado, token no válido para cliente' });
      }

      const cliente = await Cliente.findById(decoded.id).select('-portalPassword -tokenRecuperacion -tokenExpiracion');

      if (!cliente) {
        return res.status(401).json({ mensaje: 'Cliente no encontrado' });
      }

      // Verificar que el portal esté activo
      if (!cliente.portalActivo) {
        return res.status(401).json({ mensaje: 'El acceso al portal ha sido desactivado' });
      }

      req.cliente = cliente;
      return next();
    } catch (error) {
      return res.status(401).json({ mensaje: 'No autorizado, token inválido' });
    }
  }

  if (!token) {
    return res.status(401).json({ mensaje: 'No autorizado, no hay token' });
  }
};
