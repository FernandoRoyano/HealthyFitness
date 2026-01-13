import express from 'express';
import {
  registrarUsuario,
  loginUsuario,
  obtenerPerfil
} from '../controllers/authController.js';
import { proteger } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/registro', registrarUsuario);
router.post('/login', loginUsuario);
router.get('/perfil', proteger, obtenerPerfil);

export default router;
