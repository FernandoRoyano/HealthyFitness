import mongoose from 'mongoose';

const asistenciaSchema = new mongoose.Schema({
  // Reserva asociada (si existe)
  reserva: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reserva',
    default: null
  },

  // Cliente (referencia directa para consultas más rápidas)
  cliente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cliente',
    required: [true, 'El cliente es requerido']
  },

  // Entrenador
  entrenador: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El entrenador es requerido']
  },

  // Fecha de la sesión
  fecha: {
    type: Date,
    required: [true, 'La fecha es requerida']
  },

  // Hora programada
  horaInicio: {
    type: String,
    required: [true, 'La hora de inicio es requerida']
  },

  // Estado de asistencia
  estado: {
    type: String,
    enum: ['asistio', 'no_asistio', 'cancelada_cliente', 'cancelada_centro', 'pendiente'],
    default: 'pendiente'
  },

  // Tipo de sesión
  tipoSesion: {
    type: String,
    enum: ['personal', 'grupal', 'evaluacion', 'pareja'],
    default: 'personal'
  },

  // Mes y año para facilitar consultas de facturación
  mes: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  anio: {
    type: Number,
    required: true
  },

  // Para inasistencias: estado de la recuperación
  recuperacion: {
    // Estado de la recuperación
    estado: {
      type: String,
      enum: ['pendiente', 'programada', 'completada', 'acumulada', 'expirada', null],
      default: null
    },
    // Reserva de la sesión de recuperación
    reservaRecuperacion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Reserva',
      default: null
    },
    // Fecha límite para recuperar (fin del mismo mes)
    fechaLimiteRecuperacion: {
      type: Date,
      default: null
    },
    // Si se acumuló para el siguiente mes
    acumuladaParaMes: {
      type: Number,
      default: null
    },
    acumuladaParaAnio: {
      type: Number,
      default: null
    }
  },

  // Notas del entrenador
  notas: {
    type: String,
    trim: true
  },

  // Quién registró la asistencia
  registradoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Índices para consultas eficientes
asistenciaSchema.index({ cliente: 1, mes: 1, anio: 1 });
asistenciaSchema.index({ fecha: 1 });
asistenciaSchema.index({ estado: 1 });
asistenciaSchema.index({ entrenador: 1, fecha: 1 });
asistenciaSchema.index({ 'recuperacion.estado': 1 });
asistenciaSchema.index({ cliente: 1, fecha: 1, horaInicio: 1 }, { unique: true });

// Pre-save: calcular mes y año automáticamente
asistenciaSchema.pre('save', function(next) {
  if (this.fecha) {
    const fecha = new Date(this.fecha);
    this.mes = fecha.getMonth() + 1; // getMonth() es 0-indexed
    this.anio = fecha.getFullYear();

    // Si es inasistencia, configurar recuperación
    if (this.estado === 'no_asistio' && !this.recuperacion?.estado) {
      // Fecha límite: último día del mismo mes
      const ultimoDiaMes = new Date(this.anio, this.mes, 0);
      this.recuperacion = {
        estado: 'pendiente',
        fechaLimiteRecuperacion: ultimoDiaMes
      };
    }
  }
  next();
});

// Método estático para contar asistencias/inasistencias de un cliente en un mes
asistenciaSchema.statics.obtenerResumenMensual = async function(clienteId, mes, anio) {
  const resultado = await this.aggregate([
    {
      $match: {
        cliente: new mongoose.Types.ObjectId(clienteId),
        mes: mes,
        anio: anio
      }
    },
    {
      $group: {
        _id: '$estado',
        count: { $sum: 1 }
      }
    }
  ]);

  const resumen = {
    asistio: 0,
    no_asistio: 0,
    cancelada_cliente: 0,
    cancelada_centro: 0,
    pendiente: 0,
    total: 0
  };

  resultado.forEach(r => {
    if (resumen[r._id] !== undefined) {
      resumen[r._id] = r.count;
    }
    resumen.total += r.count;
  });

  return resumen;
};

// Método estático para obtener inasistencias pendientes de recuperar
asistenciaSchema.statics.obtenerInasistenciasPendientes = async function(clienteId, mes = null, anio = null) {
  const filtro = {
    cliente: new mongoose.Types.ObjectId(clienteId),
    estado: 'no_asistio',
    'recuperacion.estado': 'pendiente'
  };

  if (mes && anio) {
    filtro.mes = mes;
    filtro.anio = anio;
  }

  return this.find(filtro)
    .populate('reserva')
    .sort({ fecha: -1 });
};

// Método estático para contar sesiones por estado de recuperación
asistenciaSchema.statics.contarPorRecuperacion = async function(clienteId, mes, anio) {
  const resultado = await this.aggregate([
    {
      $match: {
        cliente: new mongoose.Types.ObjectId(clienteId),
        mes: mes,
        anio: anio,
        estado: 'no_asistio'
      }
    },
    {
      $group: {
        _id: '$recuperacion.estado',
        count: { $sum: 1 }
      }
    }
  ]);

  const resumen = {
    pendiente: 0,
    programada: 0,
    completada: 0,
    acumulada: 0,
    expirada: 0
  };

  resultado.forEach(r => {
    if (r._id && resumen[r._id] !== undefined) {
      resumen[r._id] = r.count;
    }
  });

  return resumen;
};

const Asistencia = mongoose.model('Asistencia', asistenciaSchema);

export default Asistencia;
