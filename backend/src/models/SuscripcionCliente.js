import mongoose from 'mongoose';

const suscripcionClienteSchema = new mongoose.Schema({
  // Cliente asociado (único - un cliente solo puede tener una suscripción activa)
  cliente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cliente',
    required: [true, 'El cliente es requerido'],
    unique: true
  },

  // Producto/tipo de sesión contratado
  producto: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Producto',
    required: [true, 'El producto es requerido']
  },

  // Días por semana contratados (determina el rango de precio)
  diasPorSemana: {
    type: Number,
    required: [true, 'Los días por semana son requeridos'],
    min: [1, 'Mínimo 1 día por semana'],
    max: [5, 'Máximo 5 días por semana']
  },

  // Días específicos de entrenamiento (0=Lunes, 1=Martes, 2=Miércoles, 3=Jueves, 4=Viernes)
  diasEntrenamiento: [{
    type: Number,
    min: 0,
    max: 4
  }],

  // Fecha de inicio de la suscripción
  fechaInicio: {
    type: Date,
    required: [true, 'La fecha de inicio es requerida'],
    default: Date.now
  },

  // Fecha de fin (null = indefinida)
  fechaFin: {
    type: Date,
    default: null
  },

  // Estado de la suscripción
  estado: {
    type: String,
    enum: ['activa', 'pausada', 'cancelada', 'pendiente'],
    default: 'activa'
  },

  // Precio unitario fijado al momento de la suscripción (snapshot)
  precioUnitarioFijado: {
    type: Number,
    required: [true, 'El precio unitario es requerido'],
    min: 0
  },

  // Rango de tarifa aplicado ('1', '2', '3+')
  rangoTarifaAplicado: {
    type: String,
    enum: ['1', '2', '3+'],
    required: true
  },

  // Sesiones acumuladas de meses anteriores (no usadas/recuperadas)
  sesionesAcumuladas: {
    type: Number,
    default: 0,
    min: 0
  },

  // Notas adicionales
  notas: {
    type: String,
    trim: true
  },

  // Quién creó/modificó la suscripción
  creadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  actualizadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Índices
suscripcionClienteSchema.index({ estado: 1 });
suscripcionClienteSchema.index({ producto: 1 });

// Método para calcular sesiones esperadas en un mes
suscripcionClienteSchema.methods.calcularSesionesMes = function(mes, anio) {
  const diasEntrenamiento = this.diasEntrenamiento;
  let totalSesiones = 0;

  // mes es 1-12, pero Date usa 0-11
  const mesIndex = mes - 1;
  const primerDia = new Date(anio, mesIndex, 1);
  const ultimoDia = new Date(anio, mesIndex + 1, 0);

  for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
    const fecha = new Date(anio, mesIndex, dia);
    // getDay(): 0=Domingo, 1=Lunes... convertimos a 0=Lunes, 4=Viernes
    const diaSemana = fecha.getDay();
    // Convertir: Lunes(1)->0, Martes(2)->1, ..., Viernes(5)->4
    // Ignorar sábado(6) y domingo(0)
    if (diaSemana >= 1 && diaSemana <= 5) {
      const diaConvertido = diaSemana - 1; // 0=Lunes, 4=Viernes
      if (diasEntrenamiento.includes(diaConvertido)) {
        totalSesiones++;
      }
    }
  }

  return totalSesiones;
};

// Método estático para obtener el rango de tarifa según días por semana
suscripcionClienteSchema.statics.getRangoTarifa = function(diasPorSemana) {
  if (diasPorSemana === 1) return '1';
  if (diasPorSemana === 2) return '2';
  return '3+';
};

// Validación pre-save: verificar que diasEntrenamiento coincida con diasPorSemana
suscripcionClienteSchema.pre('save', function(next) {
  if (this.diasEntrenamiento && this.diasEntrenamiento.length !== this.diasPorSemana) {
    // Ajustar automáticamente si no coincide
    if (this.diasEntrenamiento.length > this.diasPorSemana) {
      this.diasEntrenamiento = this.diasEntrenamiento.slice(0, this.diasPorSemana);
    }
  }
  next();
});

const SuscripcionCliente = mongoose.model('SuscripcionCliente', suscripcionClienteSchema);

export default SuscripcionCliente;
