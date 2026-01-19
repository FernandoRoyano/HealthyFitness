import mongoose from 'mongoose';

const vacacionSchema = new mongoose.Schema({
  // Usuario que solicita las vacaciones
  entrenador: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Período de vacaciones
  fechaInicio: {
    type: Date,
    required: [true, 'La fecha de inicio es requerida']
  },
  fechaFin: {
    type: Date,
    required: [true, 'La fecha de fin es requerida']
  },

  // Cálculo de días (solo laborables, excluyendo fines de semana)
  diasLaborables: {
    type: Number,
    required: true
  },

  // Tipo de período (clave para el requisito de 15 días estivales)
  tipoPeriodo: {
    type: String,
    enum: ['estival', 'no_estival'],
    required: true
  },

  // Año al que corresponden las vacaciones
  año: {
    type: Number,
    required: true,
    default: () => new Date().getFullYear()
  },

  // Motivo o notas adicionales
  motivo: {
    type: String,
    trim: true,
    maxlength: 500
  },

  // Estado del flujo de aprobación
  estado: {
    type: String,
    enum: ['pendiente', 'aprobado', 'rechazado', 'cancelado'],
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
  },

  // Quién creó la solicitud (puede ser el propio entrenador o un gerente)
  creadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Índices para búsquedas eficientes
vacacionSchema.index({ entrenador: 1, año: 1 });
vacacionSchema.index({ estado: 1, createdAt: -1 });
vacacionSchema.index({ tipoPeriodo: 1, año: 1 });
vacacionSchema.index({ fechaInicio: 1, fechaFin: 1 });

// Método estático para calcular días laborables entre dos fechas
vacacionSchema.statics.calcularDiasLaborables = function(fechaInicio, fechaFin) {
  let dias = 0;
  const fecha = new Date(fechaInicio);
  const fin = new Date(fechaFin);

  // Normalizar a medianoche para evitar problemas de zona horaria
  fecha.setHours(0, 0, 0, 0);
  fin.setHours(0, 0, 0, 0);

  while (fecha <= fin) {
    const diaSemana = fecha.getDay();
    // 0 = Domingo, 6 = Sábado
    if (diaSemana !== 0 && diaSemana !== 6) {
      dias++;
    }
    fecha.setDate(fecha.getDate() + 1);
  }
  return dias;
};

// Método estático para determinar si una fecha está en período estival
// Período estival: 1 de junio al 30 de septiembre
vacacionSchema.statics.esPeriodoEstival = function(fecha) {
  const mes = new Date(fecha).getMonth(); // 0-11
  return mes >= 5 && mes <= 8; // junio(5) a septiembre(8)
};

// Método estático para determinar el tipo de período de una solicitud
vacacionSchema.statics.determinarTipoPeriodo = function(fechaInicio, fechaFin) {
  const inicio = new Date(fechaInicio);
  const fin = new Date(fechaFin);

  // Normalizar
  inicio.setHours(0, 0, 0, 0);
  fin.setHours(0, 0, 0, 0);

  // Si al menos el 50% de los días están en período estival, se considera estival
  let diasEstivales = 0;
  let diasTotales = 0;
  const fecha = new Date(inicio);

  while (fecha <= fin) {
    const diaSemana = fecha.getDay();
    if (diaSemana !== 0 && diaSemana !== 6) {
      diasTotales++;
      if (this.esPeriodoEstival(fecha)) {
        diasEstivales++;
      }
    }
    fecha.setDate(fecha.getDate() + 1);
  }

  return diasEstivales >= (diasTotales / 2) ? 'estival' : 'no_estival';
};

// Validación: fechaFin debe ser posterior o igual a fechaInicio
vacacionSchema.pre('validate', function(next) {
  if (this.fechaInicio && this.fechaFin) {
    const inicio = new Date(this.fechaInicio);
    const fin = new Date(this.fechaFin);
    inicio.setHours(0, 0, 0, 0);
    fin.setHours(0, 0, 0, 0);

    if (fin < inicio) {
      next(new Error('La fecha de fin debe ser posterior a la fecha de inicio'));
    }
  }
  next();
});

const Vacacion = mongoose.model('Vacacion', vacacionSchema);

export default Vacacion;
