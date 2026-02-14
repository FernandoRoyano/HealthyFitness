import jwt from 'jsonwebtoken';
import Cliente from '../models/Cliente.js';

// Generar token con tipo 'cliente' para diferenciarlo del token de usuarios
const generarTokenCliente = (id) => {
  return jwt.sign({ id, tipo: 'cliente' }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// Login de cliente al portal
export const loginCliente = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Buscar cliente por email e incluir el campo portalPassword
    const cliente = await Cliente.findOne({ email }).select('+portalPassword');

    if (!cliente) {
      return res.status(401).json({ mensaje: 'Email o contraseña incorrectos' });
    }

    // Verificar que el portal esté activo
    if (!cliente.portalActivo) {
      return res.status(401).json({ mensaje: 'El acceso al portal no está habilitado para este cliente' });
    }

    // Verificar que tenga password configurado
    if (!cliente.portalPassword) {
      return res.status(401).json({ mensaje: 'Este cliente no tiene credenciales de acceso configuradas' });
    }

    // Verificar contraseña
    const passwordValido = await cliente.matchPassword(password);
    if (!passwordValido) {
      return res.status(401).json({ mensaje: 'Email o contraseña incorrectos' });
    }

    // Actualizar último acceso
    cliente.ultimoAcceso = new Date();
    await cliente.save();

    res.json({
      _id: cliente._id,
      nombre: cliente.nombre,
      apellido: cliente.apellido,
      email: cliente.email,
      foto: cliente.foto,
      token: generarTokenCliente(cliente._id)
    });
  } catch (error) {
    res.status(400).json({ mensaje: 'Error al iniciar sesión', error: process.env.NODE_ENV !== 'production' ? error.message : undefined });
  }
};

// Obtener perfil del cliente autenticado
export const obtenerPerfilCliente = async (req, res) => {
  try {
    const cliente = await Cliente.findById(req.cliente._id)
      .select('-portalPassword -tokenRecuperacion -tokenExpiracion')
      .populate('entrenador', 'nombre email telefono foto');

    res.json(cliente);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener perfil', error: process.env.NODE_ENV !== 'production' ? error.message : undefined });
  }
};

// Cambiar contraseña del cliente
export const cambiarPasswordCliente = async (req, res) => {
  try {
    const { passwordActual, passwordNuevo } = req.body;

    if (!passwordActual || !passwordNuevo) {
      return res.status(400).json({ mensaje: 'Se requiere la contraseña actual y la nueva' });
    }

    if (passwordNuevo.length < 6) {
      return res.status(400).json({ mensaje: 'La nueva contraseña debe tener al menos 6 caracteres' });
    }

    // Obtener cliente con password
    const cliente = await Cliente.findById(req.cliente._id).select('+portalPassword');

    // Verificar contraseña actual
    const passwordValido = await cliente.matchPassword(passwordActual);
    if (!passwordValido) {
      return res.status(401).json({ mensaje: 'La contraseña actual es incorrecta' });
    }

    // Actualizar contraseña
    cliente.portalPassword = passwordNuevo;
    await cliente.save();

    res.json({ mensaje: 'Contraseña actualizada correctamente' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al cambiar contraseña', error: process.env.NODE_ENV !== 'production' ? error.message : undefined });
  }
};

// Crear o actualizar acceso al portal para un cliente (usado por gerente/entrenador)
export const crearAccesoPortal = async (req, res) => {
  try {
    const { clienteId } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ mensaje: 'La contraseña debe tener al menos 6 caracteres' });
    }

    const cliente = await Cliente.findById(clienteId);
    if (!cliente) {
      return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    }

    // Establecer password y activar portal
    cliente.portalPassword = password;
    cliente.portalActivo = true;
    await cliente.save();

    res.json({
      mensaje: 'Acceso al portal creado correctamente',
      email: cliente.email,
      portalActivo: true
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al crear acceso al portal', error: process.env.NODE_ENV !== 'production' ? error.message : undefined });
  }
};

// Desactivar acceso al portal para un cliente
export const desactivarAccesoPortal = async (req, res) => {
  try {
    const { clienteId } = req.params;

    const cliente = await Cliente.findById(clienteId);
    if (!cliente) {
      return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    }

    cliente.portalActivo = false;
    await cliente.save();

    res.json({
      mensaje: 'Acceso al portal desactivado',
      portalActivo: false
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al desactivar acceso', error: process.env.NODE_ENV !== 'production' ? error.message : undefined });
  }
};

// Verificar estado del portal de un cliente
export const verificarEstadoPortal = async (req, res) => {
  try {
    const { clienteId } = req.params;

    const cliente = await Cliente.findById(clienteId).select('portalActivo ultimoAcceso email');
    if (!cliente) {
      return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    }

    res.json({
      portalActivo: cliente.portalActivo,
      ultimoAcceso: cliente.ultimoAcceso,
      email: cliente.email
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al verificar estado', error: process.env.NODE_ENV !== 'production' ? error.message : undefined });
  }
};
