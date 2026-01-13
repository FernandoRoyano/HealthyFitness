import mongoose from 'mongoose';

const solicitudCambioSchema = new mongoose.Schema({
  reservaOriginal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reserva',
    required: true
  },
  entrenador: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  cliente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cliente',
    required: true
  },
  // Datos originales
  datosOriginales: {
    fecha: Date,
    horaInicio: String,
    horaFin: String,
    tipoSesion: String,
    duracion: Number,
    notas: String
  },
  // Datos propuestos (nuevo horario)
  datosPropuestos: {
    fecha: {
      type: Date,
      required: true
    },
    horaInicio: {
      type: String,
      required: true
    },
    horaFin: {
      type: String,
      required: true
    },
    tipoSesion: {
      type: String,
      enum: ['personal', 'grupal', 'evaluacion', 'otro'],
      default: 'personal'
    },
    duracion: {
      type: Number,
      default: 60
    },
    notas: String
  },
  motivoCambio: {
    type: String,
    trim: true
  },
  estado: {
    type: String,
    enum: ['pendiente', 'aprobado', 'rechazado'],
    default: 'pendiente'
  },
  // Gestión de la solicitud
  revisadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  fechaRevision: Date,
  motivoRechazo: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Índices para búsquedas eficientes
solicitudCambioSchema.index({ estado: 1, createdAt: -1 });
solicitudCambioSchema.index({ entrenador: 1, estado: 1 });
solicitudCambioSchema.index({ reservaOriginal: 1 });

const SolicitudCambio = mongoose.model('SolicitudCambio', solicitudCambioSchema);

export default SolicitudCambio;
