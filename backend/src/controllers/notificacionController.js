import Notificacion from '../models/Notificacion.js';
import User from '../models/User.js';

// Obtener notificaciones del usuario
export const obtenerNotificaciones = async (req, res) => {
  try {
    const { leida, limite = 50 } = req.query;
    const filtro = { usuario: req.usuario.id };

    if (leida !== undefined) {
      filtro.leida = leida === 'true';
    }

    const notificaciones = await Notificacion.find(filtro)
      .sort({ createdAt: -1 })
      .limit(parseInt(limite));

    res.json(notificaciones);
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    res.status(500).json({ mensaje: 'Error al obtener notificaciones' });
  }
};

// Contar notificaciones no leídas
export const contarNoLeidas = async (req, res) => {
  try {
    const count = await Notificacion.countDocuments({
      usuario: req.usuario.id,
      leida: false
    });

    res.json({ count });
  } catch (error) {
    console.error('Error al contar notificaciones:', error);
    res.status(500).json({ mensaje: 'Error al contar notificaciones' });
  }
};

// Marcar notificación como leída
export const marcarComoLeida = async (req, res) => {
  try {
    const notificacion = await Notificacion.findOneAndUpdate(
      { _id: req.params.id, usuario: req.usuario.id },
      { leida: true },
      { new: true }
    );

    if (!notificacion) {
      return res.status(404).json({ mensaje: 'Notificación no encontrada' });
    }

    res.json(notificacion);
  } catch (error) {
    console.error('Error al marcar notificación:', error);
    res.status(500).json({ mensaje: 'Error al actualizar notificación' });
  }
};

// Marcar todas como leídas
export const marcarTodasComoLeidas = async (req, res) => {
  try {
    await Notificacion.updateMany(
      { usuario: req.usuario.id, leida: false },
      { leida: true }
    );

    res.json({ mensaje: 'Todas las notificaciones marcadas como leídas' });
  } catch (error) {
    console.error('Error al marcar notificaciones:', error);
    res.status(500).json({ mensaje: 'Error al actualizar notificaciones' });
  }
};

// Eliminar notificación
export const eliminarNotificacion = async (req, res) => {
  try {
    const notificacion = await Notificacion.findOneAndDelete({
      _id: req.params.id,
      usuario: req.usuario.id
    });

    if (!notificacion) {
      return res.status(404).json({ mensaje: 'Notificación no encontrada' });
    }

    res.json({ mensaje: 'Notificación eliminada' });
  } catch (error) {
    console.error('Error al eliminar notificación:', error);
    res.status(500).json({ mensaje: 'Error al eliminar notificación' });
  }
};

// Función auxiliar para crear notificación (usada por otros controladores)
export const crearNotificacion = async (usuario, tipo, titulo, mensaje, relacionadoA) => {
  try {
    const notificacion = new Notificacion({
      usuario,
      tipo,
      titulo,
      mensaje,
      relacionadoA
    });

    await notificacion.save();
    return notificacion;
  } catch (error) {
    console.error('Error al crear notificación:', error);
    throw error;
  }
};

// Notificar a todos los gerentes
export const notificarGerentes = async (tipo, titulo, mensaje, relacionadoA) => {
  try {
    const gerentes = await User.find({ rol: 'gerente' });

    const notificaciones = gerentes.map(gerente => ({
      usuario: gerente._id,
      tipo,
      titulo,
      mensaje,
      relacionadoA
    }));

    await Notificacion.insertMany(notificaciones);
  } catch (error) {
    console.error('Error al notificar gerentes:', error);
    throw error;
  }
};
