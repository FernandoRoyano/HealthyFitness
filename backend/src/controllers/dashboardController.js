import Cliente from '../models/Cliente.js';
import ClientePotencial from '../models/ClientePotencial.js';
import Reserva from '../models/Reserva.js';
import SolicitudCambio from '../models/SolicitudCambio.js';
import Vacacion from '../models/Vacacion.js';
import FacturaMensual from '../models/FacturaMensual.js';

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
      const [
        clientesActivos,
        leadsStats,
        reservasHoy,
        solicitudesPendientes,
        vacacionesPendientes,
        facturasMes
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
        ])
      ]);

      res.json({
        clientesActivos,
        leadsPendientes: leadsStats,
        reservasHoy,
        solicitudesPendientes,
        vacacionesPendientes,
        facturacionMes: facturasMes[0]?.total || 0
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
