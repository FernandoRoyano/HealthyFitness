import Vacacion from '../models/Vacacion.js';
import User from '../models/User.js';
import { crearNotificacion, notificarGerentes } from './notificacionController.js';
import { verificarVacacionesEnFecha } from '../utils/vacacionHelper.js';

// Constantes de configuración
const DIAS_TOTALES_ANUALES = 23;
const DIAS_ESTIVALES_MINIMOS = 15;
const DIAS_NO_ESTIVALES_MAXIMOS = 8;

// ============================================
// FUNCIONES AUXILIARES
// ============================================

// Obtener resumen de días de vacaciones de un entrenador para un año
const obtenerResumenVacaciones = async (entrenadorId, año) => {
  const vacacionesAprobadas = await Vacacion.find({
    entrenador: entrenadorId,
    año: año,
    estado: 'aprobado'
  });

  let diasEstivalesUsados = 0;
  let diasNoEstivalesUsados = 0;

  vacacionesAprobadas.forEach(v => {
    if (v.tipoPeriodo === 'estival') {
      diasEstivalesUsados += v.diasLaborables;
    } else {
      diasNoEstivalesUsados += v.diasLaborables;
    }
  });

  const diasTotalesUsados = diasEstivalesUsados + diasNoEstivalesUsados;

  return {
    diasTotales: DIAS_TOTALES_ANUALES,
    diasUsados: diasTotalesUsados,
    diasPendientes: DIAS_TOTALES_ANUALES - diasTotalesUsados,
    estival: {
      minimo: DIAS_ESTIVALES_MINIMOS,
      usados: diasEstivalesUsados,
      pendientes: Math.max(0, DIAS_ESTIVALES_MINIMOS - diasEstivalesUsados)
    },
    noEstival: {
      maximo: DIAS_NO_ESTIVALES_MAXIMOS,
      usados: diasNoEstivalesUsados,
      disponibles: Math.max(0, DIAS_NO_ESTIVALES_MAXIMOS - diasNoEstivalesUsados)
    }
  };
};

// ============================================
// ENDPOINTS PÚBLICOS (usuarios autenticados)
// ============================================

// Crear solicitud de vacaciones (Entrenador o Gerente)
export const crearSolicitudVacaciones = async (req, res) => {
  try {
    const { fechaInicio, fechaFin, motivo, entrenadorId } = req.body;
    const esGerente = req.usuario.rol === 'gerente';

    // Determinar para quién es la solicitud
    let targetEntrenadorId = req.usuario._id;

    if (esGerente && entrenadorId) {
      // El gerente puede crear vacaciones para cualquier entrenador
      targetEntrenadorId = entrenadorId;
    }

    const año = new Date(fechaInicio).getFullYear();

    // Calcular días laborables
    const diasLaborables = Vacacion.calcularDiasLaborables(fechaInicio, fechaFin);

    if (diasLaborables <= 0) {
      return res.status(400).json({
        mensaje: 'El período seleccionado no contiene días laborables'
      });
    }

    // Determinar tipo de período
    const tipoPeriodo = Vacacion.determinarTipoPeriodo(fechaInicio, fechaFin);

    // Obtener resumen actual
    const resumen = await obtenerResumenVacaciones(targetEntrenadorId, año);

    // Validar disponibilidad de días
    if (resumen.diasUsados + diasLaborables > DIAS_TOTALES_ANUALES) {
      return res.status(400).json({
        mensaje: `No hay suficientes días disponibles. Quedan ${resumen.diasPendientes} días pendientes.`
      });
    }

    // Validar límites según tipo de período
    if (tipoPeriodo === 'no_estival') {
      if (resumen.noEstival.usados + diasLaborables > DIAS_NO_ESTIVALES_MAXIMOS) {
        return res.status(400).json({
          mensaje: `Excede el máximo de ${DIAS_NO_ESTIVALES_MAXIMOS} días fuera del período estival. Disponibles: ${resumen.noEstival.disponibles}`
        });
      }
    }

    // Verificar solapamiento con otras vacaciones aprobadas o pendientes
    const solapamiento = await Vacacion.findOne({
      entrenador: targetEntrenadorId,
      estado: { $in: ['aprobado', 'pendiente'] },
      $or: [
        { fechaInicio: { $lte: new Date(fechaFin) }, fechaFin: { $gte: new Date(fechaInicio) } }
      ]
    });

    if (solapamiento) {
      return res.status(400).json({
        mensaje: 'Ya existe una solicitud de vacaciones que se solapa con estas fechas'
      });
    }

    // Crear la solicitud
    const vacacion = await Vacacion.create({
      entrenador: targetEntrenadorId,
      fechaInicio,
      fechaFin,
      diasLaborables,
      tipoPeriodo,
      año,
      motivo,
      estado: 'pendiente',
      creadoPor: req.usuario._id
    });

    // Obtener datos del entrenador para la notificación
    const entrenador = await User.findById(targetEntrenadorId);

    // Notificar a gerentes (si lo creó un entrenador)
    if (!esGerente) {
      await notificarGerentes(
        'vacaciones_nueva',
        'Nueva solicitud de vacaciones',
        `${entrenador.nombre} solicita ${diasLaborables} días de vacaciones (${tipoPeriodo === 'estival' ? 'período estival' : 'fuera de período estival'})`,
        { tipo: 'vacacion', id: vacacion._id }
      );
    }

    const vacacionCompleta = await Vacacion.findById(vacacion._id)
      .populate('entrenador', 'nombre email foto')
      .populate('creadoPor', 'nombre email');

    res.status(201).json({
      vacacion: vacacionCompleta,
      resumenActualizado: await obtenerResumenVacaciones(targetEntrenadorId, año)
    });
  } catch (error) {
    console.error('Error al crear solicitud de vacaciones:', error);
    res.status(400).json({
      mensaje: 'Error al crear solicitud de vacaciones',
      error: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
};

// Obtener vacaciones (filtradas por rol)
export const obtenerVacaciones = async (req, res) => {
  try {
    const { estado, año, entrenador } = req.query;
    const filtro = {};

    // Si es entrenador, solo ve sus propias vacaciones
    if (req.usuario.rol === 'entrenador') {
      filtro.entrenador = req.usuario._id;
    } else if (entrenador) {
      // Gerente puede filtrar por entrenador específico
      filtro.entrenador = entrenador;
    }

    if (estado && estado !== 'todas') {
      filtro.estado = estado;
    }

    if (año) {
      filtro.año = parseInt(año);
    }

    const vacaciones = await Vacacion.find(filtro)
      .populate('entrenador', 'nombre email foto')
      .populate('revisadoPor', 'nombre email')
      .populate('creadoPor', 'nombre email')
      .sort({ createdAt: -1 });

    res.json(vacaciones);
  } catch (error) {
    console.error('Error al obtener vacaciones:', error);
    res.status(500).json({
      mensaje: 'Error al obtener vacaciones',
      error: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
};

// Obtener resumen de vacaciones de un entrenador
export const obtenerResumen = async (req, res) => {
  try {
    const entrenadorId = req.params.entrenadorId || req.usuario._id;
    const año = parseInt(req.query.año) || new Date().getFullYear();

    // Verificar permisos
    if (req.usuario.rol === 'entrenador' &&
        entrenadorId.toString() !== req.usuario._id.toString()) {
      return res.status(403).json({
        mensaje: 'No tienes permisos para ver el resumen de otro entrenador'
      });
    }

    const resumen = await obtenerResumenVacaciones(entrenadorId, año);

    // Obtener solicitudes pendientes
    const pendientes = await Vacacion.find({
      entrenador: entrenadorId,
      año: año,
      estado: 'pendiente'
    }).sort({ fechaInicio: 1 });

    // Obtener datos del entrenador
    const entrenador = await User.findById(entrenadorId).select('nombre email foto');

    res.json({
      año,
      entrenador,
      ...resumen,
      solicitudesPendientes: pendientes
    });
  } catch (error) {
    console.error('Error al obtener resumen:', error);
    res.status(500).json({
      mensaje: 'Error al obtener resumen',
      error: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
};

// Obtener una vacación por ID
export const obtenerVacacionPorId = async (req, res) => {
  try {
    const vacacion = await Vacacion.findById(req.params.id)
      .populate('entrenador', 'nombre email foto')
      .populate('revisadoPor', 'nombre email')
      .populate('creadoPor', 'nombre email');

    if (!vacacion) {
      return res.status(404).json({ mensaje: 'Vacación no encontrada' });
    }

    // Verificar permisos
    const esGerente = req.usuario.rol === 'gerente';
    const esPropietario = vacacion.entrenador._id.toString() === req.usuario._id.toString();

    if (!esGerente && !esPropietario) {
      return res.status(403).json({
        mensaje: 'No tienes permisos para ver esta vacación'
      });
    }

    res.json(vacacion);
  } catch (error) {
    console.error('Error al obtener vacación:', error);
    res.status(500).json({
      mensaje: 'Error al obtener vacación',
      error: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
};

// Cancelar solicitud (Entrenador que la creó o Gerente)
export const cancelarSolicitud = async (req, res) => {
  try {
    const vacacion = await Vacacion.findById(req.params.id);

    if (!vacacion) {
      return res.status(404).json({ mensaje: 'Solicitud no encontrada' });
    }

    const esGerente = req.usuario.rol === 'gerente';
    const esPropietario = vacacion.entrenador.toString() === req.usuario._id.toString();

    // Verificar permisos
    if (!esGerente && !esPropietario) {
      return res.status(403).json({
        mensaje: 'No tienes permisos para cancelar esta solicitud'
      });
    }

    if (vacacion.estado !== 'pendiente' && vacacion.estado !== 'aprobado') {
      return res.status(400).json({
        mensaje: 'Solo se pueden cancelar solicitudes pendientes o aprobadas'
      });
    }

    vacacion.estado = 'cancelado';
    await vacacion.save();

    res.json({ mensaje: 'Solicitud cancelada correctamente' });
  } catch (error) {
    console.error('Error al cancelar solicitud:', error);
    res.status(500).json({
      mensaje: 'Error al cancelar solicitud',
      error: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
};

// ============================================
// ENDPOINTS SOLO GERENTE
// ============================================

// Aprobar solicitud de vacaciones
export const aprobarSolicitud = async (req, res) => {
  try {
    if (req.usuario.rol !== 'gerente') {
      return res.status(403).json({
        mensaje: 'Solo el gerente puede aprobar solicitudes'
      });
    }

    const vacacion = await Vacacion.findById(req.params.id)
      .populate('entrenador', 'nombre email');

    if (!vacacion) {
      return res.status(404).json({ mensaje: 'Solicitud no encontrada' });
    }

    if (vacacion.estado !== 'pendiente') {
      return res.status(400).json({
        mensaje: `Esta solicitud ya fue ${vacacion.estado}`
      });
    }

    // Verificar nuevamente la disponibilidad de días
    const resumen = await obtenerResumenVacaciones(vacacion.entrenador._id, vacacion.año);

    if (resumen.diasUsados + vacacion.diasLaborables > DIAS_TOTALES_ANUALES) {
      return res.status(400).json({
        mensaje: 'El entrenador ya no tiene días disponibles suficientes'
      });
    }

    // Actualizar estado
    vacacion.estado = 'aprobado';
    vacacion.revisadoPor = req.usuario._id;
    vacacion.fechaRevision = new Date();
    await vacacion.save();

    // Notificar al entrenador
    const fechaInicioStr = new Date(vacacion.fechaInicio).toLocaleDateString('es-ES');
    const fechaFinStr = new Date(vacacion.fechaFin).toLocaleDateString('es-ES');

    await crearNotificacion(
      vacacion.entrenador._id,
      'vacaciones_aprobada',
      'Vacaciones aprobadas',
      `Tu solicitud de vacaciones del ${fechaInicioStr} al ${fechaFinStr} fue aprobada`,
      { tipo: 'vacacion', id: vacacion._id }
    );

    const vacacionActualizada = await Vacacion.findById(vacacion._id)
      .populate('entrenador', 'nombre email foto')
      .populate('revisadoPor', 'nombre email');

    res.json({
      mensaje: 'Solicitud aprobada correctamente',
      vacacion: vacacionActualizada
    });
  } catch (error) {
    console.error('Error al aprobar solicitud:', error);
    res.status(400).json({
      mensaje: 'Error al aprobar solicitud',
      error: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
};

// Rechazar solicitud de vacaciones
export const rechazarSolicitud = async (req, res) => {
  try {
    if (req.usuario.rol !== 'gerente') {
      return res.status(403).json({
        mensaje: 'Solo el gerente puede rechazar solicitudes'
      });
    }

    const { motivoRechazo } = req.body;
    const vacacion = await Vacacion.findById(req.params.id)
      .populate('entrenador', 'nombre email');

    if (!vacacion) {
      return res.status(404).json({ mensaje: 'Solicitud no encontrada' });
    }

    if (vacacion.estado !== 'pendiente') {
      return res.status(400).json({
        mensaje: `Esta solicitud ya fue ${vacacion.estado}`
      });
    }

    vacacion.estado = 'rechazado';
    vacacion.revisadoPor = req.usuario._id;
    vacacion.fechaRevision = new Date();
    vacacion.motivoRechazo = motivoRechazo || 'Sin motivo especificado';
    await vacacion.save();

    // Notificar al entrenador
    await crearNotificacion(
      vacacion.entrenador._id,
      'vacaciones_rechazada',
      'Vacaciones rechazadas',
      `Tu solicitud de vacaciones fue rechazada. Motivo: ${motivoRechazo || 'Sin motivo'}`,
      { tipo: 'vacacion', id: vacacion._id }
    );

    const vacacionActualizada = await Vacacion.findById(vacacion._id)
      .populate('entrenador', 'nombre email foto')
      .populate('revisadoPor', 'nombre email');

    res.json({
      mensaje: 'Solicitud rechazada',
      vacacion: vacacionActualizada
    });
  } catch (error) {
    console.error('Error al rechazar solicitud:', error);
    res.status(400).json({
      mensaje: 'Error al rechazar solicitud',
      error: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
};

// Obtener resumen global de todos los entrenadores (solo gerente)
export const obtenerResumenGlobal = async (req, res) => {
  try {
    if (req.usuario.rol !== 'gerente') {
      return res.status(403).json({
        mensaje: 'Solo el gerente puede ver el resumen global'
      });
    }

    const año = parseInt(req.query.año) || new Date().getFullYear();

    // Obtener todos los entrenadores activos y todas las vacaciones aprobadas del año en 2 queries
    const [entrenadores, todasVacaciones] = await Promise.all([
      User.find({ rol: 'entrenador', activo: true }).select('nombre email foto'),
      Vacacion.find({ año: año, estado: 'aprobado' })
    ]);

    // Agrupar vacaciones por entrenador en memoria
    const vacacionesPorEntrenador = {};
    for (const v of todasVacaciones) {
      const eid = v.entrenador.toString();
      if (!vacacionesPorEntrenador[eid]) vacacionesPorEntrenador[eid] = [];
      vacacionesPorEntrenador[eid].push(v);
    }

    const resumenGlobal = entrenadores.map(entrenador => {
      const vacaciones = vacacionesPorEntrenador[entrenador._id.toString()] || [];
      let diasEstivalesUsados = 0;
      let diasNoEstivalesUsados = 0;

      vacaciones.forEach(v => {
        if (v.tipoPeriodo === 'estival') {
          diasEstivalesUsados += v.diasLaborables;
        } else {
          diasNoEstivalesUsados += v.diasLaborables;
        }
      });

      const diasTotalesUsados = diasEstivalesUsados + diasNoEstivalesUsados;

      return {
        entrenador: {
          _id: entrenador._id,
          nombre: entrenador.nombre,
          email: entrenador.email,
          foto: entrenador.foto
        },
        diasTotales: DIAS_TOTALES_ANUALES,
        diasUsados: diasTotalesUsados,
        diasPendientes: DIAS_TOTALES_ANUALES - diasTotalesUsados,
        estival: {
          minimo: DIAS_ESTIVALES_MINIMOS,
          usados: diasEstivalesUsados,
          pendientes: Math.max(0, DIAS_ESTIVALES_MINIMOS - diasEstivalesUsados)
        },
        noEstival: {
          maximo: DIAS_NO_ESTIVALES_MAXIMOS,
          usados: diasNoEstivalesUsados,
          disponibles: Math.max(0, DIAS_NO_ESTIVALES_MAXIMOS - diasNoEstivalesUsados)
        }
      };
    });

    res.json({
      año,
      entrenadores: resumenGlobal
    });
  } catch (error) {
    console.error('Error al obtener resumen global:', error);
    res.status(500).json({
      mensaje: 'Error al obtener resumen global',
      error: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
};

// Contar solicitudes pendientes (para badges en menú)
export const contarPendientes = async (req, res) => {
  try {
    const count = await Vacacion.countDocuments({ estado: 'pendiente' });
    res.json({ count });
  } catch (error) {
    console.error('Error al contar solicitudes:', error);
    res.status(500).json({
      mensaje: 'Error al contar solicitudes',
      error: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
};

// Re-exportar para mantener compatibilidad si se importa desde aquí
export { verificarVacacionesEnFecha } from '../utils/vacacionHelper.js';
