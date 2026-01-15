import express from 'express';
import {
  obtenerPlantillas,
  obtenerPlantillaPorId,
  obtenerPlantillaBase,
  crearPlantilla,
  actualizarPlantilla,
  eliminarPlantilla,
  duplicarPlantilla,
  aplicarPlantilla,
  añadirSesion,
  eliminarSesion,
  actualizarSesion
} from '../controllers/plantillaController.js';
import { proteger, esGerente } from '../middleware/authMiddleware.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(proteger);

// Rutas de consulta (accesibles para todos los usuarios autenticados)
router.get('/', obtenerPlantillas);
router.get('/base/:mes/:año', obtenerPlantillaBase);
router.get('/:id', obtenerPlantillaPorId);

// Rutas de modificación (solo gerente)
router.post('/', esGerente, crearPlantilla);
router.put('/:id', esGerente, actualizarPlantilla);
router.delete('/:id', esGerente, eliminarPlantilla);

// Rutas especiales (solo gerente)
router.post('/:id/duplicar', esGerente, duplicarPlantilla);
router.post('/:id/aplicar', esGerente, aplicarPlantilla);

// Rutas para gestionar sesiones dentro de plantillas (solo gerente)
router.post('/:id/sesiones', esGerente, añadirSesion);
router.put('/:id/sesiones/:sesionId', esGerente, actualizarSesion);
router.delete('/:id/sesiones/:sesionId', esGerente, eliminarSesion);

export default router;
