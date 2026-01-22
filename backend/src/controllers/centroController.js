import Centro from '../models/Centro.js';

// Obtener datos del centro
export const obtenerCentro = async (req, res) => {
  try {
    const centro = await Centro.obtenerCentro();
    res.json(centro);
  } catch (error) {
    console.error('Error al obtener datos del centro:', error);
    res.status(500).json({ mensaje: 'Error al obtener datos del centro' });
  }
};

// Actualizar datos del centro
export const actualizarCentro = async (req, res) => {
  try {
    const {
      nombre,
      nombreComercial,
      nif,
      direccion,
      codigoPostal,
      ciudad,
      provincia,
      pais,
      telefono,
      email,
      web,
      iban,
      banco,
      titular,
      logoUrl,
      colorPrimario,
      pieFactura,
      condicionesPago,
      emailRemitente,
      nombreRemitente,
      prefijoFactura
    } = req.body;

    let centro = await Centro.findOne();

    if (!centro) {
      centro = new Centro({
        nombre: nombre || 'Mi Centro de Entrenamiento',
        nif: nif || 'B00000000',
        direccion: direccion || 'Direccion del centro'
      });
    }

    // Actualizar campos
    if (nombre) centro.nombre = nombre;
    if (nombreComercial !== undefined) centro.nombreComercial = nombreComercial;
    if (nif) centro.nif = nif;
    if (direccion) centro.direccion = direccion;
    if (codigoPostal !== undefined) centro.codigoPostal = codigoPostal;
    if (ciudad !== undefined) centro.ciudad = ciudad;
    if (provincia !== undefined) centro.provincia = provincia;
    if (pais !== undefined) centro.pais = pais;
    if (telefono !== undefined) centro.telefono = telefono;
    if (email !== undefined) centro.email = email;
    if (web !== undefined) centro.web = web;
    if (iban !== undefined) centro.iban = iban;
    if (banco !== undefined) centro.banco = banco;
    if (titular !== undefined) centro.titular = titular;
    if (logoUrl !== undefined) centro.logoUrl = logoUrl;
    if (colorPrimario !== undefined) centro.colorPrimario = colorPrimario;
    if (pieFactura !== undefined) centro.pieFactura = pieFactura;
    if (condicionesPago !== undefined) centro.condicionesPago = condicionesPago;
    if (emailRemitente !== undefined) centro.emailRemitente = emailRemitente;
    if (nombreRemitente !== undefined) centro.nombreRemitente = nombreRemitente;
    if (prefijoFactura !== undefined) centro.prefijoFactura = prefijoFactura;

    await centro.save();

    res.json(centro);
  } catch (error) {
    console.error('Error al actualizar datos del centro:', error);
    res.status(500).json({ mensaje: 'Error al actualizar datos del centro' });
  }
};
