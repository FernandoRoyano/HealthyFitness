import Ejercicio from '../models/Ejercicio.js';
import Rutina from '../models/Rutina.js';
import Cliente from '../models/Cliente.js';

// ==================== EJERCICIOS ====================

export const obtenerEjercicios = async (req, res) => {
  try {
    const { grupoMuscular, categoria, dificultad, busqueda, activo } = req.query;
    const filtro = {};

    if (grupoMuscular) filtro.grupoMuscular = grupoMuscular;
    if (categoria) filtro.categoria = categoria;
    if (dificultad) filtro.dificultad = dificultad;
    if (activo !== undefined) filtro.activo = activo === 'true';
    else filtro.activo = true;

    if (busqueda) {
      filtro.$or = [
        { nombre: { $regex: busqueda, $options: 'i' } },
        { descripcion: { $regex: busqueda, $options: 'i' } }
      ];
    }

    const ejercicios = await Ejercicio.find(filtro)
      .sort({ grupoMuscular: 1, nombre: 1 });

    res.json(ejercicios);
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al obtener ejercicios',
      error: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
};

export const obtenerEjercicioPorId = async (req, res) => {
  try {
    const ejercicio = await Ejercicio.findById(req.params.id);
    if (!ejercicio) {
      return res.status(404).json({ mensaje: 'Ejercicio no encontrado' });
    }
    res.json(ejercicio);
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al obtener ejercicio',
      error: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
};

export const crearEjercicio = async (req, res) => {
  try {
    const { nombre, descripcion, grupoMuscular, grupoMuscularSecundario,
      categoria, dificultad, equipamiento, instrucciones, videoUrl } = req.body;

    const ejercicio = await Ejercicio.create({
      nombre, descripcion, grupoMuscular, grupoMuscularSecundario,
      categoria, dificultad, equipamiento, instrucciones, videoUrl,
      creadoPor: req.usuario._id
    });

    res.status(201).json(ejercicio);
  } catch (error) {
    res.status(400).json({
      mensaje: 'Error al crear ejercicio',
      error: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
};

export const actualizarEjercicio = async (req, res) => {
  try {
    const ejercicio = await Ejercicio.findById(req.params.id);
    if (!ejercicio) {
      return res.status(404).json({ mensaje: 'Ejercicio no encontrado' });
    }

    const camposEditables = [
      'nombre', 'descripcion', 'grupoMuscular', 'grupoMuscularSecundario',
      'categoria', 'dificultad', 'equipamiento', 'instrucciones', 'videoUrl', 'activo'
    ];
    const camposPermitidos = {};
    for (const campo of camposEditables) {
      if (req.body[campo] !== undefined) camposPermitidos[campo] = req.body[campo];
    }

    const ejercicioActualizado = await Ejercicio.findByIdAndUpdate(
      req.params.id,
      camposPermitidos,
      { new: true, runValidators: true }
    );

    res.json(ejercicioActualizado);
  } catch (error) {
    res.status(400).json({
      mensaje: 'Error al actualizar ejercicio',
      error: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
};

export const eliminarEjercicio = async (req, res) => {
  try {
    const ejercicio = await Ejercicio.findById(req.params.id);
    if (!ejercicio) {
      return res.status(404).json({ mensaje: 'Ejercicio no encontrado' });
    }

    await Ejercicio.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Ejercicio eliminado correctamente' });
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al eliminar ejercicio',
      error: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
};

// ==================== RUTINAS ====================

export const obtenerRutinas = async (req, res) => {
  try {
    const { cliente, esPlantilla, activa } = req.query;
    const filtro = {};

    if (cliente) filtro.cliente = cliente;
    if (esPlantilla !== undefined) filtro.esPlantilla = esPlantilla === 'true';
    if (activa !== undefined) filtro.activa = activa === 'true';

    // Entrenadores solo ven sus propias rutinas
    if (req.usuario.rol === 'entrenador') {
      filtro.entrenador = req.usuario._id;
    }

    const rutinas = await Rutina.find(filtro)
      .populate('cliente', 'nombre apellido')
      .populate('entrenador', 'nombre')
      .select('-dias')
      .sort({ createdAt: -1 });

    res.json(rutinas);
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al obtener rutinas',
      error: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
};

export const obtenerRutinasPorCliente = async (req, res) => {
  try {
    const { clienteId } = req.params;
    const filtro = { cliente: clienteId };

    if (req.usuario.rol === 'entrenador') {
      filtro.entrenador = req.usuario._id;
    }

    const rutinas = await Rutina.find(filtro)
      .populate('entrenador', 'nombre')
      .populate('dias.ejercicios.ejercicio', 'nombre grupoMuscular categoria')
      .sort({ activa: -1, createdAt: -1 });

    res.json(rutinas);
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al obtener rutinas del cliente',
      error: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
};

export const obtenerPlantillas = async (req, res) => {
  try {
    const filtro = { esPlantilla: true };

    if (req.usuario.rol === 'entrenador') {
      filtro.entrenador = req.usuario._id;
    }

    const plantillas = await Rutina.find(filtro)
      .populate('entrenador', 'nombre')
      .populate('dias.ejercicios.ejercicio', 'nombre grupoMuscular')
      .sort({ createdAt: -1 });

    res.json(plantillas);
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al obtener plantillas',
      error: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
};

export const obtenerRutinaPorId = async (req, res) => {
  try {
    const rutina = await Rutina.findById(req.params.id)
      .populate('cliente', 'nombre apellido email')
      .populate('entrenador', 'nombre')
      .populate('dias.ejercicios.ejercicio');

    if (!rutina) {
      return res.status(404).json({ mensaje: 'Rutina no encontrada' });
    }

    // Verificar acceso: entrenador solo ve sus rutinas
    if (req.usuario.rol === 'entrenador' && rutina.entrenador._id.toString() !== req.usuario._id.toString()) {
      return res.status(403).json({ mensaje: 'No tienes acceso a esta rutina' });
    }

    res.json(rutina);
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al obtener rutina',
      error: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
};

export const crearRutina = async (req, res) => {
  try {
    const { nombre, descripcion, cliente, objetivo, dificultad,
      diasPorSemana, dias, esPlantilla, fechaInicio, fechaFin } = req.body;

    // Si se asigna a un cliente y se marca como activa, desactivar otras rutinas activas
    if (cliente && !esPlantilla) {
      await Rutina.updateMany(
        { cliente, activa: true },
        { activa: false }
      );
    }

    const rutina = await Rutina.create({
      nombre, descripcion, cliente: esPlantilla ? null : cliente,
      entrenador: req.usuario._id, objetivo, dificultad,
      diasPorSemana, dias: dias || [], esPlantilla: esPlantilla || false,
      activa: !esPlantilla, fechaInicio, fechaFin
    });

    const rutinaPopulada = await Rutina.findById(rutina._id)
      .populate('cliente', 'nombre apellido')
      .populate('entrenador', 'nombre')
      .populate('dias.ejercicios.ejercicio');

    res.status(201).json(rutinaPopulada);
  } catch (error) {
    res.status(400).json({
      mensaje: 'Error al crear rutina',
      error: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
};

export const actualizarRutina = async (req, res) => {
  try {
    const rutina = await Rutina.findById(req.params.id);
    if (!rutina) {
      return res.status(404).json({ mensaje: 'Rutina no encontrada' });
    }

    if (req.usuario.rol === 'entrenador' && rutina.entrenador.toString() !== req.usuario._id.toString()) {
      return res.status(403).json({ mensaje: 'No tienes acceso a esta rutina' });
    }

    const camposEditables = [
      'nombre', 'descripcion', 'cliente', 'objetivo', 'dificultad',
      'diasPorSemana', 'dias', 'activa', 'esPlantilla', 'fechaInicio', 'fechaFin'
    ];
    const camposPermitidos = {};
    for (const campo of camposEditables) {
      if (req.body[campo] !== undefined) camposPermitidos[campo] = req.body[campo];
    }

    // Si se activa, desactivar otras rutinas del mismo cliente
    if (camposPermitidos.activa === true && rutina.cliente) {
      await Rutina.updateMany(
        { cliente: rutina.cliente, _id: { $ne: rutina._id }, activa: true },
        { activa: false }
      );
    }

    const rutinaActualizada = await Rutina.findByIdAndUpdate(
      req.params.id,
      camposPermitidos,
      { new: true, runValidators: true }
    )
      .populate('cliente', 'nombre apellido')
      .populate('entrenador', 'nombre')
      .populate('dias.ejercicios.ejercicio');

    res.json(rutinaActualizada);
  } catch (error) {
    res.status(400).json({
      mensaje: 'Error al actualizar rutina',
      error: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
};

export const eliminarRutina = async (req, res) => {
  try {
    const rutina = await Rutina.findById(req.params.id);
    if (!rutina) {
      return res.status(404).json({ mensaje: 'Rutina no encontrada' });
    }

    if (req.usuario.rol === 'entrenador' && rutina.entrenador.toString() !== req.usuario._id.toString()) {
      return res.status(403).json({ mensaje: 'No tienes acceso a esta rutina' });
    }

    await Rutina.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Rutina eliminada correctamente' });
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al eliminar rutina',
      error: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
};

export const duplicarRutina = async (req, res) => {
  try {
    const rutinaOriginal = await Rutina.findById(req.params.id)
      .populate('dias.ejercicios.ejercicio');

    if (!rutinaOriginal) {
      return res.status(404).json({ mensaje: 'Rutina no encontrada' });
    }

    const { cliente, esPlantilla, nombre } = req.body;

    // Si se asigna a un cliente, desactivar sus rutinas activas
    if (cliente && !esPlantilla) {
      await Rutina.updateMany(
        { cliente, activa: true },
        { activa: false }
      );
    }

    const nuevaRutina = await Rutina.create({
      nombre: nombre || `${rutinaOriginal.nombre} (copia)`,
      descripcion: rutinaOriginal.descripcion,
      cliente: esPlantilla ? null : (cliente || null),
      entrenador: req.usuario._id,
      objetivo: rutinaOriginal.objetivo,
      dificultad: rutinaOriginal.dificultad,
      diasPorSemana: rutinaOriginal.diasPorSemana,
      dias: rutinaOriginal.dias.map(dia => ({
        nombre: dia.nombre,
        orden: dia.orden,
        notas: dia.notas,
        ejercicios: dia.ejercicios.map(ej => ({
          ejercicio: ej.ejercicio._id || ej.ejercicio,
          orden: ej.orden,
          series: ej.series,
          repeticiones: ej.repeticiones,
          descansoSegundos: ej.descansoSegundos,
          peso: ej.peso,
          tempo: ej.tempo,
          notas: ej.notas,
          esSuperset: ej.esSuperset,
          grupoSuperset: ej.grupoSuperset
        }))
      })),
      esPlantilla: esPlantilla || false,
      activa: !esPlantilla
    });

    const rutinaPopulada = await Rutina.findById(nuevaRutina._id)
      .populate('cliente', 'nombre apellido')
      .populate('entrenador', 'nombre')
      .populate('dias.ejercicios.ejercicio');

    res.status(201).json(rutinaPopulada);
  } catch (error) {
    res.status(400).json({
      mensaje: 'Error al duplicar rutina',
      error: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
};
