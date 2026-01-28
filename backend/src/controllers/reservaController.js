import Reserva from '../models/Reserva.js';
import Vacacion from '../models/Vacacion.js';

// Función auxiliar para verificar si un entrenador tiene vacaciones en una fecha
const verificarVacacionesEnFecha = async (entrenadorId, fecha) => {
  const fechaConsulta = new Date(fecha);
  fechaConsulta.setHours(0, 0, 0, 0);

  const vacacion = await Vacacion.findOne({
    entrenador: entrenadorId,
    estado: 'aprobado',
    fechaInicio: { $lte: fechaConsulta },
    fechaFin: { $gte: fechaConsulta }
  });

  return vacacion;
};

export const obtenerReservas = async (req, res) => {
  try {
    const { fecha, entrenador, cliente } = req.query;
    let filtro = {};

    console.log('📅 Query params:', req.query);

    if (fecha) {
      const fechaInicio = new Date(fecha);
      const fechaFin = new Date(fecha);
      fechaFin.setDate(fechaFin.getDate() + 1);
      filtro.fecha = { $gte: fechaInicio, $lt: fechaFin };
      console.log('📅 Filtro fecha:', { fechaInicio, fechaFin });
    }
    if (entrenador) filtro.entrenador = entrenador;
    if (cliente) filtro.cliente = cliente;

    console.log('📅 Filtro completo:', filtro);

    const reservas = await Reserva.find(filtro)
      .populate('cliente', 'nombre apellido email telefono')
      .populate('entrenador', 'nombre email')
      .sort({ fecha: 1, horaInicio: 1 });

    console.log('📅 Reservas encontradas:', reservas.length);
    reservas.forEach(r => {
      console.log(`  - ${r.fecha.toISOString()} | ${r.horaInicio}-${r.horaFin} | ${r.entrenador.nombre} | ${r.cliente.nombre}`);
    });

    res.json(reservas);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener reservas', error: error.message });
  }
};

export const obtenerReservaPorId = async (req, res) => {
  try {
    const reserva = await Reserva.findById(req.params.id)
      .populate('cliente', 'nombre apellido email telefono')
      .populate('entrenador', 'nombre email');

    if (!reserva) {
      return res.status(404).json({ mensaje: 'Reserva no encontrada' });
    }
    res.json(reserva);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener reserva', error: error.message });
  }
};

// Función auxiliar para crear una única reserva
const crearReservaUnica = async (datosReserva) => {
  const { fecha, horaInicio, horaFin, entrenador } = datosReserva;

  // Verificar vacaciones
  const vacacion = await verificarVacacionesEnFecha(entrenador, fecha);
  if (vacacion) {
    const fechaInicioVac = new Date(vacacion.fechaInicio).toLocaleDateString('es-ES');
    const fechaFinVac = new Date(vacacion.fechaFin).toLocaleDateString('es-ES');
    throw new Error(`Vacaciones del ${fechaInicioVac} al ${fechaFinVac}`);
  }

  // Verificar conflicto de horario
  const reservaExiste = await Reserva.findOne({
    fecha: new Date(fecha),
    entrenador,
    $or: [
      { horaInicio: { $lte: horaInicio }, horaFin: { $gt: horaInicio } },
      { horaInicio: { $lt: horaFin }, horaFin: { $gte: horaFin } },
      { horaInicio: { $gte: horaInicio }, horaFin: { $lte: horaFin } }
    ],
    estado: { $ne: 'cancelada' }
  });

  if (reservaExiste) {
    throw new Error('Horario ocupado');
  }

  return await Reserva.create(datosReserva);
};

export const crearReserva = async (req, res) => {
  try {
    const { fecha, horaInicio, horaFin, entrenador, recurrente, fechaFinRecurrencia } = req.body;

    // Si es recurrente, crear múltiples reservas
    if (recurrente && fechaFinRecurrencia) {
      const fechaInicial = new Date(fecha);
      const fechaFinal = new Date(fechaFinRecurrencia);
      const diaSemana = fechaInicial.getDay(); // 0=Dom, 1=Lun, ..., 6=Sab

      // Calcular todas las fechas del mismo día de la semana
      const fechasReservas = [];
      let fechaActual = new Date(fechaInicial);

      while (fechaActual <= fechaFinal) {
        fechasReservas.push(new Date(fechaActual));
        fechaActual.setDate(fechaActual.getDate() + 7); // Siguiente semana
      }

      const resultados = {
        creadas: [],
        errores: []
      };

      // Crear cada reserva
      for (const fechaReserva of fechasReservas) {
        try {
          const datosReserva = {
            ...req.body,
            fecha: fechaReserva,
            recurrente: undefined,
            fechaFinRecurrencia: undefined
          };
          delete datosReserva.recurrente;
          delete datosReserva.fechaFinRecurrencia;

          const reserva = await crearReservaUnica(datosReserva);
          const reservaCompleta = await Reserva.findById(reserva._id)
            .populate('cliente', 'nombre apellido email telefono')
            .populate('entrenador', 'nombre email');
          resultados.creadas.push(reservaCompleta);
        } catch (err) {
          resultados.errores.push({
            fecha: fechaReserva.toLocaleDateString('es-ES'),
            error: err.message
          });
        }
      }

      // Devolver resultados
      if (resultados.creadas.length === 0) {
        return res.status(400).json({
          mensaje: 'No se pudo crear ninguna reserva',
          errores: resultados.errores
        });
      }

      return res.status(201).json({
        mensaje: `Se crearon ${resultados.creadas.length} de ${fechasReservas.length} reservas`,
        reservas: resultados.creadas,
        errores: resultados.errores.length > 0 ? resultados.errores : undefined
      });
    }

    // Reserva única (comportamiento original)
    // Verificar si el entrenador tiene vacaciones aprobadas en esa fecha
    const vacacion = await verificarVacacionesEnFecha(entrenador, fecha);
    if (vacacion) {
      const fechaInicioVac = new Date(vacacion.fechaInicio).toLocaleDateString('es-ES');
      const fechaFinVac = new Date(vacacion.fechaFin).toLocaleDateString('es-ES');
      return res.status(400).json({
        mensaje: `El entrenador tiene vacaciones aprobadas del ${fechaInicioVac} al ${fechaFinVac}`
      });
    }

    const reservaExiste = await Reserva.findOne({
      fecha: new Date(fecha),
      entrenador,
      $or: [
        { horaInicio: { $lte: horaInicio }, horaFin: { $gt: horaInicio } },
        { horaInicio: { $lt: horaFin }, horaFin: { $gte: horaFin } },
        { horaInicio: { $gte: horaInicio }, horaFin: { $lte: horaFin } }
      ],
      estado: { $ne: 'cancelada' }
    });

    if (reservaExiste) {
      return res.status(400).json({
        mensaje: 'Ya existe una reserva en ese horario para este entrenador'
      });
    }

    const reserva = await Reserva.create(req.body);
    const reservaCompleta = await Reserva.findById(reserva._id)
      .populate('cliente', 'nombre apellido email telefono')
      .populate('entrenador', 'nombre email');

    res.status(201).json(reservaCompleta);
  } catch (error) {
    res.status(400).json({ mensaje: 'Error al crear reserva', error: error.message });
  }
};

export const actualizarReserva = async (req, res) => {
  try {
    const reserva = await Reserva.findById(req.params.id);
    if (!reserva) {
      return res.status(404).json({ mensaje: 'Reserva no encontrada' });
    }

    if (req.body.fecha || req.body.horaInicio || req.body.horaFin) {
      const { fecha, horaInicio, horaFin, entrenador } = {
        fecha: req.body.fecha || reserva.fecha,
        horaInicio: req.body.horaInicio || reserva.horaInicio,
        horaFin: req.body.horaFin || reserva.horaFin,
        entrenador: req.body.entrenador || reserva.entrenador
      };

      // Verificar si el entrenador tiene vacaciones aprobadas en la nueva fecha
      const vacacion = await verificarVacacionesEnFecha(entrenador, fecha);
      if (vacacion) {
        const fechaInicioVac = new Date(vacacion.fechaInicio).toLocaleDateString('es-ES');
        const fechaFinVac = new Date(vacacion.fechaFin).toLocaleDateString('es-ES');
        return res.status(400).json({
          mensaje: `El entrenador tiene vacaciones aprobadas del ${fechaInicioVac} al ${fechaFinVac}`
        });
      }

      const reservaExiste = await Reserva.findOne({
        _id: { $ne: req.params.id },
        fecha: new Date(fecha),
        entrenador,
        $or: [
          { horaInicio: { $lte: horaInicio }, horaFin: { $gt: horaInicio } },
          { horaInicio: { $lt: horaFin }, horaFin: { $gte: horaFin } },
          { horaInicio: { $gte: horaInicio }, horaFin: { $lte: horaFin } }
        ],
        estado: { $ne: 'cancelada' }
      });

      if (reservaExiste) {
        return res.status(400).json({
          mensaje: 'Ya existe una reserva en ese horario para este entrenador'
        });
      }
    }

    const reservaActualizada = await Reserva.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('cliente', 'nombre apellido email telefono')
      .populate('entrenador', 'nombre email');

    res.json(reservaActualizada);
  } catch (error) {
    res.status(400).json({ mensaje: 'Error al actualizar reserva', error: error.message });
  }
};

export const eliminarReserva = async (req, res) => {
  try {
    const reserva = await Reserva.findById(req.params.id);
    if (!reserva) {
      return res.status(404).json({ mensaje: 'Reserva no encontrada' });
    }

    await Reserva.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Reserva eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al eliminar reserva', error: error.message });
  }
};
