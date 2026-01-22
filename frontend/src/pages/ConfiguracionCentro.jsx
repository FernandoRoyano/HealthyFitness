import { useState, useEffect } from 'react';
import { centroAPI, facturacionAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './ConfiguracionCentro.css';

function ConfiguracionCentro() {
  const { usuario } = useAuth();
  const esGerente = usuario?.rol === 'gerente';

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [emailStatus, setEmailStatus] = useState(null);

  const [formulario, setFormulario] = useState({
    nombre: '',
    nombreComercial: '',
    nif: '',
    direccion: '',
    codigoPostal: '',
    ciudad: '',
    provincia: '',
    pais: 'Espana',
    telefono: '',
    email: '',
    web: '',
    iban: '',
    banco: '',
    titular: '',
    logoUrl: '',
    colorPrimario: '#75b760',
    pieFactura: '',
    condicionesPago: '',
    emailRemitente: '',
    nombreRemitente: '',
    prefijoFactura: ''
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const [centroRes, emailRes] = await Promise.all([
        centroAPI.obtener(),
        facturacionAPI.verificarEmail().catch(() => ({ data: { configurado: false } }))
      ]);

      setFormulario({
        nombre: centroRes.data.nombre || '',
        nombreComercial: centroRes.data.nombreComercial || '',
        nif: centroRes.data.nif || '',
        direccion: centroRes.data.direccion || '',
        codigoPostal: centroRes.data.codigoPostal || '',
        ciudad: centroRes.data.ciudad || '',
        provincia: centroRes.data.provincia || '',
        pais: centroRes.data.pais || 'Espana',
        telefono: centroRes.data.telefono || '',
        email: centroRes.data.email || '',
        web: centroRes.data.web || '',
        iban: centroRes.data.iban || '',
        banco: centroRes.data.banco || '',
        titular: centroRes.data.titular || '',
        logoUrl: centroRes.data.logoUrl || '',
        colorPrimario: centroRes.data.colorPrimario || '#75b760',
        pieFactura: centroRes.data.pieFactura || '',
        condicionesPago: centroRes.data.condicionesPago || '',
        emailRemitente: centroRes.data.emailRemitente || '',
        nombreRemitente: centroRes.data.nombreRemitente || '',
        prefijoFactura: centroRes.data.prefijoFactura || ''
      });

      setEmailStatus(emailRes.data);
    } catch (err) {
      setError('Error al cargar datos del centro');
    } finally {
      setCargando(false);
    }
  };

  const handleChange = (e) => {
    setFormulario({
      ...formulario,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setGuardando(true);
      setError('');
      await centroAPI.actualizar(formulario);
      setMensaje('Configuracion guardada correctamente');
      setTimeout(() => setMensaje(''), 3000);
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al guardar configuracion');
    } finally {
      setGuardando(false);
    }
  };

  if (!esGerente) {
    return (
      <div className="config-centro-container">
        <div className="config-centro-error">
          Solo el gerente puede acceder a esta configuracion.
        </div>
      </div>
    );
  }

  if (cargando) {
    return (
      <div className="config-centro-container">
        <div className="config-centro-cargando">Cargando configuracion...</div>
      </div>
    );
  }

  return (
    <div className="config-centro-container">
      <div className="config-centro-header">
        <h1>Configuracion del Centro</h1>
        <p>Configura los datos de tu centro de entrenamiento</p>
      </div>

      {error && <div className="config-centro-error">{error}</div>}
      {mensaje && <div className="config-centro-mensaje">{mensaje}</div>}

      <form onSubmit={handleSubmit} className="config-centro-form">
        {/* Seccion: Datos basicos */}
        <div className="config-centro-seccion">
          <h2>Datos Basicos</h2>
          <div className="config-centro-grid">
            <div className="config-centro-field">
              <label>Nombre del Centro *</label>
              <input
                type="text"
                name="nombre"
                value={formulario.nombre}
                onChange={handleChange}
                required
                placeholder="Ej: Gym Fitness Center"
              />
            </div>
            <div className="config-centro-field">
              <label>Nombre Comercial</label>
              <input
                type="text"
                name="nombreComercial"
                value={formulario.nombreComercial}
                onChange={handleChange}
                placeholder="Opcional"
              />
            </div>
            <div className="config-centro-field">
              <label>NIF/CIF *</label>
              <input
                type="text"
                name="nif"
                value={formulario.nif}
                onChange={handleChange}
                required
                placeholder="Ej: B12345678"
              />
            </div>
            <div className="config-centro-field full-width">
              <label>Direccion *</label>
              <input
                type="text"
                name="direccion"
                value={formulario.direccion}
                onChange={handleChange}
                required
                placeholder="Calle, numero, piso..."
              />
            </div>
            <div className="config-centro-field">
              <label>Codigo Postal</label>
              <input
                type="text"
                name="codigoPostal"
                value={formulario.codigoPostal}
                onChange={handleChange}
                placeholder="Ej: 28001"
              />
            </div>
            <div className="config-centro-field">
              <label>Ciudad</label>
              <input
                type="text"
                name="ciudad"
                value={formulario.ciudad}
                onChange={handleChange}
                placeholder="Ej: Madrid"
              />
            </div>
            <div className="config-centro-field">
              <label>Provincia</label>
              <input
                type="text"
                name="provincia"
                value={formulario.provincia}
                onChange={handleChange}
                placeholder="Ej: Madrid"
              />
            </div>
            <div className="config-centro-field">
              <label>Pais</label>
              <input
                type="text"
                name="pais"
                value={formulario.pais}
                onChange={handleChange}
                placeholder="Ej: Espana"
              />
            </div>
          </div>
        </div>

        {/* Seccion: Contacto */}
        <div className="config-centro-seccion">
          <h2>Contacto</h2>
          <div className="config-centro-grid">
            <div className="config-centro-field">
              <label>Telefono</label>
              <input
                type="tel"
                name="telefono"
                value={formulario.telefono}
                onChange={handleChange}
                placeholder="Ej: 912345678"
              />
            </div>
            <div className="config-centro-field">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formulario.email}
                onChange={handleChange}
                placeholder="info@micentro.com"
              />
            </div>
            <div className="config-centro-field full-width">
              <label>Pagina Web</label>
              <input
                type="url"
                name="web"
                value={formulario.web}
                onChange={handleChange}
                placeholder="https://www.micentro.com"
              />
            </div>
          </div>
        </div>

        {/* Seccion: Datos bancarios */}
        <div className="config-centro-seccion">
          <h2>Datos Bancarios</h2>
          <p className="config-centro-seccion-desc">
            Estos datos apareceran en las facturas para facilitar el pago.
          </p>
          <div className="config-centro-grid">
            <div className="config-centro-field full-width">
              <label>IBAN</label>
              <input
                type="text"
                name="iban"
                value={formulario.iban}
                onChange={handleChange}
                placeholder="ES00 0000 0000 0000 0000 0000"
              />
            </div>
            <div className="config-centro-field">
              <label>Banco</label>
              <input
                type="text"
                name="banco"
                value={formulario.banco}
                onChange={handleChange}
                placeholder="Ej: Banco Santander"
              />
            </div>
            <div className="config-centro-field">
              <label>Titular de la cuenta</label>
              <input
                type="text"
                name="titular"
                value={formulario.titular}
                onChange={handleChange}
                placeholder="Nombre del titular"
              />
            </div>
          </div>
        </div>

        {/* Seccion: Personalizacion de facturas */}
        <div className="config-centro-seccion">
          <h2>Personalizacion de Facturas</h2>
          <div className="config-centro-grid">
            <div className="config-centro-field">
              <label>Prefijo de Factura</label>
              <input
                type="text"
                name="prefijoFactura"
                value={formulario.prefijoFactura}
                onChange={handleChange}
                placeholder="Ej: FAC-"
              />
            </div>
            <div className="config-centro-field">
              <label>Color Primario</label>
              <div className="config-centro-color-picker">
                <input
                  type="color"
                  name="colorPrimario"
                  value={formulario.colorPrimario}
                  onChange={handleChange}
                />
                <span>{formulario.colorPrimario}</span>
              </div>
            </div>
            <div className="config-centro-field full-width">
              <label>URL del Logo</label>
              <input
                type="url"
                name="logoUrl"
                value={formulario.logoUrl}
                onChange={handleChange}
                placeholder="https://micentro.com/logo.png"
              />
            </div>
            <div className="config-centro-field full-width">
              <label>Pie de Factura</label>
              <textarea
                name="pieFactura"
                value={formulario.pieFactura}
                onChange={handleChange}
                rows="2"
                placeholder="Texto legal o informativo que aparecera al pie de las facturas"
              />
            </div>
            <div className="config-centro-field full-width">
              <label>Condiciones de Pago</label>
              <textarea
                name="condicionesPago"
                value={formulario.condicionesPago}
                onChange={handleChange}
                rows="2"
                placeholder="Ej: Pago a 30 dias desde la fecha de emision"
              />
            </div>
          </div>
        </div>

        {/* Seccion: Configuracion de email */}
        <div className="config-centro-seccion">
          <h2>Configuracion de Email</h2>
          <div className={`config-centro-email-status ${emailStatus?.configurado ? 'ok' : 'error'}`}>
            {emailStatus?.configurado ? (
              <span>Configuracion SMTP correcta</span>
            ) : (
              <span>SMTP no configurado. Configure las variables de entorno SMTP_HOST, SMTP_USER y SMTP_PASS en el servidor.</span>
            )}
          </div>
          <div className="config-centro-grid">
            <div className="config-centro-field">
              <label>Nombre del Remitente</label>
              <input
                type="text"
                name="nombreRemitente"
                value={formulario.nombreRemitente}
                onChange={handleChange}
                placeholder="Nombre que aparecera en los emails"
              />
            </div>
            <div className="config-centro-field">
              <label>Email del Remitente</label>
              <input
                type="email"
                name="emailRemitente"
                value={formulario.emailRemitente}
                onChange={handleChange}
                placeholder="Email desde el que se enviaran las facturas"
              />
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div className="config-centro-actions">
          <button type="submit" className="btn-guardar" disabled={guardando}>
            {guardando ? 'Guardando...' : 'Guardar Configuracion'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ConfiguracionCentro;
