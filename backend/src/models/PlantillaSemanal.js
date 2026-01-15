import mongoose from 'mongoose';

const sesionPlantillaSchema = new mongoose.Schema({
  entrenador: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  diaSemana: {
    type: Number,
    required: true,
    min: 1,
    max: 5  // 1=lunes, 5=viernes (solo días laborables)
  },
  horaInicio: {
    type: String,
    required: true
  },
  horaFin: {
    type: String,
    required: true
  },
  cliente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cliente',
    default: null  // Puede ser null para slots disponibles
  },
  tipoSesion: {
    type: String,
    enum: ['individual', 'pareja', 'grupo'],
    default: 'individual'
  },
  duracion: {
    type: Number,
    default: 60  // minutos
  },
  notas: {
    type: String,
    default: ''
  }
}, { _id: true });

const plantillaSemanalSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true
  },
  descripcion: {
    type: String,
    default: ''
  },
  esPlantillaBase: {
    type: Boolean,
    default: false
  },
  semanaReferencia: {
    type: Date,
    required: true  // Fecha del lunes de esta semana
  },
  mes: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  año: {
    type: Number,
    required: true
  },
  estado: {
    type: String,
    enum: ['borrador', 'activa', 'aplicada', 'archivada'],
    default: 'borrador'
  },
  sesiones: [sesionPlantillaSchema],
  creadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  plantillaOrigen: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PlantillaSemanal',
    default: null  // Si fue duplicada, referencia a la original
  }
}, {
  timestamps: true
});

// Índices para búsquedas eficientes
plantillaSemanalSchema.index({ mes: 1, año: 1 });
plantillaSemanalSchema.index({ esPlantillaBase: 1, mes: 1, año: 1 });
plantillaSemanalSchema.index({ estado: 1 });
plantillaSemanalSchema.index({ creadoPor: 1 });

// Método para obtener la semana del mes (1-5)
plantillaSemanalSchema.methods.getNumeroSemana = function() {
  const fecha = new Date(this.semanaReferencia);
  const primerDiaMes = new Date(fecha.getFullYear(), fecha.getMonth(), 1);
  const diasHastaSemana = Math.floor((fecha - primerDiaMes) / (1000 * 60 * 60 * 24));
  return Math.ceil((diasHastaSemana + primerDiaMes.getDay()) / 7);
};

export default mongoose.model('PlantillaSemanal', plantillaSemanalSchema);
