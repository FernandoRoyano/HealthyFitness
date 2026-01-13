import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const generarToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

export const registrarUsuario = async (req, res) => {
  try {
    const { email } = req.body;

    const usuarioExiste = await User.findOne({ email });
    if (usuarioExiste) {
      return res.status(400).json({ mensaje: 'El usuario ya existe' });
    }

    const usuario = await User.create(req.body);

    res.status(201).json({
      _id: usuario._id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
      token: generarToken(usuario._id)
    });
  } catch (error) {
    res.status(400).json({ mensaje: 'Error al registrar usuario', error: error.message });
  }
};

export const loginUsuario = async (req, res) => {
  try {
    const { email, password } = req.body;

    const usuario = await User.findOne({ email });

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
    res.status(400).json({ mensaje: 'Error al iniciar sesión', error: error.message });
  }
};

export const obtenerPerfil = async (req, res) => {
  try {
    const usuario = await User.findById(req.user._id).select('-password');
    res.json(usuario);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener perfil', error: error.message });
  }
};
