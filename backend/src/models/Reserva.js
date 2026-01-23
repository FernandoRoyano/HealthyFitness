import mongoose from 'mongoose';

const reservaSchema = new mongoose.Schema({
  cliente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cliente',
    required: true
  },
  entrenador: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fecha: {
    type: Date,
    required: [true, 'La fecha es requerida']
  },
  horaInicio: {
    type: String,
    required: [true, 'La hora de inicio es requerida']
  },
  horaFin: {
    type: String,
    required: [true, 'La hora de fin es requerida']
  },
  tipoSesion: {
    type: String,
    enum: ['individual', 'pareja', 'express', 'pareja-express'],
    default: 'individual'
  },
  estado: {
    type: String,
    enum: ['pendiente', 'confirmada', 'completada', 'cancelada'],
    default: 'pendiente'
  },
  notas: {
    type: String,
    trim: true
  },
  duracion: {
    type: Number,
    default: 60
  },
  // Campos para integración con plantillas semanales
  origen: {
    type: String,
    enum: ['manual', 'plantilla'],
    default: 'manual'
  },
  plantillaOrigen: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PlantillaSemanal',
    default: null
  },
  esPlanificada: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

reservaSchema.index({ fecha: 1, horaInicio: 1 });

const Reserva = mongoose.model('Reserva', reservaSchema);

export default Reserva;
