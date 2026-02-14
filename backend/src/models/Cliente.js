import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const clienteSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre es requerido'],
    trim: true
  },
  apellido: {
    type: String,
    required: [true, 'El apellido es requerido'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'El email es requerido'],
    unique: true,
    lowercase: true,
    trim: true
  },
  telefono: {
    type: String,
    required: [true, 'El teléfono es requerido'],
    trim: true
  },
  fechaNacimiento: {
    type: Date
  },
  genero: {
    type: String,
    enum: ['masculino', 'femenino', 'otro'],
    default: 'otro'
  },
  direccion: {
    type: String,
    trim: true
  },
  objetivos: {
    type: String,
    trim: true
  },
  condicionesMedicas: {
    type: String,
    trim: true
  },
  peso: {
    type: Number
  },
  altura: {
    type: Number
  },
  nivelActividad: {
    type: String,
    enum: ['sedentario', 'ligero', 'moderado', 'activo', 'muy-activo'],
    default: 'sedentario'
  },
  fechaInscripcion: {
    type: Date,
    default: Date.now
  },
  activo: {
    type: Boolean,
    default: true
  },
  notas: {
    type: String,
    trim: true
  },
  numeroCuenta: {
    type: String,
    trim: true
  },
  foto: {
    type: String
  },
  entrenador: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Campos de autenticación para portal de cliente
  portalPassword: {
    type: String,
    select: false // No devolver por defecto en queries
  },
  portalActivo: {
    type: Boolean,
    default: false
  },
  ultimoAcceso: {
    type: Date
  },
  tokenRecuperacion: {
    type: String
  },
  tokenExpiracion: {
    type: Date
  }
}, {
  timestamps: true
});

// Hook pre-save para hashear password del portal
clienteSchema.pre('save', async function(next) {
  if (!this.isModified('portalPassword') || !this.portalPassword) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.portalPassword = await bcrypt.hash(this.portalPassword, salt);
  next();
});

// Método para comparar contraseñas
clienteSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.portalPassword);
};

clienteSchema.index({ entrenador: 1, activo: 1 });

const Cliente = mongoose.model('Cliente', clienteSchema);

export default Cliente;
