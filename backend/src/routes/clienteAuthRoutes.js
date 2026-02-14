import express from 'express';
import {
  loginCliente,
  obtenerPerfilCliente,
  cambiarPasswordCliente,
  crearAccesoPortal,
  desactivarAccesoPortal,
  verificarEstadoPortal
} from '../controllers/clienteAuthController.js';
import { protegerCliente } from '../middleware/clienteAuthMiddleware.js';
import { proteger, esGerente } from '../middleware/authMiddleware.js';

const router = express.Router();

// Rutas públicas (login del cliente)
router.post('/login', loginCliente);

// Rutas protegidas para cliente autenticado
router.get('/perfil', protegerCliente, obtenerPerfilCliente);
router.put('/cambiar-password', protegerCliente, cambiarPasswordCliente);

// Rutas para administración del portal (solo gerente)
router.post('/crear-acceso/:clienteId', proteger, esGerente, crearAccesoPortal);
router.put('/desactivar/:clienteId', proteger, esGerente, desactivarAccesoPortal);
router.get('/estado/:clienteId', proteger, verificarEstadoPortal);

export default router;
