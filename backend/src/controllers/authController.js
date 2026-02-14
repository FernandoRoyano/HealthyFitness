import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const generarToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

export const registrarUsuario = async (req, res) => {
  try {
    const { nombre, email, password } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({ mensaje: 'Nombre, email y contraseña son requeridos' });
    }

    if (password.length < 6) {
      return res.status(400).json({ mensaje: 'La contraseña debe tener al menos 6 caracteres' });
    }

    const usuarioExiste = await User.findOne({ email });
    if (usuarioExiste) {
      return res.status(400).json({ mensaje: 'El usuario ya existe' });
    }

    // Solo se permiten los campos explícitos, rol forzado a 'entrenador'
    const usuario = await User.create({ nombre, email, password, rol: 'entrenador' });

    res.status(201).json({
      _id: usuario._id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
      token: generarToken(usuario._id)
    });
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    res.status(400).json({ mensaje: 'Error al registrar usuario' });
  }
};

export const loginUsuario = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ mensaje: 'Email y contraseña son requeridos' });
    }

    const usuario = await User.findOne({ email }).select('+password');

    if (usuario && (await usuario.matchPassword(password))) {
      res.json({
        _id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        token: generarToken(usuario._id)
      });
    } else {
      res.status(401).json({ mensaje: 'Email o contraseña incorrectos' });
    }
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    res.status(400).json({ mensaje: 'Error al iniciar sesión' });
  }
};

export const obtenerPerfil = async (req, res) => {
  try {
    const usuario = await User.findById(req.usuario._id).select('-password');
    res.json(usuario);
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ mensaje: 'Error al obtener perfil' });
  }
};
