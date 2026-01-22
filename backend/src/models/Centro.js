import mongoose from 'mongoose';

const centroSchema = new mongoose.Schema({
  // Datos basicos
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  nombreComercial: {
    type: String,
    trim: true
  },

  // Datos fiscales
  nif: {
    type: String,
    required: true,
    trim: true
  },
  direccion: {
    type: String,
    required: true,
    trim: true
  },
  codigoPostal: {
    type: String,
    trim: true
  },
  ciudad: {
    type: String,
    trim: true
  },
  provincia: {
    type: String,
    trim: true
  },
  pais: {
    type: String,
    default: 'Espana',
    trim: true
  },

  // Contacto
  telefono: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  web: {
    type: String,
    trim: true
  },

  // Datos bancarios
  iban: {
    type: String,
    trim: true
  },
  banco: {
    type: String,
    trim: true
  },
  titular: {
    type: String,
    trim: true
  },

  // Personalizacion facturas
  logoUrl: {
    type: String,
    trim: true
  },
  colorPrimario: {
    type: String,
    default: '#75b760'
  },
  pieFactura: {
    type: String,
    trim: true
  },
  condicionesPago: {
    type: String,
    trim: true
  },

  // Configuracion email
  emailRemitente: {
    type: String,
    trim: true,
    lowercase: true
  },
  nombreRemitente: {
    type: String,
    trim: true
  },

  // Serie de facturacion
  prefijoFactura: {
    type: String,
    default: '',
    trim: true
  },
  ultimoNumeroFactura: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Metodo estatico para obtener el centro (singleton)
centroSchema.statics.obtenerCentro = async function() {
  let centro = await this.findOne();
  if (!centro) {
    centro = await this.create({
      nombre: 'Mi Centro de Entrenamiento',
      nif: 'B00000000',
      direccion: 'Direccion del centro'
    });
  }
  return centro;
};

const Centro = mongoose.model('Centro', centroSchema);

export default Centro;
