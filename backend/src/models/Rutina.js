import mongoose from 'mongoose';

const ejercicioEnDiaSchema = new mongoose.Schema({
  ejercicio: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ejercicio',
    required: true
  },
  orden: {
    type: Number,
    required: true
  },
  series: {
    type: Number,
    default: 3,
    min: 1
  },
  repeticiones: {
    type: String,
    default: '10'
  },
  descansoSegundos: {
    type: Number,
    default: 60
  },
  peso: {
    type: String
  },
  tempo: {
    type: String
  },
  notas: {
    type: String,
    trim: true
  },
  esSuperset: {
    type: Boolean,
    default: false
  },
  grupoSuperset: {
    type: Number
  }
}, { _id: true });

const diaRutinaSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre del día es requerido']
  },
  orden: {
    type: Number,
    required: true
  },
  ejercicios: [ejercicioEnDiaSchema],
  notas: {
    type: String,
    trim: true
  }
}, { _id: true });

const rutinaSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre de la rutina es requerido'],
    trim: true
  },
  descripcion: {
    type: String,
    trim: true
  },
  cliente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cliente',
    default: null
  },
  entrenador: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  objetivo: {
    type: String,
    enum: ['hipertrofia', 'fuerza', 'resistencia', 'perdida_grasa', 'tonificacion', 'salud_general'],
    required: [true, 'El objetivo es requerido']
  },
  dificultad: {
    type: String,
    enum: ['principiante', 'intermedio', 'avanzado'],
    default: 'intermedio'
  },
  diasPorSemana: {
    type: Number,
    min: 1,
    max: 7
  },
  dias: [diaRutinaSchema],
  activa: {
    type: Boolean,
    default: true
  },
  esPlantilla: {
    type: Boolean,
    default: false
  },
  fechaInicio: {
    type: Date
  },
  fechaFin: {
    type: Date
  }
}, {
  timestamps: true
});

rutinaSchema.index({ cliente: 1, activa: 1 });
rutinaSchema.index({ entrenador: 1 });
rutinaSchema.index({ esPlantilla: 1 });

const Rutina = mongoose.model('Rutina', rutinaSchema);

export default Rutina;
