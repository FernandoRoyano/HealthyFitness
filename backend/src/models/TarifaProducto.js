import mongoose from 'mongoose';

const tarifaProductoSchema = new mongoose.Schema({
  producto: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Producto',
    required: [true, 'El producto es requerido']
  },
  rangoDias: {
    type: String,
    required: [true, 'El rango de días es requerido'],
    enum: ['1', '2', '3+']
  },
  precio: {
    type: Number,
    required: [true, 'El precio es requerido'],
    min: [0, 'El precio no puede ser negativo']
  }
}, {
  timestamps: true
});

// Índice único compuesto para evitar duplicados
tarifaProductoSchema.index({ producto: 1, rangoDias: 1 }, { unique: true });

// Método estático para obtener el rango aplicable según días
tarifaProductoSchema.statics.getRangoAplicable = function(diasSemana) {
  if (diasSemana === 1) return '1';
  if (diasSemana === 2) return '2';
  return '3+';
};

// Método estático para obtener precio por producto y días
tarifaProductoSchema.statics.obtenerPrecio = async function(productoId, diasSemana) {
  const rango = this.getRangoAplicable(diasSemana);

  const tarifa = await this.findOne({
    producto: productoId,
    rangoDias: rango
  }).populate('producto', 'nombre tipo activo');

  if (!tarifa) {
    throw new Error(`No hay tarifa definida para el rango ${rango} días`);
  }

  if (!tarifa.producto.activo) {
    throw new Error('El producto no está activo');
  }

  return {
    producto_id: tarifa.producto._id,
    producto_nombre: tarifa.producto.nombre,
    producto_tipo: tarifa.producto.tipo,
    dias_semana: diasSemana,
    rango_aplicado: rango,
    precio: tarifa.precio
  };
};

// Método estático para obtener precio por tipo de producto
tarifaProductoSchema.statics.obtenerPrecioPorTipo = async function(tipo, diasSemana) {
  const Producto = mongoose.model('Producto');

  const producto = await Producto.findOne({ tipo, activo: true });

  if (!producto) {
    throw new Error(`No existe un producto activo del tipo ${tipo}`);
  }

  return this.obtenerPrecio(producto._id, diasSemana);
};

export default mongoose.model('TarifaProducto', tarifaProductoSchema);
