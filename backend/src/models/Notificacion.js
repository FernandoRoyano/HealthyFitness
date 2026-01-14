import mongoose from 'mongoose';

const notificacionSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  tipo: {
    type: String,
    required: true,
    enum: [
      'solicitud_nueva',
      'solicitud_aprobada',
      'solicitud_rechazada',
      'reserva_creada',
      'reserva_modificada',
      'reserva_cancelada'
    ]
  },
  titulo: {
    type: String,
    required: true
  },
  mensaje: {
    type: String,
    required: true
  },
  leida: {
    type: Boolean,
    default: false,
    index: true
  },
  relacionadoA: {
    tipo: {
      type: String,
      enum: ['solicitud', 'reserva', 'cliente'],
      required: true
    },
    id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    }
  }
}, {
  timestamps: true
});

// Índice compuesto para consultas eficientes
notificacionSchema.index({ usuario: 1, leida: 1, createdAt: -1 });

export default mongoose.model('Notificacion', notificacionSchema);
