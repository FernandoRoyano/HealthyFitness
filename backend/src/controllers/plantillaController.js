import PlantillaSemanal from '../models/PlantillaSemanal.js';
import Reserva from '../models/Reserva.js';
import { crearNotificacion } from './notificacionController.js';

// Obtener todas las plantillas (con filtros opcionales)
export const obtenerPlantillas = async (req, res) => {
  try {
    const { mes, año, estado, esPlantillaBase } = req.query;
    const filtro = {};

    if (mes) filtro.mes = parseInt(mes);
    if (año) filtro.año = parseInt(año);
    if (estado) filtro.estado = estado;
    if (esPlantillaBase !== undefined) filtro.esPlantillaBase = esPlantillaBase === 'true';

    const plantillas = await PlantillaSemanal.find(filtro)
      .populate('creadoPor', 'nombre')
      .populate('sesiones.entrenador', 'nombre')
      .populate('sesiones.cliente', 'nombre apellido')
      .sort({ semanaReferencia: 1 });

    res.json(plantillas);
  } catch (error) {
    console.error('Error al obtener plantillas:', error);
    res.status(500).json({ mensaje: 'Error al obtener plantillas' });
  }
};

// Obtener plantilla por ID
export const obtenerPlantillaPorId = async (req, res) => {
  try {
    const plantilla = await PlantillaSemanal.findById(req.params.id)
      .populate('creadoPor', 'nombre')
      .populate('sesiones.entrenador', 'nombre')
      .populate('sesiones.cliente', 'nombre apellido');

    if (!plantilla) {
      return res.status(404).json({ mensaje: 'Plantilla no encontrada' });
    }

    res.json(plantilla);
  } catch (error) {
    console.error('Error al obtener plantilla:', error);
    res.status(500).json({ mensaje: 'Error al obtener plantilla' });
  }
};

// Obtener plantilla base del mes
export const obtenerPlantillaBase = async (req, res) => {
  try {
    const { mes, anio } = req.params;

    const plantilla = await PlantillaSemanal.findOne({
      mes: parseInt(mes),
      año: parseInt(anio),
      esPlantillaBase: true
    })
      .populate('creadoPor', 'nombre')
      .populate('sesiones.entrenador', 'nombre')
      .populate('sesiones.cliente', 'nombre apellido');

    if (!plantilla) {
      return res.status(404).json({ mensaje: 'No hay plantilla base para este mes' });
    }

    res.json(plantilla);
  } catch (error) {
    console.error('Error al obtener plantilla base:', error);
    res.status(500).json({ mensaje: 'Error al obtener plantilla base' });
  }
};

// Crear nueva plantilla
export const crearPlantilla = async (req, res) => {
  try {
    const { nombre, descripcion, esPlantillaBase, semanaReferencia, mes, año, sesiones } = req.body;

    // Si es plantilla base, verificar que no exista otra para el mismo mes
    if (esPlantillaBase) {
      const existente = await PlantillaSemanal.findOne({
        mes,
        año,
        esPlantillaBase: true
      });

      if (existente) {
        return res.status(400).json({
          mensaje: 'Ya existe una plantilla base para este mes. Desactívela primero o edítela.'
        });
      }
    }

    const plantilla = new PlantillaSemanal({
      nombre,
      descripcion,
      esPlantillaBase: esPlantillaBase || false,
      semanaReferencia: new Date(semanaReferencia),
      mes,
      año,
      sesiones: sesiones || [],
      creadoPor: req.usuario._id
    });

    await plantilla.save();

    const plantillaPopulada = await PlantillaSemanal.findById(plantilla._id)
      .populate('creadoPor', 'nombre')
      .populate('sesiones.entrenador', 'nombre')
      .populate('sesiones.cliente', 'nombre apellido');

    res.status(201).json(plantillaPopulada);
  } catch (error) {
    console.error('Error al crear plantilla:', error);
    res.status(500).json({ mensaje: 'Error al crear plantilla' });
  }
};

// Actualizar plantilla
export const actualizarPlantilla = async (req, res) => {
  try {
    const { nombre, descripcion, esPlantillaBase, estado, sesiones } = req.body;

    const plantilla = await PlantillaSemanal.findById(req.params.id);

    if (!plantilla) {
      return res.status(404).json({ mensaje: 'Plantilla no encontrada' });
    }

    // Si se está marcando como plantilla base, verificar que no exista otra
    if (esPlantillaBase && !plantilla.esPlantillaBase) {
      const existente = await PlantillaSemanal.findOne({
        mes: plantilla.mes,
        año: plantilla.año,
        esPlantillaBase: true,
        _id: { $ne: plantilla._id }
      });

      if (existente) {
        return res.status(400).json({
          mensaje: 'Ya existe una plantilla base para este mes'
        });
      }
    }

    if (nombre) plantilla.nombre = nombre;
    if (descripcion !== undefined) plantilla.descripcion = descripcion;
    if (esPlantillaBase !== undefined) plantilla.esPlantillaBase = esPlantillaBase;
    if (estado) plantilla.estado = estado;
    if (sesiones) plantilla.sesiones = sesiones;

    await plantilla.save();

    const plantillaActualizada = await PlantillaSemanal.findById(plantilla._id)
      .populate('creadoPor', 'nombre')
      .populate('sesiones.entrenador', 'nombre')
      .populate('sesiones.cliente', 'nombre apellido');

    res.json(plantillaActualizada);
  } catch (error) {
    console.error('Error al actualizar plantilla:', error);
    res.status(500).json({ mensaje: 'Error al actualizar plantilla' });
  }
};

// Eliminar plantilla
export const eliminarPlantilla = async (req, res) => {
  try {
    const plantilla = await PlantillaSemanal.findById(req.params.id);

    if (!plantilla) {
      return res.status(404).json({ mensaje: 'Plantilla no encontrada' });
    }

    // No permitir eliminar si hay reservas asociadas activas
    const reservasAsociadas = await Reserva.countDocuments({
      plantillaOrigen: plantilla._id,
      estado: { $in: ['pendiente', 'confirmada'] }
    });

    if (reservasAsociadas > 0) {
      return res.status(400).json({
        mensaje: `No se puede eliminar. Hay ${reservasAsociadas} reservas activas asociadas a esta plantilla.`
      });
    }

    await PlantillaSemanal.findByIdAndDelete(req.params.id);

    res.json({ mensaje: 'Plantilla eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar plantilla:', error);
    res.status(500).json({ mensaje: 'Error al eliminar plantilla' });
  }
};

// Duplicar plantilla a otra semana
export const duplicarPlantilla = async (req, res) => {
  try {
    const { nuevaSemanaReferencia, nuevoNombre } = req.body;

    const plantillaOriginal = await PlantillaSemanal.findById(req.params.id);

    if (!plantillaOriginal) {
      return res.status(404).json({ mensaje: 'Plantilla original no encontrada' });
    }

    const nuevaFecha = new Date(nuevaSemanaReferencia);
    const nuevoMes = nuevaFecha.getMonth() + 1;
    const nuevoAño = nuevaFecha.getFullYear();

    // Crear copia de las sesiones sin los _id
    const sesionesCopiadas = plantillaOriginal.sesiones.map(sesion => ({
      entrenador: sesion.entrenador,
      diaSemana: sesion.diaSemana,
      horaInicio: sesion.horaInicio,
      horaFin: sesion.horaFin,
      cliente: sesion.cliente,
      tipoSesion: sesion.tipoSesion,
      duracion: sesion.duracion,
      notas: sesion.notas
    }));

    const nuevaPlantilla = new PlantillaSemanal({
      nombre: nuevoNombre || `${plantillaOriginal.nombre} - Copia`,
      descripcion: plantillaOriginal.descripcion,
      esPlantillaBase: false, // Las copias nunca son plantilla base
      semanaReferencia: nuevaFecha,
      mes: nuevoMes,
      año: nuevoAño,
      estado: 'borrador',
      sesiones: sesionesCopiadas,
      creadoPor: req.usuario._id,
      plantillaOrigen: plantillaOriginal._id
    });

    await nuevaPlantilla.save();

    const plantillaPopulada = await PlantillaSemanal.findById(nuevaPlantilla._id)
      .populate('creadoPor', 'nombre')
      .populate('sesiones.entrenador', 'nombre')
      .populate('sesiones.cliente', 'nombre apellido');

    res.status(201).json(plantillaPopulada);
  } catch (error) {
    console.error('Error al duplicar plantilla:', error);
    res.status(500).json({ mensaje: 'Error al duplicar plantilla' });
  }
};

// Aplicar plantilla - Generar reservas reales desde la plantilla
export const aplicarPlantilla = async (req, res) => {
  try {
    const plantilla = await PlantillaSemanal.findById(req.params.id)
      .populate('sesiones.entrenador', 'nombre')
      .populate('sesiones.cliente', 'nombre apellido');

    if (!plantilla) {
      return res.status(404).json({ mensaje: 'Plantilla no encontrada' });
    }

    if (plantilla.sesiones.length === 0) {
      return res.status(400).json({ mensaje: 'La plantilla no tiene sesiones definidas' });
    }

    const lunes = new Date(plantilla.semanaReferencia);
    const reservasCreadas = [];
    const errores = [];

    for (const sesion of plantilla.sesiones) {
      // Solo crear reservas si hay cliente asignado
      if (!sesion.cliente) continue;

      // Calcular la fecha real basándose en el día de la semana
      // diaSemana: 1=lunes, 2=martes, ..., 5=viernes
      const fechaSesion = new Date(lunes);
      fechaSesion.setDate(lunes.getDate() + (sesion.diaSemana - 1));

      // Verificar si ya existe una reserva para ese horario
      const reservaExistente = await Reserva.findOne({
        entrenador: sesion.entrenador._id || sesion.entrenador,
        fecha: fechaSesion,
        horaInicio: sesion.horaInicio,
        estado: { $ne: 'cancelada' }
      });

      if (reservaExistente) {
        errores.push(`Ya existe reserva el ${fechaSesion.toLocaleDateString()} a las ${sesion.horaInicio}`);
        continue;
      }

      try {
        const nuevaReserva = new Reserva({
          cliente: sesion.cliente._id || sesion.cliente,
          entrenador: sesion.entrenador._id || sesion.entrenador,
          fecha: fechaSesion,
          horaInicio: sesion.horaInicio,
          horaFin: sesion.horaFin,
          tipoSesion: sesion.tipoSesion === 'individual' ? 'personal' : sesion.tipoSesion,
          estado: 'pendiente',
          duracion: sesion.duracion,
          notas: sesion.notas,
          origen: 'plantilla',
          plantillaOrigen: plantilla._id,
          esPlanificada: true
        });

        await nuevaReserva.save();
        reservasCreadas.push(nuevaReserva);

        // Notificar al entrenador
        await crearNotificacion(
          sesion.entrenador._id || sesion.entrenador,
          'reserva_creada',
          'Nueva sesión planificada',
          `Se ha planificado una sesión con ${sesion.cliente.nombre} ${sesion.cliente.apellido} para el ${fechaSesion.toLocaleDateString('es-ES')} a las ${sesion.horaInicio}`,
          { tipo: 'reserva', id: nuevaReserva._id }
        );
      } catch (err) {
        errores.push(`Error creando reserva: ${err.message}`);
      }
    }

    // Actualizar estado de la plantilla
    plantilla.estado = 'aplicada';
    await plantilla.save();

    res.json({
      mensaje: `Plantilla aplicada. ${reservasCreadas.length} reservas creadas.`,
      reservasCreadas: reservasCreadas.length,
      errores: errores.length > 0 ? errores : undefined
    });
  } catch (error) {
    console.error('Error al aplicar plantilla:', error);
    res.status(500).json({ mensaje: 'Error al aplicar plantilla' });
  }
};

// Añadir sesión a una plantilla
export const añadirSesion = async (req, res) => {
  try {
    const { entrenador, diaSemana, horaInicio, horaFin, cliente, tipoSesion, duracion, notas } = req.body;

    const plantilla = await PlantillaSemanal.findById(req.params.id);

    if (!plantilla) {
      return res.status(404).json({ mensaje: 'Plantilla no encontrada' });
    }

    // Verificar conflictos de horario para el mismo entrenador
    const conflicto = plantilla.sesiones.find(s =>
      s.entrenador.toString() === entrenador &&
      s.diaSemana === diaSemana &&
      ((horaInicio >= s.horaInicio && horaInicio < s.horaFin) ||
       (horaFin > s.horaInicio && horaFin <= s.horaFin) ||
       (horaInicio <= s.horaInicio && horaFin >= s.horaFin))
    );

    if (conflicto) {
      return res.status(400).json({
        mensaje: 'Ya existe una sesión en ese horario para este entrenador'
      });
    }

    plantilla.sesiones.push({
      entrenador,
      diaSemana,
      horaInicio,
      horaFin,
      cliente: cliente || null,
      tipoSesion: tipoSesion || 'individual',
      duracion: duracion || 60,
      notas: notas || ''
    });

    await plantilla.save();

    const plantillaActualizada = await PlantillaSemanal.findById(plantilla._id)
      .populate('creadoPor', 'nombre')
      .populate('sesiones.entrenador', 'nombre')
      .populate('sesiones.cliente', 'nombre apellido');

    res.json(plantillaActualizada);
  } catch (error) {
    console.error('Error al añadir sesión:', error);
    res.status(500).json({ mensaje: 'Error al añadir sesión' });
  }
};

// Eliminar sesión de una plantilla
export const eliminarSesion = async (req, res) => {
  try {
    const { sesionId } = req.params;

    const plantilla = await PlantillaSemanal.findById(req.params.id);

    if (!plantilla) {
      return res.status(404).json({ mensaje: 'Plantilla no encontrada' });
    }

    plantilla.sesiones = plantilla.sesiones.filter(s => s._id.toString() !== sesionId);
    await plantilla.save();

    const plantillaActualizada = await PlantillaSemanal.findById(plantilla._id)
      .populate('creadoPor', 'nombre')
      .populate('sesiones.entrenador', 'nombre')
      .populate('sesiones.cliente', 'nombre apellido');

    res.json(plantillaActualizada);
  } catch (error) {
    console.error('Error al eliminar sesión:', error);
    res.status(500).json({ mensaje: 'Error al eliminar sesión' });
  }
};

// Actualizar sesión de una plantilla
export const actualizarSesion = async (req, res) => {
  try {
    const { sesionId } = req.params;
    const actualizaciones = req.body;

    const plantilla = await PlantillaSemanal.findById(req.params.id);

    if (!plantilla) {
      return res.status(404).json({ mensaje: 'Plantilla no encontrada' });
    }

    const sesionIndex = plantilla.sesiones.findIndex(s => s._id.toString() === sesionId);

    if (sesionIndex === -1) {
      return res.status(404).json({ mensaje: 'Sesión no encontrada' });
    }

    // Actualizar campos de la sesión
    Object.keys(actualizaciones).forEach(key => {
      if (key !== '_id') {
        plantilla.sesiones[sesionIndex][key] = actualizaciones[key];
      }
    });

    await plantilla.save();

    const plantillaActualizada = await PlantillaSemanal.findById(plantilla._id)
      .populate('creadoPor', 'nombre')
      .populate('sesiones.entrenador', 'nombre')
      .populate('sesiones.cliente', 'nombre apellido');

    res.json(plantillaActualizada);
  } catch (error) {
    console.error('Error al actualizar sesión:', error);
    res.status(500).json({ mensaje: 'Error al actualizar sesión' });
  }
};

// Preview de aplicar plantilla a una semana específica
export const previewSemana = async (req, res) => {
  try {
    const { fechaLunes } = req.query;

    if (!fechaLunes) {
      return res.status(400).json({ mensaje: 'Se requiere fechaLunes' });
    }

    const plantilla = await PlantillaSemanal.findById(req.params.id)
      .populate('sesiones.entrenador', 'nombre')
      .populate('sesiones.cliente', 'nombre apellido');

    if (!plantilla) {
      return res.status(404).json({ mensaje: 'Plantilla no encontrada' });
    }

    const lunes = new Date(fechaLunes);
    lunes.setHours(0, 0, 0, 0);

    const sesionesACrear = [];
    const conflictos = [];

    for (const sesion of plantilla.sesiones) {
      // Solo considerar sesiones con cliente asignado
      if (!sesion.cliente) continue;

      // Calcular la fecha real
      const fechaSesion = new Date(lunes);
      fechaSesion.setDate(lunes.getDate() + (sesion.diaSemana - 1));

      const infoSesion = {
        entrenador: sesion.entrenador,
        cliente: sesion.cliente,
        fecha: fechaSesion,
        horaInicio: sesion.horaInicio,
        horaFin: sesion.horaFin,
        tipoSesion: sesion.tipoSesion,
        duracion: sesion.duracion
      };

      // Verificar conflicto
      const reservaExistente = await Reserva.findOne({
        entrenador: sesion.entrenador._id || sesion.entrenador,
        fecha: fechaSesion,
        horaInicio: sesion.horaInicio,
        estado: { $ne: 'cancelada' }
      });

      if (reservaExistente) {
        conflictos.push({
          ...infoSesion,
          motivo: 'Ya existe reserva en este horario'
        });
      } else {
        sesionesACrear.push(infoSesion);
      }
    }

    res.json({
      plantillaId: plantilla._id,
      fechaLunes,
      totalSesiones: plantilla.sesiones.filter(s => s.cliente).length,
      sesionesACrear,
      conflictos,
      resumen: {
        sinConflicto: sesionesACrear.length,
        conConflicto: conflictos.length
      }
    });
  } catch (error) {
    console.error('Error en preview de semana:', error);
    res.status(500).json({ mensaje: 'Error al obtener preview' });
  }
};

// Aplicar plantilla a una semana específica
export const aplicarPlantillaASemana = async (req, res) => {
  try {
    const { fechaLunes, omitirConflictos = true } = req.body;

    if (!fechaLunes) {
      return res.status(400).json({ mensaje: 'Se requiere fechaLunes' });
    }

    const plantilla = await PlantillaSemanal.findById(req.params.id)
      .populate('sesiones.entrenador', 'nombre')
      .populate('sesiones.cliente', 'nombre apellido');

    if (!plantilla) {
      return res.status(404).json({ mensaje: 'Plantilla no encontrada' });
    }

    if (plantilla.sesiones.length === 0) {
      return res.status(400).json({ mensaje: 'La plantilla no tiene sesiones definidas' });
    }

    const lunes = new Date(fechaLunes);
    lunes.setHours(0, 0, 0, 0);

    const reservasCreadas = [];
    const conflictos = [];
    const errores = [];

    for (const sesion of plantilla.sesiones) {
      // Solo crear reservas si hay cliente asignado
      if (!sesion.cliente) continue;

      // Calcular la fecha real
      const fechaSesion = new Date(lunes);
      fechaSesion.setDate(lunes.getDate() + (sesion.diaSemana - 1));

      // Verificar conflicto
      const reservaExistente = await Reserva.findOne({
        entrenador: sesion.entrenador._id || sesion.entrenador,
        fecha: fechaSesion,
        horaInicio: sesion.horaInicio,
        estado: { $ne: 'cancelada' }
      });

      if (reservaExistente) {
        conflictos.push({
          fecha: fechaSesion.toLocaleDateString('es-ES'),
          hora: sesion.horaInicio,
          cliente: `${sesion.cliente.nombre} ${sesion.cliente.apellido || ''}`,
          motivo: 'Ya existe reserva'
        });

        if (!omitirConflictos) {
          return res.status(400).json({
            mensaje: 'Hay conflictos de horario',
            conflictos
          });
        }
        continue;
      }

      try {
        const nuevaReserva = new Reserva({
          cliente: sesion.cliente._id || sesion.cliente,
          entrenador: sesion.entrenador._id || sesion.entrenador,
          fecha: fechaSesion,
          horaInicio: sesion.horaInicio,
          horaFin: sesion.horaFin,
          tipoSesion: sesion.tipoSesion,
          estado: 'confirmada',
          duracion: sesion.duracion,
          notas: sesion.notas || '',
          origen: 'plantilla',
          plantillaOrigen: plantilla._id,
          esPlanificada: true
        });

        await nuevaReserva.save();
        reservasCreadas.push(nuevaReserva);

        // Notificar al entrenador
        await crearNotificacion(
          sesion.entrenador._id || sesion.entrenador,
          'reserva_creada',
          'Nueva sesion planificada',
          `Sesion con ${sesion.cliente.nombre} ${sesion.cliente.apellido || ''} para el ${fechaSesion.toLocaleDateString('es-ES')} a las ${sesion.horaInicio}`,
          { tipo: 'reserva', id: nuevaReserva._id }
        );
      } catch (err) {
        errores.push({
          fecha: fechaSesion.toLocaleDateString('es-ES'),
          hora: sesion.horaInicio,
          error: err.message
        });
      }
    }

    res.json({
      mensaje: `Se crearon ${reservasCreadas.length} reservas`,
      reservasCreadas: reservasCreadas.length,
      conflictosOmitidos: conflictos.length,
      errores: errores.length > 0 ? errores : undefined,
      conflictos: conflictos.length > 0 ? conflictos : undefined
    });
  } catch (error) {
    console.error('Error al aplicar plantilla a semana:', error);
    res.status(500).json({ mensaje: 'Error al aplicar plantilla' });
  }
};
