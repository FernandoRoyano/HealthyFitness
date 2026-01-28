import mongoose from 'mongoose';

const productoSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre es requerido'],
    trim: true
  },
  tipo: {
    type: String,
    required: [true, 'El tipo es requerido'],
    enum: ['individual', 'individual_express', 'pareja', 'pareja_express'],
    unique: true
  },
  descripcion: {
    type: String,
    default: ''
  },
  activo: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Índices
productoSchema.index({ activo: 1 });

export default mongoose.model('Producto', productoSchema);
