import mongoose from 'mongoose';

const medicionCorporalSchema = new mongoose.Schema({
  cliente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cliente',
    required: true
  },
  fecha: {
    type: Date,
    default: Date.now
  },
  // Datos basicos
  peso: {
    type: Number,
    min: 0
  },
  altura: {
    type: Number,
    min: 0
  },
  // Medidas corporales (en cm)
  pecho: {
    type: Number,
    min: 0
  },
  cintura: {
    type: Number,
    min: 0
  },
  cadera: {
    type: Number,
    min: 0
  },
  brazo: {
    type: Number,
    min: 0
  },
  muslo: {
    type: Number,
    min: 0
  },
  // Composicion corporal
  grasaCorporal: {
    type: Number,
    min: 0,
    max: 100
  },
  masaMuscular: {
    type: Number,
    min: 0
  },
  agua: {
    type: Number,
    min: 0,
    max: 100
  },
  grasaVisceral: {
    type: Number,
    min: 0
  },
  // Calculados
  imc: {
    type: Number,
    min: 0
  },
  // Notas
  notas: {
    type: String,
    trim: true
  },
  // Auditoria
  registradoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Calcular IMC antes de guardar
medicionCorporalSchema.pre('save', function(next) {
  if (this.peso && this.altura) {
    const alturaMetros = this.altura / 100;
    this.imc = parseFloat((this.peso / (alturaMetros * alturaMetros)).toFixed(2));
  }
  next();
});

// Indices
medicionCorporalSchema.index({ cliente: 1, fecha: -1 });

const MedicionCorporal = mongoose.model('MedicionCorporal', medicionCorporalSchema);

export default MedicionCorporal;
