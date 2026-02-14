import mongoose from 'mongoose';

const serieRegistroSchema = new mongoose.Schema({
  numeroSerie: {
    type: Number,
    required: true
  },
  peso: {
    type: Number
  },
  repeticiones: {
    type: Number
  },
  completada: {
    type: Boolean,
    default: true
  },
  rpe: {
    type: Number,
    min: 1,
    max: 10
  },
  notas: {
    type: String,
    trim: true
  }
}, { _id: false });

const ejercicioRegistroSchema = new mongoose.Schema({
  ejercicio: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ejercicio',
    required: true
  },
  series: [serieRegistroSchema],
  notas: {
    type: String,
    trim: true
  }
}, { _id: true });

const registroEntrenamientoSchema = new mongoose.Schema({
  cliente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cliente',
    required: true
  },
  rutina: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Rutina'
  },
  diaRutina: {
    type: String,
    trim: true
  },
  fecha: {
    type: Date,
    required: true,
    default: Date.now
  },
  ejercicios: [ejercicioRegistroSchema],
  duracionMinutos: {
    type: Number
  },
  notas: {
    type: String,
    trim: true
  },
  completado: {
    type: Boolean,
    default: true
  },
  registradoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

registroEntrenamientoSchema.index({ cliente: 1, fecha: -1 });
registroEntrenamientoSchema.index({ cliente: 1, 'ejercicios.ejercicio': 1 });

const RegistroEntrenamiento = mongoose.model('RegistroEntrenamiento', registroEntrenamientoSchema);

export default RegistroEntrenamiento;
