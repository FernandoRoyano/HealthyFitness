import express from 'express';
import {
  // Ejercicios
  obtenerEjercicios,
  obtenerEjercicioPorId,
  crearEjercicio,
  actualizarEjercicio,
  eliminarEjercicio,
  // Rutinas
  obtenerRutinas,
  obtenerRutinasPorCliente,
  obtenerPlantillas,
  obtenerRutinaPorId,
  crearRutina,
  actualizarRutina,
  eliminarRutina,
  duplicarRutina
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

// ==================== RUTINAS ====================
router.get('/rutinas', obtenerRutinas);
router.get('/rutinas/plantillas', obtenerPlantillas);
router.get('/rutinas/cliente/:clienteId', obtenerRutinasPorCliente);
router.get('/rutinas/:id', obtenerRutinaPorId);
router.post('/rutinas', crearRutina);
router.put('/rutinas/:id', actualizarRutina);
router.delete('/rutinas/:id', eliminarRutina);
router.post('/rutinas/:id/duplicar', duplicarRutina);

export default router;
