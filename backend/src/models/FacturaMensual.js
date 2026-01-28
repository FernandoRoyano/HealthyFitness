import mongoose from 'mongoose';

// Sub-esquema para detalle de sesiones
const detalleSesionSchema = new mongoose.Schema({
  fecha: Date,
  horaInicio: String,
  estado: {
    type: String,
    enum: ['asistio', 'no_asistio', 'recuperada', 'acumulada', 'cancelada_centro', 'cancelada_cliente']
  },
  precio: Number,
  esRecuperacion: {
    type: Boolean,
    default: false
  },
  notas: String
}, { _id: false });

// Sub-esquema para pagos
const pagoSchema = new mongoose.Schema({
  fecha: {
    type: Date,
    default: Date.now
  },
  monto: {
    type: Number,
    required: true,
    min: 0
  },
  metodoPago: {
    type: String,
    enum: ['efectivo', 'transferencia', 'domiciliacion', 'tarjeta', 'otro'],
    required: true
  },
  referencia: String,
  registradoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { _id: true });

// Sub-esquema para descuentos
const descuentoSchema = new mongoose.Schema({
  concepto: {
    type: String,
    required: true
  },
  monto: {
    type: Number,
    default: 0
  },
  porcentaje: {
    type: Number,
    default: 0
  }
}, { _id: false });

const facturaMensualSchema = new mongoose.Schema({
  // Cliente facturado
  cliente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cliente',
    required: [true, 'El cliente es requerido']
  },

  // Período de facturación
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

  // Referencia a la suscripción vigente (null para facturas manuales)
  suscripcion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SuscripcionCliente',
    required: false
  },

  // Snapshot de datos de suscripción al momento de generar
  datosSuscripcion: {
    producto: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Producto'
    },
    nombreProducto: String,
    tipoProducto: String,
    diasPorSemana: Number,
    precioUnitario: Number,
    rangoTarifa: String
  },

  // === CÁLCULO DE SESIONES ===

  // Sesiones esperadas según suscripción
  sesionesProgramadas: {
    type: Number,
    required: true,
    min: 0
  },

  // Sesiones acumuladas del mes anterior
  sesionesAcumuladasAnterior: {
    type: Number,
    default: 0,
    min: 0
  },

  // Desglose de asistencia
  sesionesAsistidas: {
    type: Number,
    default: 0,
    min: 0
  },
  sesionesNoAsistidas: {
    type: Number,
    default: 0,
    min: 0
  },
  sesionesCanceladasCentro: {
    type: Number,
    default: 0,
    min: 0
  },
  sesionesCanceladasCliente: {
    type: Number,
    default: 0,
    min: 0
  },

  // Sesiones recuperadas este mes
  sesionesRecuperadas: {
    type: Number,
    default: 0,
    min: 0
  },

  // Sesiones que pasan al siguiente mes (no cobradas)
  sesionesAcumuladasSiguiente: {
    type: Number,
    default: 0,
    min: 0
  },

  // === CÁLCULO ECONÓMICO ===

  // Total de sesiones a cobrar
  totalSesionesACobrar: {
    type: Number,
    required: true,
    min: 0
  },

  // Subtotal (totalSesionesACobrar * precioUnitario)
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },

  // Descuentos aplicados
  descuentos: [descuentoSchema],

  // Total descuentos
  totalDescuentos: {
    type: Number,
    default: 0,
    min: 0
  },

  // Total a pagar
  totalAPagar: {
    type: Number,
    required: true,
    min: 0
  },

  // === DETALLE DE SESIONES ===
  detalleSesiones: [detalleSesionSchema],

  // === ESTADO Y PAGO ===
  estado: {
    type: String,
    enum: ['borrador', 'generada', 'enviada', 'pagada', 'parcial', 'vencida', 'anulada'],
    default: 'borrador'
  },

  // Fecha de generación
  fechaGeneracion: {
    type: Date,
    default: Date.now
  },

  // Fecha de emisión/envío al cliente
  fechaEmision: {
    type: Date
  },

  // Fecha de vencimiento
  fechaVencimiento: {
    type: Date
  },

  // Pagos registrados
  pagos: [pagoSchema],

  // Total pagado
  totalPagado: {
    type: Number,
    default: 0,
    min: 0
  },

  // Número de factura (formato: AAAA-MM-XXXX)
  numeroFactura: {
    type: String,
    unique: true,
    sparse: true
  },

  // Notas internas
  notasInternas: {
    type: String
  },

  // Notas para el cliente
  notasCliente: {
    type: String
  },

  // Días de asistencia marcados en el calendario (array de números del 1 al 31)
  diasAsistencia: [{
    type: Number,
    min: 1,
    max: 31
  }],

  // Auditoría
  generadaPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  modificadaPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Índices
facturaMensualSchema.index({ cliente: 1, mes: 1, anio: 1 }, { unique: true });
facturaMensualSchema.index({ estado: 1 });
facturaMensualSchema.index({ fechaGeneracion: -1 });
facturaMensualSchema.index({ anio: 1, mes: 1 });

// Generar número de factura automáticamente
facturaMensualSchema.pre('save', async function(next) {
  if (!this.numeroFactura && this.estado !== 'borrador') {
    const count = await this.constructor.countDocuments({
      anio: this.anio,
      mes: this.mes,
      numeroFactura: { $exists: true, $ne: null }
    });
    this.numeroFactura = `${this.anio}-${String(this.mes).padStart(2, '0')}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Método para calcular totales
facturaMensualSchema.methods.calcularTotales = function() {
  // Total sesiones a cobrar = programadas + acumuladas anterior - canceladas centro - acumuladas siguiente
  this.totalSesionesACobrar = Math.max(0,
    this.sesionesProgramadas +
    this.sesionesAcumuladasAnterior -
    this.sesionesCanceladasCentro -
    this.sesionesAcumuladasSiguiente
  );

  // Subtotal
  this.subtotal = this.totalSesionesACobrar * (this.datosSuscripcion?.precioUnitario || 0);

  // Calcular total descuentos
  this.totalDescuentos = this.descuentos.reduce((sum, d) => {
    if (d.porcentaje > 0) {
      return sum + (this.subtotal * d.porcentaje / 100);
    }
    return sum + (d.monto || 0);
  }, 0);

  // Total a pagar
  this.totalAPagar = Math.max(0, this.subtotal - this.totalDescuentos);

  // Total pagado
  this.totalPagado = this.pagos.reduce((sum, p) => sum + (p.monto || 0), 0);

  // Actualizar estado según pagos
  if (this.estado !== 'anulada' && this.estado !== 'borrador') {
    if (this.totalPagado >= this.totalAPagar && this.totalAPagar > 0) {
      this.estado = 'pagada';
    } else if (this.totalPagado > 0 && this.totalPagado < this.totalAPagar) {
      this.estado = 'parcial';
    }
  }
};

// Método estático para generar factura de un cliente
facturaMensualSchema.statics.generarFactura = async function(clienteId, mes, anio, usuarioId) {
  const SuscripcionCliente = mongoose.model('SuscripcionCliente');
  const Asistencia = mongoose.model('Asistencia');

  // Verificar que no exista factura
  const facturaExistente = await this.findOne({ cliente: clienteId, mes, anio });
  if (facturaExistente) {
    throw new Error('Ya existe una factura para este cliente en este período');
  }

  // Obtener suscripción activa
  const suscripcion = await SuscripcionCliente.findOne({
    cliente: clienteId,
    estado: 'activa'
  }).populate('producto');

  if (!suscripcion) {
    throw new Error('El cliente no tiene una suscripción activa');
  }

  // Calcular sesiones programadas según días de entrenamiento
  const sesionesProgramadas = suscripcion.calcularSesionesMes(mes, anio);

  // Obtener resumen de asistencia del mes
  const resumenAsistencia = await Asistencia.obtenerResumenMensual(clienteId, mes, anio);

  // Obtener resumen de recuperaciones
  const resumenRecuperacion = await Asistencia.contarPorRecuperacion(clienteId, mes, anio);

  // Sesiones acumuladas del mes anterior (de la suscripción)
  const sesionesAcumuladasAnterior = suscripcion.sesionesAcumuladas || 0;

  // Las inasistencias pendientes se acumulan automáticamente al siguiente mes
  const sesionesAcumuladasSiguiente = resumenRecuperacion.pendiente || 0;

  // Obtener detalles de asistencias para el detalle de la factura
  const asistencias = await Asistencia.find({
    cliente: clienteId,
    mes: mes,
    anio: anio
  }).sort({ fecha: 1 });

  const detalleSesiones = asistencias.map(a => ({
    fecha: a.fecha,
    horaInicio: a.horaInicio,
    estado: a.estado,
    precio: suscripcion.precioUnitarioFijado,
    esRecuperacion: false,
    notas: a.notas
  }));

  // Crear factura
  const factura = new this({
    cliente: clienteId,
    mes,
    anio,
    suscripcion: suscripcion._id,
    datosSuscripcion: {
      producto: suscripcion.producto._id,
      nombreProducto: suscripcion.producto.nombre,
      tipoProducto: suscripcion.producto.tipo,
      diasPorSemana: suscripcion.diasPorSemana,
      precioUnitario: suscripcion.precioUnitarioFijado,
      rangoTarifa: suscripcion.rangoTarifaAplicado
    },
    sesionesProgramadas,
    sesionesAcumuladasAnterior,
    sesionesAsistidas: resumenAsistencia.asistio,
    sesionesNoAsistidas: resumenAsistencia.no_asistio,
    sesionesCanceladasCentro: resumenAsistencia.cancelada_centro,
    sesionesCanceladasCliente: resumenAsistencia.cancelada_cliente,
    sesionesRecuperadas: resumenRecuperacion.completada || 0,
    sesionesAcumuladasSiguiente,
    detalleSesiones,
    generadaPor: usuarioId,
    estado: 'generada'
  });

  // Calcular totales
  factura.calcularTotales();

  return factura;
};

// Método estático para obtener resumen del mes
facturaMensualSchema.statics.obtenerResumenMes = async function(mes, anio) {
  const facturas = await this.find({
    mes: mes,
    anio: anio,
    estado: { $ne: 'anulada' }
  });

  const resumen = {
    totalFacturas: facturas.length,
    totalFacturado: 0,
    totalCobrado: 0,
    pendienteCobro: 0,
    porEstado: {
      borrador: 0,
      generada: 0,
      enviada: 0,
      pagada: 0,
      parcial: 0,
      vencida: 0
    }
  };

  facturas.forEach(f => {
    resumen.totalFacturado += f.totalAPagar;
    resumen.totalCobrado += f.totalPagado;
    if (resumen.porEstado[f.estado] !== undefined) {
      resumen.porEstado[f.estado]++;
    }
  });

  resumen.pendienteCobro = resumen.totalFacturado - resumen.totalCobrado;

  return resumen;
};

const FacturaMensual = mongoose.model('FacturaMensual', facturaMensualSchema);

export default FacturaMensual;
