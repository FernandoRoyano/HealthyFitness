import User from '../models/User.js';
import Cliente from '../models/Cliente.js';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsPath = path.join(__dirname, '../../uploads');

export const obtenerEntrenadores = async (req, res) => {
  try {
    const entrenadores = await User.find({ rol: 'entrenador', activo: true })
      .select('-password')
      .sort({ nombre: 1 });
    res.json(entrenadores);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener entrenadores', error: error.message });
  }
};

export const obtenerUsuarios = async (req, res) => {
  try {
    const usuarios = await User.find({ activo: true })
      .select('-password')
      .sort({ nombre: 1 });
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener usuarios', error: error.message });
  }
};

export const actualizarEntrenador = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, email, telefono } = req.body;

    const entrenador = await User.findById(id);
    if (!entrenador) {
      return res.status(404).json({ mensaje: 'Entrenador no encontrado' });
    }

    if (entrenador.rol !== 'entrenador') {
      return res.status(400).json({ mensaje: 'El usuario no es un entrenador' });
    }

    if (email && email !== entrenador.email) {
      const emailExiste = await User.findOne({ email });
      if (emailExiste) {
        return res.status(400).json({ mensaje: 'El email ya está registrado' });
      }
    }

    entrenador.nombre = nombre || entrenador.nombre;
    entrenador.email = email || entrenador.email;
    entrenador.telefono = telefono || entrenador.telefono;

    await entrenador.save();

    res.json({
      _id: entrenador._id,
      nombre: entrenador.nombre,
      email: entrenador.email,
      telefono: entrenador.telefono,
      rol: entrenador.rol
    });
  } catch (error) {
    res.status(400).json({ mensaje: 'Error al actualizar entrenador', error: error.message });
  }
};

export const obtenerClientesPorEntrenador = async (req, res) => {
  try {
    const { id } = req.params;

    const entrenador = await User.findById(id);
    if (!entrenador) {
      return res.status(404).json({ mensaje: 'Entrenador no encontrado' });
    }

    const clientes = await Cliente.find({ entrenador: id })
      .populate('entrenador', 'nombre email')
      .sort({ nombre: 1 });

    res.json(clientes);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener clientes del entrenador', error: error.message });
  }
};

export const crearEntrenador = async (req, res) => {
  try {
    const { nombre, email, telefono, password } = req.body;

    // Validar que el usuario que hace la petición es gerente
    if (req.user.rol !== 'gerente') {
      return res.status(403).json({ mensaje: 'No tienes permisos para crear entrenadores' });
    }

    // Verificar si el email ya existe
    const usuarioExiste = await User.findOne({ email });
    if (usuarioExiste) {
      return res.status(400).json({ mensaje: 'El email ya está registrado' });
    }

    // Crear entrenador (el hook pre-save del modelo se encargará del hash)
    const entrenador = await User.create({
      nombre,
      email,
      telefono,
      password,
      rol: 'entrenador',
      activo: true
    });

    res.status(201).json({
      _id: entrenador._id,
      nombre: entrenador.nombre,
      email: entrenador.email,
      telefono: entrenador.telefono,
      rol: entrenador.rol
    });
  } catch (error) {
    res.status(400).json({ mensaje: 'Error al crear entrenador', error: error.message });
  }
};

export const reasignarClientes = async (req, res) => {
  try {
    const { entrenadorOrigenId, entrenadorDestinoId } = req.body;

    if (!entrenadorOrigenId || !entrenadorDestinoId) {
      return res.status(400).json({ mensaje: 'Se requieren ambos IDs de entrenadores' });
    }

    const [entrenadorOrigen, entrenadorDestino] = await Promise.all([
      User.findById(entrenadorOrigenId),
      User.findById(entrenadorDestinoId)
    ]);

    if (!entrenadorOrigen || !entrenadorDestino) {
      return res.status(404).json({ mensaje: 'Uno o ambos entrenadores no encontrados' });
    }

    if (entrenadorOrigen.rol !== 'entrenador' || entrenadorDestino.rol !== 'entrenador') {
      return res.status(400).json({ mensaje: 'Ambos usuarios deben ser entrenadores' });
    }

    const resultado = await Cliente.updateMany(
      { entrenador: entrenadorOrigenId },
      { entrenador: entrenadorDestinoId }
    );

    res.json({
      mensaje: 'Clientes reasignados correctamente',
      clientesActualizados: resultado.modifiedCount
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al reasignar clientes', error: error.message });
  }
};

export const resetearPasswordEntrenador = async (req, res) => {
  try {
    const { id } = req.params;
    const { nuevaPassword } = req.body;

    // Validar que el usuario que hace la petición es gerente
    if (req.user.rol !== 'gerente') {
      return res.status(403).json({ mensaje: 'No tienes permisos para resetear contraseñas' });
    }

    if (!nuevaPassword || nuevaPassword.length < 6) {
      return res.status(400).json({ mensaje: 'La contraseña debe tener al menos 6 caracteres' });
    }

    const entrenador = await User.findById(id);
    if (!entrenador) {
      return res.status(404).json({ mensaje: 'Entrenador no encontrado' });
    }

    if (entrenador.rol !== 'entrenador') {
      return res.status(400).json({ mensaje: 'El usuario no es un entrenador' });
    }

    // El hook pre('save') del modelo se encargará del hash automáticamente
    entrenador.password = nuevaPassword;
    await entrenador.save();

    res.json({
      mensaje: 'Contraseña actualizada correctamente',
      entrenador: {
        _id: entrenador._id,
        nombre: entrenador.nombre,
        email: entrenador.email
      }
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al resetear contraseña', error: error.message });
  }
};

// Configuración de Multer para imágenes de usuarios
const userImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(uploadsPath)) {
      fs.mkdirSync(uploadsPath, { recursive: true });
    }
    cb(null, uploadsPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `user-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const userImageUpload = multer({
  storage: userImageStorage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes (JPEG, PNG, WebP)'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB máximo
  }
});

export const userImageUploadMiddleware = userImageUpload.single('foto');

export const subirFotoEntrenador = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ mensaje: 'No se proporcionó ninguna imagen' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    // Si ya tiene foto, eliminar la anterior
    if (user.foto) {
      const oldPhotoPath = path.join(uploadsPath, path.basename(user.foto));
      if (fs.existsSync(oldPhotoPath)) {
        fs.unlinkSync(oldPhotoPath);
      }
    }

    const fotoUrl = `/uploads/${req.file.filename}`;
    user.foto = fotoUrl;
    await user.save();

    res.json({
      mensaje: 'Foto subida correctamente',
      foto: fotoUrl
    });
  } catch (error) {
    console.error('Error al subir foto:', error);
    res.status(500).json({
      mensaje: 'Error al subir la foto',
      error: error.message
    });
  }
};

export const eliminarFotoEntrenador = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    if (user.foto) {
      const photoPath = path.join(uploadsPath, path.basename(user.foto));
      if (fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath);
      }
      user.foto = undefined;
      await user.save();
    }

    res.json({ mensaje: 'Foto eliminada correctamente' });
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al eliminar la foto',
      error: error.message
    });
  }
};
