import MedicionCorporal from '../models/MedicionCorporal.js';

// Obtener mediciones de un cliente
export const obtenerMedicionesPorCliente = async (req, res) => {
  try {
    const { clienteId } = req.params;
    const mediciones = await MedicionCorporal.find({ cliente: clienteId })
      .sort({ fecha: -1 })
      .populate('registradoPor', 'nombre email');

    res.json(mediciones);
  } catch (error) {
    console.error('Error al obtener mediciones:', error);
    res.status(500).json({ mensaje: 'Error al obtener mediciones' });
  }
};

// Crear nueva medicion
export const crearMedicion = async (req, res) => {
  try {
    const { clienteId } = req.params;
    const {
      fecha,
      peso,
      altura,
      pecho,
      cintura,
      cadera,
      brazo,
      muslo,
      grasaCorporal,
      masaMuscular,
      agua,
      grasaVisceral,
      notas
    } = req.body;

    const medicion = new MedicionCorporal({
      cliente: clienteId,
      fecha: fecha || new Date(),
      peso,
      altura,
      pecho,
      cintura,
      cadera,
      brazo,
      muslo,
      grasaCorporal,
      masaMuscular,
      agua,
      grasaVisceral,
      notas,
      registradoPor: req.usuario._id
    });

    await medicion.save();

    const medicionPopulada = await MedicionCorporal.findById(medicion._id)
      .populate('registradoPor', 'nombre email');

    res.status(201).json(medicionPopulada);
  } catch (error) {
    console.error('Error al crear medicion:', error);
    res.status(500).json({ mensaje: 'Error al crear medicion' });
  }
};

// Actualizar medicion
export const actualizarMedicion = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      fecha,
      peso,
      altura,
      pecho,
      cintura,
      cadera,
      brazo,
      muslo,
      grasaCorporal,
      masaMuscular,
      agua,
      grasaVisceral,
      notas
    } = req.body;

    const medicion = await MedicionCorporal.findById(id);

    if (!medicion) {
      return res.status(404).json({ mensaje: 'Medicion no encontrada' });
    }

    // Actualizar campos
    if (fecha) medicion.fecha = fecha;
    if (peso !== undefined) medicion.peso = peso;
    if (altura !== undefined) medicion.altura = altura;
    if (pecho !== undefined) medicion.pecho = pecho;
    if (cintura !== undefined) medicion.cintura = cintura;
    if (cadera !== undefined) medicion.cadera = cadera;
    if (brazo !== undefined) medicion.brazo = brazo;
    if (muslo !== undefined) medicion.muslo = muslo;
    if (grasaCorporal !== undefined) medicion.grasaCorporal = grasaCorporal;
    if (masaMuscular !== undefined) medicion.masaMuscular = masaMuscular;
    if (agua !== undefined) medicion.agua = agua;
    if (grasaVisceral !== undefined) medicion.grasaVisceral = grasaVisceral;
    if (notas !== undefined) medicion.notas = notas;

    await medicion.save();

    const medicionPopulada = await MedicionCorporal.findById(medicion._id)
      .populate('registradoPor', 'nombre email');

    res.json(medicionPopulada);
  } catch (error) {
    console.error('Error al actualizar medicion:', error);
    res.status(500).json({ mensaje: 'Error al actualizar medicion' });
  }
};

// Eliminar medicion
export const eliminarMedicion = async (req, res) => {
  try {
    const { id } = req.params;

    const medicion = await MedicionCorporal.findById(id);

    if (!medicion) {
      return res.status(404).json({ mensaje: 'Medicion no encontrada' });
    }

    await MedicionCorporal.findByIdAndDelete(id);

    res.json({ mensaje: 'Medicion eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar medicion:', error);
    res.status(500).json({ mensaje: 'Error al eliminar medicion' });
  }
};

// Obtener ultima medicion de un cliente
export const obtenerUltimaMedicion = async (req, res) => {
  try {
    const { clienteId } = req.params;
    const medicion = await MedicionCorporal.findOne({ cliente: clienteId })
      .sort({ fecha: -1 })
      .populate('registradoPor', 'nombre email');

    if (!medicion) {
      return res.status(404).json({ mensaje: 'No hay mediciones registradas' });
    }

    res.json(medicion);
  } catch (error) {
    console.error('Error al obtener ultima medicion:', error);
    res.status(500).json({ mensaje: 'Error al obtener ultima medicion' });
  }
};
