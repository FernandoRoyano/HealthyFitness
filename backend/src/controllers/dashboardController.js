import Cliente from '../models/Cliente.js';
import ClientePotencial from '../models/ClientePotencial.js';
import Reserva from '../models/Reserva.js';
import SolicitudCambio from '../models/SolicitudCambio.js';
import Vacacion from '../models/Vacacion.js';
import FacturaMensual from '../models/FacturaMensual.js';
import User from '../models/User.js';
import Centro from '../models/Centro.js';

// @desc    Obtener estadísticas del dashboard
// @route   GET /api/dashboard/stats
// @access  Private
export const obtenerEstadisticas = async (req, res) => {
  try {
    const usuario = req.usuario;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const finHoy = new Date(hoy);
    finHoy.setHours(23, 59, 59, 999);

    const mesActual = hoy.getMonth() + 1;
    const anioActual = hoy.getFullYear();

    if (usuario.rol === 'gerente') {
      // Estadísticas para gerente
      // Obtener entrenadores y precios de incentivos
      const [entrenadores, centro] = await Promise.all([
        User.find({ rol: 'entrenador', activo: true }).select('_id nombre'),
        Centro.obtenerCentro()
      ]);
      const idsEntrenadores = entrenadores.map(e => e._id);

      const precios = centro.preciosIncentivos || { individual: 10, pareja: 15, express: 7, parejaExpress: 10 };
      const preciosPorTipo = {
        individual: precios.individual,
        pareja: precios.pareja,
        express: precios.express,
        'pareja-express': precios.parejaExpress
      };

      const inicioMes = new Date(anioActual, mesActual - 1, 1);
      const finMes = new Date(anioActual, mesActual, 0, 23, 59, 59, 999);

      const [
        clientesActivos,
        leadsStats,
        reservasHoy,
        solicitudesPendientes,
        vacacionesPendientes,
        facturasMes,
        entrenamientosPorEntrenador
      ] = await Promise.all([
        // Clientes activos
        Cliente.countDocuments({ activo: true }),

        // Leads pendientes (sin contactar)
        ClientePotencial.countDocuments({ estado: 'pendiente' }),

        // Reservas de hoy (todas)
        Reserva.countDocuments({
          fecha: { $gte: hoy, $lte: finHoy }
        }),

        // Solicitudes de cambio pendientes
        SolicitudCambio.countDocuments({ estado: 'pendiente' }),

        // Vacaciones pendientes de aprobar
        Vacacion.countDocuments({ estado: 'pendiente' }),

        // Facturación del mes actual
        FacturaMensual.aggregate([
          {
            $match: {
              mes: mesActual,
              anio: anioActual,
              estado: { $in: ['pagada', 'emitida'] }
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$total' }
            }
          }
        ]),

        // Reservas del mes por entrenador y tipo (completadas o confirmadas)
        Reserva.aggregate([
          {
            $match: {
              fecha: { $gte: inicioMes, $lte: finMes },
              entrenador: { $in: idsEntrenadores },
              estado: { $in: ['completada', 'confirmada'] }
            }
          },
          {
            $group: {
              _id: { entrenador: '$entrenador', tipoSesion: '$tipoSesion' },
              total: { $sum: 1 }
            }
          }
        ])
      ]);

      // Calcular sesiones e ingresos por entrenador
      const mapaEntrenamientos = {};
      entrenamientosPorEntrenador.forEach(row => {
        const eId = row._id.entrenador.toString();
        const precio = preciosPorTipo[row._id.tipoSesion] || preciosPorTipo.individual;
        if (!mapaEntrenamientos[eId]) {
          mapaEntrenamientos[eId] = { total: 0, ingresos: 0 };
        }
        mapaEntrenamientos[eId].total += row.total;
        mapaEntrenamientos[eId].ingresos += row.total * precio;
      });

      const entrenamientosMes = entrenadores.map(e => ({
        entrenadorId: e._id,
        nombre: e.nombre,
        total: mapaEntrenamientos[e._id.toString()]?.total || 0,
        ingresos: mapaEntrenamientos[e._id.toString()]?.ingresos || 0
      })).sort((a, b) => b.total - a.total);

      const totalIngresosMes = entrenamientosMes.reduce((sum, e) => sum + e.ingresos, 0);

      res.json({
        clientesActivos,
        leadsPendientes: leadsStats,
        reservasHoy,
        solicitudesPendientes,
        vacacionesPendientes,
        facturacionMes: facturasMes[0]?.total || 0,
        entrenamientosMes,
        totalIngresosMes
      });

    } else {
      // Estadísticas para entrenador
      const [
        misClientes,
        leadsStats,
        misReservasHoy,
        miResumenVacaciones
      ] = await Promise.all([
        // Mis clientes asignados
        Cliente.countDocuments({
          entrenador: usuario._id,
          activo: true
        }),

        // Leads pendientes (visibles para todos)
        ClientePotencial.countDocuments({ estado: 'pendiente' }),

        // Mis reservas de hoy
        Reserva.countDocuments({
          entrenador: usuario._id,
          fecha: { $gte: hoy, $lte: finHoy }
        }),

        // Mi resumen de vacaciones del año
        Vacacion.aggregate([
          {
            $match: {
              entrenador: usuario._id,
              estado: 'aprobado',
              año: anioActual
            }
          },
          {
            $group: {
              _id: null,
              diasUsados: { $sum: '$diasLaborables' }
            }
          }
        ])
      ]);

      const diasVacacionesTotales = 23; // Días de vacaciones anuales
      const diasUsados = miResumenVacaciones[0]?.diasUsados || 0;

      res.json({
        misClientes,
        leadsPendientes: leadsStats,
        misReservasHoy,
        diasVacacionesDisponibles: diasVacacionesTotales - diasUsados
      });
    }

  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ mensaje: 'Error al obtener estadísticas del dashboard' });
  }
};
