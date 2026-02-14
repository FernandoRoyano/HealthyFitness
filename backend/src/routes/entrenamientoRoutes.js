import express from 'express';
import {
  // Ejercicios
  obtenerEjercicios,
  obtenerEjercicioPorId,
  crearEjercicio,
  actualizarEjercicio,
  eliminarEjercicio,
  ejercicioImageUpload,
  subirImagenEjercicio,
  eliminarImagenEjercicio,
  // Rutinas
  obtenerRutinas,
  obtenerRutinasPorCliente,
  obtenerPlantillas,
  obtenerRutinaPorId,
  crearRutina,
  actualizarRutina,
  eliminarRutina,
  duplicarRutina,
  // Registros
  registrarEntrenamiento,
  obtenerRegistrosPorCliente,
  obtenerRegistroPorId,
  obtenerProgresoPorEjercicio,
  obtenerPRs
} from '../controllers/entrenamientoController.js';
import { proteger, esGerente } from '../middleware/authMiddleware.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(proteger);

// ==================== EJERCICIOS ====================
router.get('/ejercicios', obtenerEjercicios);
router.get('/ejercicios/:id', obtenerEjercicioPorId);
router.post('/ejercicios', esGerente, crearEjercicio);
router.put('/ejercicios/:id', esGerente, actualizarEjercicio);
router.delete('/ejercicios/:id', esGerente, eliminarEjercicio);
router.post('/ejercicios/:id/imagen', esGerente, ejercicioImageUpload, subirImagenEjercicio);
router.delete('/ejercicios/:id/imagen', esGerente, eliminarImagenEjercicio);

// ==================== RUTINAS ====================
router.get('/rutinas', obtenerRutinas);
router.get('/rutinas/plantillas', obtenerPlantillas);
router.get('/rutinas/cliente/:clienteId', obtenerRutinasPorCliente);
router.get('/rutinas/:id', obtenerRutinaPorId);
router.post('/rutinas', crearRutina);
router.put('/rutinas/:id', actualizarRutina);
router.delete('/rutinas/:id', eliminarRutina);
router.post('/rutinas/:id/duplicar', duplicarRutina);

// ==================== REGISTROS DE ENTRENAMIENTO ====================
router.post('/registros', registrarEntrenamiento);
router.get('/registros/cliente/:clienteId', obtenerRegistrosPorCliente);
router.get('/registros/:id', obtenerRegistroPorId);
router.get('/progreso/:clienteId/:ejercicioId', obtenerProgresoPorEjercicio);
router.get('/prs/:clienteId', obtenerPRs);

export default router;
