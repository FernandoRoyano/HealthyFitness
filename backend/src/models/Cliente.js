import mongoose from 'mongoose';

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
  entrenador: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El cliente debe tener un entrenador asignado']
  }
}, {
  timestamps: true
});

const Cliente = mongoose.model('Cliente', clienteSchema);

export default Cliente;
