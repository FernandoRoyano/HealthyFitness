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
    enum: ['personal', 'grupal', 'evaluacion', 'otro'],
    default: 'personal'
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
  }
}, {
  timestamps: true
});

reservaSchema.index({ fecha: 1, horaInicio: 1 });

const Reserva = mongoose.model('Reserva', reservaSchema);

export default Reserva;
