import mongoose from 'mongoose';

const GRUPOS_MUSCULARES = [
  'pecho', 'espalda', 'hombros', 'biceps', 'triceps',
  'piernas', 'gluteos', 'core', 'cardio', 'cuerpo_completo'
];

const ejercicioSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre del ejercicio es requerido'],
    trim: true
  },
  descripcion: {
    type: String,
    trim: true
  },
  grupoMuscular: {
    type: String,
    required: [true, 'El grupo muscular es requerido'],
    enum: GRUPOS_MUSCULARES
  },
  grupoMuscularSecundario: [{
    type: String,
    enum: GRUPOS_MUSCULARES
  }],
  categoria: {
    type: String,
    required: [true, 'La categoría es requerida'],
    enum: ['fuerza', 'cardio', 'estiramiento', 'funcional', 'peso_corporal']
  },
  dificultad: {
    type: String,
    enum: ['principiante', 'intermedio', 'avanzado'],
    default: 'intermedio'
  },
  equipamiento: {
    type: String,
    trim: true
  },
  instrucciones: {
    type: String,
    trim: true
  },
  videoUrl: {
    type: String
  },
  activo: {
    type: Boolean,
    default: true
  },
  creadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

ejercicioSchema.index({ grupoMuscular: 1, categoria: 1 });
ejercicioSchema.index({ activo: 1 });
ejercicioSchema.index({ nombre: 'text', descripcion: 'text' });

const Ejercicio = mongoose.model('Ejercicio', ejercicioSchema);

export default Ejercicio;
