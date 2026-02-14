import Reserva from '../models/Reserva.js';
import SuscripcionCliente from '../models/SuscripcionCliente.js';
import { verificarVacacionesEnFecha } from '../utils/vacacionHelper.js';

// Función auxiliar para verificar saldo de sesiones del cliente
const verificarSaldoSesiones = async (clienteId) => {
  const suscripcion = await SuscripcionCliente.findOne({ cliente: clienteId });
  if (!suscripcion) {
    return { tieneSuscripcion: false, saldo: 0, aviso: 'Cliente sin suscripción activa' };
  }
  return {
    tieneSuscripcion: true,
    saldo: suscripcion.saldoSesiones || 0,
    aviso: suscripcion.saldoSesiones <= 0 ? 'Cliente sin sesiones disponibles' : null
  };
};

// Función para descontar sesión del saldo
const descontarSesion = async (clienteId) => {
  const resultado = await SuscripcionCliente.findOneAndUpdate(
    { cliente: clienteId, saldoSesiones: { $gt: 0 } },
    { $inc: { saldoSesiones: -1 } },
    { new: true }
  );
  return resultado !== null;
};

// Función para devolver sesión al saldo (cancelación por el centro)
const devolverSesion = async (clienteId) => {
  await SuscripcionCliente.findOneAndUpdate(
    { cliente: clienteId },
    { $inc: { saldoSesiones: 1 } }
  );
};

export const obtenerReservas = async (req, res) => {
  try {
    const { fecha, entrenador, cliente } = req.query;
    let filtro = {};

    if (fecha) {
      const fechaInicio = new Date(fecha);
      const fechaFin = new Date(fecha);
      fechaFin.setDate(fechaFin.getDate() + 1);
      filtro.fecha = { $gte: fechaInicio, $lt: fechaFin };
    }
    if (entrenador) filtro.entrenador = entrenador;
    if (cliente) filtro.cliente = cliente;

    const reservas = await Reserva.find(filtro)
      .populate('cliente', 'nombre apellido email telefono')
      .populate('entrenador', 'nombre email')
      .sort({ fecha: 1, horaInicio: 1 });

    res.json(reservas);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener reservas', error: process.env.NODE_ENV !== 'production' ? error.message : undefined });
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
    res.status(500).json({ mensaje: 'Error al obtener reserva', error: process.env.NODE_ENV !== 'production' ? error.message : undefined });
  }
};

// Función auxiliar para crear una única reserva
const crearReservaUnica = async (datosReserva, opciones = {}) => {
  const { fecha, horaInicio, horaFin, entrenador, cliente } = datosReserva;
  const { verificarSaldo = true, descontarDelSaldo = true } = opciones;

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

  // Verificar y descontar saldo de sesiones
  let avisoSaldo = null;
  if (cliente && verificarSaldo) {
    const infoSaldo = await verificarSaldoSesiones(cliente);
    if (infoSaldo.saldo <= 0) {
      avisoSaldo = infoSaldo.aviso || 'Sin sesiones disponibles';
    }

    // Descontar sesión si tiene saldo
    if (descontarDelSaldo && infoSaldo.saldo > 0) {
      await descontarSesion(cliente);
    }
  }

  const reserva = await Reserva.create({
    cliente: datosReserva.cliente,
    entrenador: datosReserva.entrenador,
    fecha: datosReserva.fecha,
    horaInicio: datosReserva.horaInicio,
    horaFin: datosReserva.horaFin,
    tipoSesion: datosReserva.tipoSesion,
    notas: datosReserva.notas,
    duracion: datosReserva.duracion,
    origen: datosReserva.origen,
    plantillaOrigen: datosReserva.plantillaOrigen,
    esPlanificada: datosReserva.esPlanificada
  });
  return { reserva, avisoSaldo };
};

export const crearReserva = async (req, res) => {
  try {
    const { fecha, horaInicio, horaFin, entrenador, cliente, recurrente, fechaFinRecurrencia } = req.body;

    // Si es recurrente, crear múltiples reservas
    if (recurrente && fechaFinRecurrencia) {
      const fechaInicial = new Date(fecha);
      const fechaFinal = new Date(fechaFinRecurrencia);

      // Calcular todas las fechas del mismo día de la semana
      const fechasReservas = [];
      let fechaActual = new Date(fechaInicial);

      while (fechaActual <= fechaFinal) {
        fechasReservas.push(new Date(fechaActual));
        fechaActual.setDate(fechaActual.getDate() + 7); // Siguiente semana
      }

      const resultados = {
        creadas: [],
        errores: [],
        avisoSaldo: null
      };

      // Verificar saldo antes de crear reservas recurrentes
      if (cliente) {
        const infoSaldo = await verificarSaldoSesiones(cliente);
        if (infoSaldo.saldo < fechasReservas.length) {
          resultados.avisoSaldo = `El cliente tiene ${infoSaldo.saldo} sesiones disponibles pero se intentan crear ${fechasReservas.length} reservas`;
        }
      }

      // Crear cada reserva
      for (const fechaReserva of fechasReservas) {
        try {
          const datosReserva = {
            cliente,
            entrenador,
            fecha: fechaReserva,
            horaInicio,
            horaFin,
            tipoSesion: req.body.tipoSesion,
            notas: req.body.notas,
            duracion: req.body.duracion
          };

          const { reserva } = await crearReservaUnica(datosReserva);
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
        errores: resultados.errores.length > 0 ? resultados.errores : undefined,
        avisoSaldo: resultados.avisoSaldo
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

    // Verificar saldo de sesiones del cliente
    let avisoSaldo = null;
    if (cliente) {
      const infoSaldo = await verificarSaldoSesiones(cliente);
      if (infoSaldo.saldo <= 0) {
        avisoSaldo = infoSaldo.aviso || 'Cliente sin sesiones disponibles';
      } else {
        // Descontar sesión del saldo
        await descontarSesion(cliente);
      }
    }

    const reserva = await Reserva.create({
      cliente,
      entrenador,
      fecha,
      horaInicio,
      horaFin,
      tipoSesion: req.body.tipoSesion,
      notas: req.body.notas,
      duracion: req.body.duracion,
      origen: req.body.origen,
      plantillaOrigen: req.body.plantillaOrigen,
      esPlanificada: req.body.esPlanificada
    });
    const reservaCompleta = await Reserva.findById(reserva._id)
      .populate('cliente', 'nombre apellido email telefono')
      .populate('entrenador', 'nombre email');

    // Incluir aviso en la respuesta si el cliente no tiene sesiones
    const respuesta = reservaCompleta.toObject();
    if (avisoSaldo) {
      respuesta.avisoSaldo = avisoSaldo;
    }

    res.status(201).json(respuesta);
  } catch (error) {
    res.status(400).json({ mensaje: 'Error al crear reserva', error: process.env.NODE_ENV !== 'production' ? error.message : undefined });
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

    const camposPermitidos = {};
    const camposEditables = ['cliente', 'entrenador', 'fecha', 'horaInicio', 'horaFin', 'tipoSesion', 'estado', 'notas', 'duracion'];
    for (const campo of camposEditables) {
      if (req.body[campo] !== undefined) camposPermitidos[campo] = req.body[campo];
    }

    const reservaActualizada = await Reserva.findByIdAndUpdate(
      req.params.id,
      camposPermitidos,
      { new: true, runValidators: true }
    )
      .populate('cliente', 'nombre apellido email telefono')
      .populate('entrenador', 'nombre email');

    res.json(reservaActualizada);
  } catch (error) {
    res.status(400).json({ mensaje: 'Error al actualizar reserva', error: process.env.NODE_ENV !== 'production' ? error.message : undefined });
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
    res.status(500).json({ mensaje: 'Error al eliminar reserva', error: process.env.NODE_ENV !== 'production' ? error.message : undefined });
  }
};

// Cancelar reserva (devuelve sesión si es cancelación del centro)
export const cancelarReserva = async (req, res) => {
  try {
    const { motivo } = req.body; // 'centro' o 'cliente'
    const reserva = await Reserva.findById(req.params.id);

    if (!reserva) {
      return res.status(404).json({ mensaje: 'Reserva no encontrada' });
    }

    if (reserva.estado === 'cancelada') {
      return res.status(400).json({ mensaje: 'La reserva ya está cancelada' });
    }

    // Actualizar estado de la reserva
    reserva.estado = 'cancelada';
    reserva.notas = `${reserva.notas || ''} [Cancelada: ${motivo === 'centro' ? 'por el centro' : 'por el cliente'}]`;
    await reserva.save();

    // Si la cancelación es por el centro, devolver la sesión al cliente
    let sesionDevuelta = false;
    if (motivo === 'centro' && reserva.cliente) {
      await devolverSesion(reserva.cliente);
      sesionDevuelta = true;
    }

    res.json({
      mensaje: 'Reserva cancelada correctamente',
      sesionDevuelta,
      reserva
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al cancelar reserva', error: process.env.NODE_ENV !== 'production' ? error.message : undefined });
  }
};

// Obtener saldo de sesiones de un cliente
export const obtenerSaldoSesiones = async (req, res) => {
  try {
    const { clienteId } = req.params;
    const suscripcion = await SuscripcionCliente.findOne({ cliente: clienteId })
      .populate('cliente', 'nombre apellido')
      .populate('producto', 'nombre tipo');

    if (!suscripcion) {
      return res.status(404).json({
        mensaje: 'Cliente sin suscripción',
        saldoSesiones: 0,
        tieneSuscripcion: false
      });
    }

    res.json({
      saldoSesiones: suscripcion.saldoSesiones || 0,
      tieneSuscripcion: true,
      estado: suscripcion.estado,
      producto: suscripcion.producto?.nombre,
      diasPorSemana: suscripcion.diasPorSemana
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener saldo', error: process.env.NODE_ENV !== 'production' ? error.message : undefined });
  }
};
