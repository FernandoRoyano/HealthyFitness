import Vacacion from '../models/Vacacion.js';

/**
 * Verifica si un entrenador tiene vacaciones aprobadas en una fecha específica.
 * @param {string} entrenadorId - ID del entrenador
 * @param {Date|string} fecha - Fecha a consultar
 * @returns {Promise<Object|null>} La vacación encontrada o null
 */
export const verificarVacacionesEnFecha = async (entrenadorId, fecha) => {
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
