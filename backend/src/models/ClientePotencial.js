import mongoose from 'mongoose';

const clientePotencialSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre es requerido'],
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  telefono: {
    type: String,
    required: [true, 'El teléfono es requerido'],
    trim: true
  },
  busca: {
    type: String,
    required: [true, 'El campo "qué busca" es requerido'],
    trim: true
  },
  estado: {
    type: String,
    enum: ['pendiente', 'contactado', 'interesado', 'apuntado', 'no_interesado'],
    default: 'pendiente'
  },
  notas: {
    type: String,
    trim: true
  },
  fechaUltimoContacto: {
    type: Date
  },
  creadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Referencia al cliente si se convirtió
  clienteConvertido: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cliente'
  }
}, {
  timestamps: true
});

// Índices
clientePotencialSchema.index({ estado: 1 });
clientePotencialSchema.index({ createdAt: -1 });
clientePotencialSchema.index({ nombre: 'text', busca: 'text' });

// Método estático para obtener estadísticas por estado
clientePotencialSchema.statics.obtenerEstadisticas = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$estado',
        count: { $sum: 1 }
      }
    }
  ]);

  const resultado = {
    pendiente: 0,
    contactado: 0,
    interesado: 0,
    apuntado: 0,
    no_interesado: 0,
    total: 0
  };

  stats.forEach(s => {
    resultado[s._id] = s.count;
    resultado.total += s.count;
  });

  return resultado;
};

const ClientePotencial = mongoose.model('ClientePotencial', clientePotencialSchema);

export default ClientePotencial;
