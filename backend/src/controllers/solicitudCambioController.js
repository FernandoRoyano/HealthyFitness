import SolicitudCambio from '../models/SolicitudCambio.js';
import Reserva from '../models/Reserva.js';

// Crear solicitud de cambio (Entrenador)
export const crearSolicitudCambio = async (req, res) => {
  try {
    const { reservaId, datosPropuestos, motivoCambio } = req.body;

    // Verificar que la reserva existe
    const reserva = await Reserva.findById(reservaId)
      .populate('cliente', 'nombre apellido')
      .populate('entrenador', 'nombre');

    if (!reserva) {
      return res.status(404).json({ mensaje: 'Reserva no encontrada' });
    }

    // Verificar que el entrenador es el propietario de la reserva
    const entrenadorId = req.usuario._id.toString();
    const reservaEntrenadorId = reserva.entrenador._id.toString();

    if (entrenadorId !== reservaEntrenadorId) {
      return res.status(403).json({
        mensaje: 'No tienes permisos para modificar esta reserva'
      });
    }

    // Verificar si ya existe una solicitud pendiente para esta reserva
    const solicitudExistente = await SolicitudCambio.findOne({
      reservaOriginal: reservaId,
      estado: 'pendiente'
    });

    if (solicitudExistente) {
      return res.status(400).json({
        mensaje: 'Ya existe una solicitud de cambio pendiente para esta reserva'
      });
    }

    // Verificar conflictos de horario con el nuevo horario propuesto
    const { fecha, horaInicio, horaFin } = datosPropuestos;
    const conflicto = await Reserva.findOne({
      _id: { $ne: reservaId },
      fecha: new Date(fecha),
      entrenador: req.usuario._id,
      $or: [
        { horaInicio: { $lte: horaInicio }, horaFin: { $gt: horaInicio } },
        { horaInicio: { $lt: horaFin }, horaFin: { $gte: horaFin } },
        { horaInicio: { $gte: horaInicio }, horaFin: { $lte: horaFin } }
      ],
      estado: { $ne: 'cancelada' }
    });

    if (conflicto) {
      return res.status(400).json({
        mensaje: 'El nuevo horario propuesto tiene conflicto con otra reserva confirmada'
      });
    }

    // Crear solicitud de cambio
    const solicitudCambio = await SolicitudCambio.create({
      reservaOriginal: reservaId,
      entrenador: req.usuario._id,
      cliente: reserva.cliente._id,
      datosOriginales: {
        fecha: reserva.fecha,
        horaInicio: reserva.horaInicio,
        horaFin: reserva.horaFin,
        tipoSesion: reserva.tipoSesion,
        duracion: reserva.duracion,
        notas: reserva.notas
      },
      datosPropuestos,
      motivoCambio,
      estado: 'pendiente'
    });

    const solicitudCompleta = await SolicitudCambio.findById(solicitudCambio._id)
      .populate('reservaOriginal')
      .populate('entrenador', 'nombre email')
      .populate('cliente', 'nombre apellido email');

    res.status(201).json(solicitudCompleta);
  } catch (error) {
    res.status(400).json({
      mensaje: 'Error al crear solicitud de cambio',
      error: error.message
    });
  }
};

// Obtener todas las solicitudes (filtradas por rol)
export const obtenerSolicitudes = async (req, res) => {
  try {
    const { estado } = req.query;
    let filtro = {};

    // Si es entrenador, solo ve sus propias solicitudes
    if (req.usuario.rol === 'entrenador') {
      filtro.entrenador = req.usuario._id;
    }

    // Filtro por estado si se proporciona
    if (estado) {
      filtro.estado = estado;
    }

    const solicitudes = await SolicitudCambio.find(filtro)
      .populate('reservaOriginal')
      .populate('entrenador', 'nombre email')
      .populate('cliente', 'nombre apellido email')
      .populate('revisadoPor', 'nombre email')
      .sort({ createdAt: -1 });

    res.json(solicitudes);
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al obtener solicitudes',
      error: error.message
    });
  }
};

// Obtener una solicitud por ID
export const obtenerSolicitudPorId = async (req, res) => {
  try {
    const solicitud = await SolicitudCambio.findById(req.params.id)
      .populate('reservaOriginal')
      .populate('entrenador', 'nombre email')
      .populate('cliente', 'nombre apellido email')
      .populate('revisadoPor', 'nombre email');

    if (!solicitud) {
      return res.status(404).json({ mensaje: 'Solicitud no encontrada' });
    }

    // Verificar permisos
    const esGerente = req.usuario.rol === 'gerente';
    const esEntrenadorPropietario = solicitud.entrenador._id.toString() === req.usuario._id.toString();

    if (!esGerente && !esEntrenadorPropietario) {
      return res.status(403).json({
        mensaje: 'No tienes permisos para ver esta solicitud'
      });
    }

    res.json(solicitud);
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al obtener solicitud',
      error: error.message
    });
  }
};

// Aprobar solicitud de cambio (Solo Gerente)
export const aprobarSolicitud = async (req, res) => {
  try {
    if (req.usuario.rol !== 'gerente') {
      return res.status(403).json({
        mensaje: 'Solo el gerente puede aprobar solicitudes'
      });
    }

    const solicitud = await SolicitudCambio.findById(req.params.id)
      .populate('reservaOriginal')
      .populate('cliente', 'nombre apellido')
      .populate('entrenador', 'nombre');

    if (!solicitud) {
      return res.status(404).json({ mensaje: 'Solicitud no encontrada' });
    }

    if (solicitud.estado !== 'pendiente') {
      return res.status(400).json({
        mensaje: `Esta solicitud ya fue ${solicitud.estado}`
      });
    }

    // Verificar nuevamente conflictos antes de aprobar
    const { fecha, horaInicio, horaFin } = solicitud.datosPropuestos;
    const conflicto = await Reserva.findOne({
      _id: { $ne: solicitud.reservaOriginal._id },
      fecha: new Date(fecha),
      entrenador: solicitud.entrenador._id,
      $or: [
        { horaInicio: { $lte: horaInicio }, horaFin: { $gt: horaInicio } },
        { horaInicio: { $lt: horaFin }, horaFin: { $gte: horaFin } },
        { horaInicio: { $gte: horaInicio }, horaFin: { $lte: horaFin } }
      ],
      estado: { $ne: 'cancelada' }
    });

    if (conflicto) {
      return res.status(400).json({
        mensaje: 'El horario propuesto ahora tiene conflicto con otra reserva'
      });
    }

    // Actualizar la reserva original con los nuevos datos
    await Reserva.findByIdAndUpdate(
      solicitud.reservaOriginal._id,
      {
        fecha: solicitud.datosPropuestos.fecha,
        horaInicio: solicitud.datosPropuestos.horaInicio,
        horaFin: solicitud.datosPropuestos.horaFin,
        tipoSesion: solicitud.datosPropuestos.tipoSesion,
        duracion: solicitud.datosPropuestos.duracion,
        notas: solicitud.datosPropuestos.notas
      }
    );

    // Actualizar el estado de la solicitud
    solicitud.estado = 'aprobado';
    solicitud.revisadoPor = req.usuario._id;
    solicitud.fechaRevision = new Date();
    await solicitud.save();

    const solicitudActualizada = await SolicitudCambio.findById(solicitud._id)
      .populate('reservaOriginal')
      .populate('entrenador', 'nombre email')
      .populate('cliente', 'nombre apellido email')
      .populate('revisadoPor', 'nombre email');

    res.json({
      mensaje: 'Solicitud aprobada y reserva actualizada',
      solicitud: solicitudActualizada
    });
  } catch (error) {
    res.status(400).json({
      mensaje: 'Error al aprobar solicitud',
      error: error.message
    });
  }
};

// Rechazar solicitud de cambio (Solo Gerente)
export const rechazarSolicitud = async (req, res) => {
  try {
    if (req.usuario.rol !== 'gerente') {
      return res.status(403).json({
        mensaje: 'Solo el gerente puede rechazar solicitudes'
      });
    }

    const { motivoRechazo } = req.body;
    const solicitud = await SolicitudCambio.findById(req.params.id);

    if (!solicitud) {
      return res.status(404).json({ mensaje: 'Solicitud no encontrada' });
    }

    if (solicitud.estado !== 'pendiente') {
      return res.status(400).json({
        mensaje: `Esta solicitud ya fue ${solicitud.estado}`
      });
    }

    // Actualizar el estado de la solicitud
    solicitud.estado = 'rechazado';
    solicitud.revisadoPor = req.usuario._id;
    solicitud.fechaRevision = new Date();
    solicitud.motivoRechazo = motivoRechazo || 'Sin motivo especificado';
    await solicitud.save();

    const solicitudActualizada = await SolicitudCambio.findById(solicitud._id)
      .populate('reservaOriginal')
      .populate('entrenador', 'nombre email')
      .populate('cliente', 'nombre apellido email')
      .populate('revisadoPor', 'nombre email');

    res.json({
      mensaje: 'Solicitud rechazada',
      solicitud: solicitudActualizada
    });
  } catch (error) {
    res.status(400).json({
      mensaje: 'Error al rechazar solicitud',
      error: error.message
    });
  }
};

// Cancelar solicitud (Entrenador que la creó)
export const cancelarSolicitud = async (req, res) => {
  try {
    const solicitud = await SolicitudCambio.findById(req.params.id);

    if (!solicitud) {
      return res.status(404).json({ mensaje: 'Solicitud no encontrada' });
    }

    // Verificar que es el entrenador que creó la solicitud
    if (solicitud.entrenador.toString() !== req.usuario._id.toString()) {
      return res.status(403).json({
        mensaje: 'No tienes permisos para cancelar esta solicitud'
      });
    }

    if (solicitud.estado !== 'pendiente') {
      return res.status(400).json({
        mensaje: 'Solo se pueden cancelar solicitudes pendientes'
      });
    }

    // Eliminar la solicitud
    await SolicitudCambio.findByIdAndDelete(req.params.id);

    res.json({ mensaje: 'Solicitud cancelada correctamente' });
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al cancelar solicitud',
      error: error.message
    });
  }
};

// Obtener contador de solicitudes pendientes (para notificaciones)
export const contarSolicitudesPendientes = async (req, res) => {
  try {
    const count = await SolicitudCambio.countDocuments({ estado: 'pendiente' });
    res.json({ count });
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al contar solicitudes',
      error: error.message
    });
  }
};
