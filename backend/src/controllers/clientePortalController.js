import Reserva from '../models/Reserva.js';
import MedicionCorporal from '../models/MedicionCorporal.js';
import SuscripcionCliente from '../models/SuscripcionCliente.js';
import FacturaMensual from '../models/FacturaMensual.js';

// GET /api/cliente-portal/mis-reservas
export const obtenerMisReservas = async (req, res) => {
  try {
    const clienteId = req.cliente._id;

    const reservas = await Reserva.find({ cliente: clienteId })
      .populate('entrenador', 'nombre email telefono foto')
      .sort({ fecha: 1, horaInicio: 1 });

    res.json(reservas);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener reservas', error: error.message });
  }
};

// GET /api/cliente-portal/mi-calendario
export const obtenerMiCalendario = async (req, res) => {
  try {
    const clienteId = req.cliente._id;
    const { semana } = req.query; // formato: 2024-01-22

    let fechaInicio, fechaFin;

    if (semana) {
      fechaInicio = new Date(semana);
      fechaFin = new Date(fechaInicio);
      fechaFin.setDate(fechaFin.getDate() + 7);
    } else {
      // Por defecto, semana actual
      fechaInicio = new Date();
      fechaInicio.setDate(fechaInicio.getDate() - fechaInicio.getDay() + 1); // Lunes
      fechaFin = new Date(fechaInicio);
      fechaFin.setDate(fechaFin.getDate() + 7);
    }

    const reservas = await Reserva.find({
      cliente: clienteId,
      fecha: { $gte: fechaInicio, $lt: fechaFin }
    })
      .populate('entrenador', 'nombre email telefono foto')
      .sort({ fecha: 1, horaInicio: 1 });

    res.json(reservas);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener calendario', error: error.message });
  }
};

// GET /api/cliente-portal/mis-sesiones
export const obtenerMisSesiones = async (req, res) => {
  try {
    const clienteId = req.cliente._id;
    const { filtro } = req.query; // proximas, pasadas, todas

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    let query = { cliente: clienteId };

    if (filtro === 'proximas') {
      query.fecha = { $gte: hoy };
    } else if (filtro === 'pasadas') {
      query.fecha = { $lt: hoy };
    }

    const sesiones = await Reserva.find(query)
      .populate('entrenador', 'nombre email telefono foto')
      .sort({ fecha: filtro === 'pasadas' ? -1 : 1, horaInicio: 1 })
      .limit(50);

    res.json(sesiones);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener sesiones', error: error.message });
  }
};

// GET /api/cliente-portal/mis-mediciones
export const obtenerMisMediciones = async (req, res) => {
  try {
    const clienteId = req.cliente._id;

    const mediciones = await MedicionCorporal.find({ cliente: clienteId })
      .sort({ fecha: -1 })
      .limit(20);

    res.json(mediciones);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener mediciones', error: error.message });
  }
};

// GET /api/cliente-portal/mi-suscripcion
export const obtenerMiSuscripcion = async (req, res) => {
  try {
    const clienteId = req.cliente._id;

    const suscripcion = await SuscripcionCliente.findOne({ cliente: clienteId })
      .populate('producto', 'nombre descripcion');

    if (!suscripcion) {
      return res.json(null);
    }

    // Contar sesiones usadas este mes
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);

    const finMes = new Date(inicioMes);
    finMes.setMonth(finMes.getMonth() + 1);

    const sesionesUsadas = await Reserva.countDocuments({
      cliente: clienteId,
      fecha: { $gte: inicioMes, $lt: finMes },
      estado: { $in: ['confirmada', 'completada'] }
    });

    res.json({
      ...suscripcion.toObject(),
      sesionesUsadas
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener suscripción', error: error.message });
  }
};

// GET /api/cliente-portal/mis-facturas
export const obtenerMisFacturas = async (req, res) => {
  try {
    const clienteId = req.cliente._id;

    const facturas = await FacturaMensual.find({ cliente: clienteId })
      .sort({ fecha: -1 })
      .limit(12);

    res.json(facturas);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener facturas', error: error.message });
  }
};

// GET /api/cliente-portal/dashboard
export const obtenerDashboard = async (req, res) => {
  try {
    const clienteId = req.cliente._id;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    // Próxima sesión
    const proximaSesion = await Reserva.findOne({
      cliente: clienteId,
      fecha: { $gte: hoy },
      estado: { $in: ['pendiente', 'confirmada'] }
    })
      .populate('entrenador', 'nombre')
      .sort({ fecha: 1, horaInicio: 1 });

    // Sesiones esta semana
    const finSemana = new Date(hoy);
    finSemana.setDate(finSemana.getDate() + 7);

    const sesionesEstaSemana = await Reserva.countDocuments({
      cliente: clienteId,
      fecha: { $gte: hoy, $lt: finSemana },
      estado: { $in: ['pendiente', 'confirmada'] }
    });

    // Última medición
    const ultimaMedicion = await MedicionCorporal.findOne({ cliente: clienteId })
      .sort({ fecha: -1 });

    // Suscripción activa
    const suscripcion = await SuscripcionCliente.findOne({
      cliente: clienteId,
      estado: 'activa'
    }).populate('producto', 'nombre');

    res.json({
      proximaSesion,
      sesionesEstaSemana,
      ultimaMedicion,
      suscripcion
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener dashboard', error: error.message });
  }
};
