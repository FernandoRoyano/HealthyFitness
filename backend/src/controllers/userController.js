import User from '../models/User.js';
import Cliente from '../models/Cliente.js';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import { createImageUpload, eliminarFotoAnterior } from '../utils/uploadHelper.js';

export const obtenerEntrenadores = async (req, res) => {
  try {
    const entrenadores = await User.find({ rol: 'entrenador', activo: true })
      .select('-password')
      .sort({ nombre: 1 });
    res.json(entrenadores);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener entrenadores', error: process.env.NODE_ENV !== 'production' ? error.message : undefined });
  }
};

export const obtenerUsuarios = async (req, res) => {
  try {
    const usuarios = await User.find({ activo: true })
      .select('-password')
      .sort({ nombre: 1 });
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener usuarios', error: process.env.NODE_ENV !== 'production' ? error.message : undefined });
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
    res.status(400).json({ mensaje: 'Error al actualizar entrenador', error: process.env.NODE_ENV !== 'production' ? error.message : undefined });
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
    res.status(500).json({ mensaje: 'Error al obtener clientes del entrenador', error: process.env.NODE_ENV !== 'production' ? error.message : undefined });
  }
};

export const crearEntrenador = async (req, res) => {
  try {
    const { nombre, email, telefono, password } = req.body;

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
    res.status(400).json({ mensaje: 'Error al crear entrenador', error: process.env.NODE_ENV !== 'production' ? error.message : undefined });
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
    res.status(500).json({ mensaje: 'Error al reasignar clientes', error: process.env.NODE_ENV !== 'production' ? error.message : undefined });
  }
};

export const resetearPasswordEntrenador = async (req, res) => {
  try {
    const { id } = req.params;
    const { nuevaPassword } = req.body;

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
    res.status(500).json({ mensaje: 'Error al resetear contraseña', error: process.env.NODE_ENV !== 'production' ? error.message : undefined });
  }
};

export const userImageUploadMiddleware = createImageUpload('user');

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
    eliminarFotoAnterior(user.foto);

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
      error: process.env.NODE_ENV !== 'production' ? error.message : undefined
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
      eliminarFotoAnterior(user.foto);
      user.foto = undefined;
      await user.save();
    }

    res.json({ mensaje: 'Foto eliminada correctamente' });
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al eliminar la foto',
      error: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
};
