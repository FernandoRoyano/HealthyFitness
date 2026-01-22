import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  clientesAPI,
  usersAPI,
  reservasAPI,
  facturacionAPI,
  medicionesAPI,
  productosAPI
} from '../services/api';
import './FichaCliente.css';

function FichaCliente({ cliente, onClose, onClienteActualizado }) {
  const { usuario } = useAuth();
  const esGerente = usuario?.rol === 'gerente';

  // Estado de tabs
  const [tabActivo, setTabActivo] = useState('datos');

  // Estados de datos
  const [entrenadores, setEntrenadores] = useState([]);
  const [productos, setProductos] = useState([]);
  const [reservas, setReservas] = useState([]);
  const [facturas, setFacturas] = useState([]);
  const [suscripcion, setSuscripcion] = useState(null);
  const [mediciones, setMediciones] = useState([]);
  const [asistencias, setAsistencias] = useState([]);

  // Estados de carga
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  // Formularios
  const [formularioCliente, setFormularioCliente] = useState({
    nombre: cliente.nombre || '',
    apellido: cliente.apellido || '',
    email: cliente.email || '',
    telefono: cliente.telefono || '',
    fechaNacimiento: cliente.fechaNacimiento ? new Date(cliente.fechaNacimiento).toISOString().split('T')[0] : '',
    genero: cliente.genero || '',
    direccion: cliente.direccion || '',
    peso: cliente.peso || '',
    altura: cliente.altura || '',
    nivelActividad: cliente.nivelActividad || '',
    objetivos: cliente.objetivos || '',
    condicionesMedicas: cliente.condicionesMedicas || '',
    notas: cliente.notas || '',
    entrenador: cliente.entrenador?._id || cliente.entrenador || '',
    numeroCuenta: cliente.numeroCuenta || ''
  });

  const [formularioMedicion, setFormularioMedicion] = useState({
    fecha: new Date().toISOString().split('T')[0],
    peso: '',
    altura: '',
    pecho: '',
    cintura: '',
    cadera: '',
    brazo: '',
    muslo: '',
    grasaCorporal: '',
    masaMuscular: '',
    agua: '',
    grasaVisceral: '',
    notas: ''
  });

  const [mostrarFormMedicion, setMostrarFormMedicion] = useState(false);

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatosIniciales();
  }, [cliente._id]);

  // Cargar datos del tab activo
  useEffect(() => {
    if (tabActivo === 'reservas' && reservas.length === 0) {
      cargarReservas();
    } else if (tabActivo === 'facturas' && facturas.length === 0) {
      cargarFacturas();
    } else if (tabActivo === 'asistencias' && asistencias.length === 0) {
      cargarAsistencias();
    } else if (tabActivo === 'seguimiento' && mediciones.length === 0) {
      cargarMediciones();
    }
  }, [tabActivo]);

  const cargarDatosIniciales = async () => {
    try {
      const [entrenadoresRes, productosRes, suscripcionRes] = await Promise.all([
        usersAPI.obtenerEntrenadores(),
        productosAPI.obtenerTodos(),
        facturacionAPI.obtenerSuscripcionCliente(cliente._id).catch(() => ({ data: null }))
      ]);
      setEntrenadores(entrenadoresRes.data);
      setProductos(productosRes.data);
      setSuscripcion(suscripcionRes.data);
    } catch (err) {
      console.error('Error cargando datos:', err);
    }
  };

  const cargarReservas = async () => {
    try {
      setCargando(true);
      const res = await reservasAPI.obtenerTodas({ cliente: cliente._id });
      setReservas(res.data);
    } catch (err) {
      setError('Error al cargar reservas');
    } finally {
      setCargando(false);
    }
  };

  const cargarFacturas = async () => {
    try {
      setCargando(true);
      const res = await facturacionAPI.obtenerFacturas({ clienteId: cliente._id });
      setFacturas(res.data);
    } catch (err) {
      setError('Error al cargar facturas');
    } finally {
      setCargando(false);
    }
  };

  const cargarAsistencias = async () => {
    try {
      setCargando(true);
      const mesActual = new Date().getMonth() + 1;
      const anioActual = new Date().getFullYear();
      const res = await facturacionAPI.obtenerAsistenciasMes(cliente._id, mesActual, anioActual);
      setAsistencias(res.data);
    } catch (err) {
      setError('Error al cargar asistencias');
    } finally {
      setCargando(false);
    }
  };

  const cargarMediciones = async () => {
    try {
      setCargando(true);
      const res = await medicionesAPI.obtenerPorCliente(cliente._id);
      setMediciones(res.data);
    } catch (err) {
      setError('Error al cargar mediciones');
    } finally {
      setCargando(false);
    }
  };

  const handleChangeCliente = (e) => {
    setFormularioCliente({
      ...formularioCliente,
      [e.target.name]: e.target.value
    });
  };

  const handleChangeMedicion = (e) => {
    setFormularioMedicion({
      ...formularioMedicion,
      [e.target.name]: e.target.value
    });
  };

  const guardarCliente = async (e) => {
    e.preventDefault();
    try {
      setCargando(true);
      setError('');
      await clientesAPI.actualizar(cliente._id, formularioCliente);
      setMensaje('Cliente actualizado correctamente');
      onClienteActualizado && onClienteActualizado();
      setTimeout(() => setMensaje(''), 3000);
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al guardar cliente');
    } finally {
      setCargando(false);
    }
  };

  const guardarMedicion = async (e) => {
    e.preventDefault();
    try {
      setCargando(true);
      setError('');
      await medicionesAPI.crear(cliente._id, formularioMedicion);
      setMensaje('Medicion registrada correctamente');
      setMostrarFormMedicion(false);
      setFormularioMedicion({
        fecha: new Date().toISOString().split('T')[0],
        peso: '',
        altura: '',
        pecho: '',
        cintura: '',
        cadera: '',
        brazo: '',
        muslo: '',
        grasaCorporal: '',
        masaMuscular: '',
        agua: '',
        grasaVisceral: '',
        notas: ''
      });
      cargarMediciones();
      setTimeout(() => setMensaje(''), 3000);
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al registrar medicion');
    } finally {
      setCargando(false);
    }
  };

  const eliminarMedicion = async (id) => {
    if (!window.confirm('¿Eliminar esta medicion?')) return;
    try {
      await medicionesAPI.eliminar(id);
      cargarMediciones();
    } catch (err) {
      setError('Error al eliminar medicion');
    }
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatearDinero = (cantidad) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(cantidad || 0);
  };

  const tabs = [
    { id: 'datos', label: 'Datos' },
    { id: 'membresia', label: 'Membresia' },
    { id: 'reservas', label: 'Reservas' },
    { id: 'facturas', label: 'Facturas' },
    { id: 'asistencias', label: 'Asistencias' },
    { id: 'seguimiento', label: 'Seguimiento' }
  ];

  return (
    <div className="ficha-cliente-overlay">
      <div className="ficha-cliente-modal">
        {/* Header */}
        <div className="ficha-cliente-header">
          <div className="ficha-cliente-header-info">
            <div className="ficha-cliente-avatar">
              {cliente.nombre?.[0]}{cliente.apellido?.[0]}
            </div>
            <div>
              <h2 className="ficha-cliente-nombre">{cliente.nombre} {cliente.apellido}</h2>
              <p className="ficha-cliente-email">{cliente.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="ficha-cliente-close">&times;</button>
        </div>

        {/* Tabs */}
        <div className="ficha-cliente-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`ficha-cliente-tab ${tabActivo === tab.id ? 'activo' : ''}`}
              onClick={() => setTabActivo(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Mensajes */}
        {error && <div className="ficha-cliente-error">{error}</div>}
        {mensaje && <div className="ficha-cliente-mensaje">{mensaje}</div>}

        {/* Contenido */}
        <div className="ficha-cliente-contenido">
          {/* TAB: DATOS */}
          {tabActivo === 'datos' && (
            <form onSubmit={guardarCliente} className="ficha-cliente-form">
              <div className="ficha-cliente-form-grid">
                <div className="ficha-cliente-form-group">
                  <label>Nombre</label>
                  <input
                    type="text"
                    name="nombre"
                    value={formularioCliente.nombre}
                    onChange={handleChangeCliente}
                    required
                  />
                </div>
                <div className="ficha-cliente-form-group">
                  <label>Apellido</label>
                  <input
                    type="text"
                    name="apellido"
                    value={formularioCliente.apellido}
                    onChange={handleChangeCliente}
                    required
                  />
                </div>
                <div className="ficha-cliente-form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formularioCliente.email}
                    onChange={handleChangeCliente}
                    required
                  />
                </div>
                <div className="ficha-cliente-form-group">
                  <label>Telefono</label>
                  <input
                    type="tel"
                    name="telefono"
                    value={formularioCliente.telefono}
                    onChange={handleChangeCliente}
                  />
                </div>
                <div className="ficha-cliente-form-group">
                  <label>Fecha de Nacimiento</label>
                  <input
                    type="date"
                    name="fechaNacimiento"
                    value={formularioCliente.fechaNacimiento}
                    onChange={handleChangeCliente}
                  />
                </div>
                <div className="ficha-cliente-form-group">
                  <label>Genero</label>
                  <select
                    name="genero"
                    value={formularioCliente.genero}
                    onChange={handleChangeCliente}
                  >
                    <option value="">Seleccionar</option>
                    <option value="masculino">Masculino</option>
                    <option value="femenino">Femenino</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
                <div className="ficha-cliente-form-group full-width">
                  <label>Direccion</label>
                  <input
                    type="text"
                    name="direccion"
                    value={formularioCliente.direccion}
                    onChange={handleChangeCliente}
                  />
                </div>
                <div className="ficha-cliente-form-group">
                  <label>Peso (kg)</label>
                  <input
                    type="number"
                    name="peso"
                    value={formularioCliente.peso}
                    onChange={handleChangeCliente}
                    step="0.1"
                  />
                </div>
                <div className="ficha-cliente-form-group">
                  <label>Altura (cm)</label>
                  <input
                    type="number"
                    name="altura"
                    value={formularioCliente.altura}
                    onChange={handleChangeCliente}
                  />
                </div>
                <div className="ficha-cliente-form-group">
                  <label>Nivel de Actividad</label>
                  <select
                    name="nivelActividad"
                    value={formularioCliente.nivelActividad}
                    onChange={handleChangeCliente}
                  >
                    <option value="">Seleccionar</option>
                    <option value="sedentario">Sedentario</option>
                    <option value="ligero">Ligero</option>
                    <option value="moderado">Moderado</option>
                    <option value="activo">Activo</option>
                    <option value="muy_activo">Muy Activo</option>
                  </select>
                </div>
                <div className="ficha-cliente-form-group">
                  <label>Entrenador</label>
                  <select
                    name="entrenador"
                    value={formularioCliente.entrenador}
                    onChange={handleChangeCliente}
                  >
                    <option value="">Sin asignar</option>
                    {entrenadores.map(ent => (
                      <option key={ent._id} value={ent._id}>{ent.nombre}</option>
                    ))}
                  </select>
                </div>
                <div className="ficha-cliente-form-group full-width">
                  <label>Objetivos</label>
                  <textarea
                    name="objetivos"
                    value={formularioCliente.objetivos}
                    onChange={handleChangeCliente}
                    rows="2"
                  />
                </div>
                <div className="ficha-cliente-form-group full-width">
                  <label>Condiciones Medicas</label>
                  <textarea
                    name="condicionesMedicas"
                    value={formularioCliente.condicionesMedicas}
                    onChange={handleChangeCliente}
                    rows="2"
                  />
                </div>
                <div className="ficha-cliente-form-group full-width">
                  <label>Notas</label>
                  <textarea
                    name="notas"
                    value={formularioCliente.notas}
                    onChange={handleChangeCliente}
                    rows="2"
                  />
                </div>
                <div className="ficha-cliente-form-group full-width">
                  <label>Numero de Cuenta (IBAN)</label>
                  <input
                    type="text"
                    name="numeroCuenta"
                    value={formularioCliente.numeroCuenta}
                    onChange={handleChangeCliente}
                    placeholder="ES00 0000 0000 0000 0000 0000"
                  />
                </div>
              </div>
              <div className="ficha-cliente-form-actions">
                <button type="submit" className="btn-primary" disabled={cargando}>
                  {cargando ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          )}

          {/* TAB: MEMBRESIA */}
          {tabActivo === 'membresia' && (
            <div className="ficha-cliente-seccion">
              {suscripcion ? (
                <div className="ficha-cliente-membresia">
                  <div className="ficha-cliente-membresia-estado">
                    <span className={`estado-badge ${suscripcion.estado}`}>
                      {suscripcion.estado}
                    </span>
                  </div>
                  <div className="ficha-cliente-membresia-info">
                    <div className="info-item">
                      <span className="info-label">Producto</span>
                      <span className="info-value">{suscripcion.producto?.nombre || 'Sin producto'}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Dias por semana</span>
                      <span className="info-value">{suscripcion.diasPorSemana}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Precio por sesion</span>
                      <span className="info-value">{formatearDinero(suscripcion.precioSesion)}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Dias de entrenamiento</span>
                      <span className="info-value">
                        {suscripcion.diasEspecificos?.join(', ') || 'No especificados'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="ficha-cliente-vacio">
                  <p>Este cliente no tiene membresia activa.</p>
                  <p>Puedes asignarle una desde el modulo de Facturacion.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB: RESERVAS */}
          {tabActivo === 'reservas' && (
            <div className="ficha-cliente-seccion">
              {cargando ? (
                <div className="ficha-cliente-cargando">Cargando reservas...</div>
              ) : reservas.length > 0 ? (
                <div className="ficha-cliente-tabla-wrapper">
                  <table className="ficha-cliente-tabla">
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Hora</th>
                        <th>Entrenador</th>
                        <th>Tipo</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reservas.map(reserva => (
                        <tr key={reserva._id}>
                          <td>{formatearFecha(reserva.fecha)}</td>
                          <td>{reserva.horaInicio} - {reserva.horaFin}</td>
                          <td>{reserva.entrenador?.nombre || '-'}</td>
                          <td>{reserva.tipoSesion}</td>
                          <td>
                            <span className={`estado-badge ${reserva.estado}`}>
                              {reserva.estado}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="ficha-cliente-vacio">
                  <p>No hay reservas registradas para este cliente.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB: FACTURAS */}
          {tabActivo === 'facturas' && (
            <div className="ficha-cliente-seccion">
              {cargando ? (
                <div className="ficha-cliente-cargando">Cargando facturas...</div>
              ) : facturas.length > 0 ? (
                <div className="ficha-cliente-tabla-wrapper">
                  <table className="ficha-cliente-tabla">
                    <thead>
                      <tr>
                        <th>Numero</th>
                        <th>Periodo</th>
                        <th>Total</th>
                        <th>Pagado</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {facturas.map(factura => (
                        <tr key={factura._id}>
                          <td>{factura.numeroFactura}</td>
                          <td>{factura.mes}/{factura.anio}</td>
                          <td>{formatearDinero(factura.totalAPagar)}</td>
                          <td>{formatearDinero(factura.totalPagado)}</td>
                          <td>
                            <span className={`estado-badge ${factura.estado}`}>
                              {factura.estado}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="ficha-cliente-vacio">
                  <p>No hay facturas registradas para este cliente.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB: ASISTENCIAS */}
          {tabActivo === 'asistencias' && (
            <div className="ficha-cliente-seccion">
              {cargando ? (
                <div className="ficha-cliente-cargando">Cargando asistencias...</div>
              ) : asistencias.length > 0 ? (
                <div>
                  <div className="ficha-cliente-resumen-asistencias">
                    <div className="resumen-item asistio">
                      <span className="resumen-numero">
                        {asistencias.filter(a => a.estado === 'asistio').length}
                      </span>
                      <span className="resumen-label">Asistio</span>
                    </div>
                    <div className="resumen-item no-asistio">
                      <span className="resumen-numero">
                        {asistencias.filter(a => a.estado === 'no_asistio').length}
                      </span>
                      <span className="resumen-label">No asistio</span>
                    </div>
                    <div className="resumen-item cancelada">
                      <span className="resumen-numero">
                        {asistencias.filter(a => a.estado === 'cancelada_cliente' || a.estado === 'cancelada_centro').length}
                      </span>
                      <span className="resumen-label">Canceladas</span>
                    </div>
                  </div>
                  <div className="ficha-cliente-tabla-wrapper">
                    <table className="ficha-cliente-tabla">
                      <thead>
                        <tr>
                          <th>Fecha</th>
                          <th>Hora</th>
                          <th>Estado</th>
                          <th>Recuperada</th>
                        </tr>
                      </thead>
                      <tbody>
                        {asistencias.map(asistencia => (
                          <tr key={asistencia._id}>
                            <td>{formatearFecha(asistencia.fecha)}</td>
                            <td>{asistencia.horaInicio}</td>
                            <td>
                              <span className={`estado-badge ${asistencia.estado}`}>
                                {asistencia.estado.replace('_', ' ')}
                              </span>
                            </td>
                            <td>{asistencia.recuperada ? 'Si' : 'No'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="ficha-cliente-vacio">
                  <p>No hay asistencias registradas este mes.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB: SEGUIMIENTO */}
          {tabActivo === 'seguimiento' && (
            <div className="ficha-cliente-seccion">
              <div className="ficha-cliente-seccion-header">
                <h3>Mediciones Corporales</h3>
                <button
                  className="btn-primary"
                  onClick={() => setMostrarFormMedicion(!mostrarFormMedicion)}
                >
                  {mostrarFormMedicion ? 'Cancelar' : '+ Nueva Medicion'}
                </button>
              </div>

              {mostrarFormMedicion && (
                <form onSubmit={guardarMedicion} className="ficha-cliente-form-medicion">
                  <div className="ficha-cliente-form-grid">
                    <div className="ficha-cliente-form-group">
                      <label>Fecha</label>
                      <input
                        type="date"
                        name="fecha"
                        value={formularioMedicion.fecha}
                        onChange={handleChangeMedicion}
                        required
                      />
                    </div>
                    <div className="ficha-cliente-form-group">
                      <label>Peso (kg)</label>
                      <input
                        type="number"
                        name="peso"
                        value={formularioMedicion.peso}
                        onChange={handleChangeMedicion}
                        step="0.1"
                      />
                    </div>
                    <div className="ficha-cliente-form-group">
                      <label>Altura (cm)</label>
                      <input
                        type="number"
                        name="altura"
                        value={formularioMedicion.altura}
                        onChange={handleChangeMedicion}
                      />
                    </div>
                    <div className="ficha-cliente-form-group">
                      <label>Pecho (cm)</label>
                      <input
                        type="number"
                        name="pecho"
                        value={formularioMedicion.pecho}
                        onChange={handleChangeMedicion}
                        step="0.1"
                      />
                    </div>
                    <div className="ficha-cliente-form-group">
                      <label>Cintura (cm)</label>
                      <input
                        type="number"
                        name="cintura"
                        value={formularioMedicion.cintura}
                        onChange={handleChangeMedicion}
                        step="0.1"
                      />
                    </div>
                    <div className="ficha-cliente-form-group">
                      <label>Cadera (cm)</label>
                      <input
                        type="number"
                        name="cadera"
                        value={formularioMedicion.cadera}
                        onChange={handleChangeMedicion}
                        step="0.1"
                      />
                    </div>
                    <div className="ficha-cliente-form-group">
                      <label>Brazo (cm)</label>
                      <input
                        type="number"
                        name="brazo"
                        value={formularioMedicion.brazo}
                        onChange={handleChangeMedicion}
                        step="0.1"
                      />
                    </div>
                    <div className="ficha-cliente-form-group">
                      <label>Muslo (cm)</label>
                      <input
                        type="number"
                        name="muslo"
                        value={formularioMedicion.muslo}
                        onChange={handleChangeMedicion}
                        step="0.1"
                      />
                    </div>
                    <div className="ficha-cliente-form-group">
                      <label>Grasa Corporal (%)</label>
                      <input
                        type="number"
                        name="grasaCorporal"
                        value={formularioMedicion.grasaCorporal}
                        onChange={handleChangeMedicion}
                        step="0.1"
                      />
                    </div>
                    <div className="ficha-cliente-form-group">
                      <label>Masa Muscular (kg)</label>
                      <input
                        type="number"
                        name="masaMuscular"
                        value={formularioMedicion.masaMuscular}
                        onChange={handleChangeMedicion}
                        step="0.1"
                      />
                    </div>
                    <div className="ficha-cliente-form-group">
                      <label>Agua (%)</label>
                      <input
                        type="number"
                        name="agua"
                        value={formularioMedicion.agua}
                        onChange={handleChangeMedicion}
                        step="0.1"
                      />
                    </div>
                    <div className="ficha-cliente-form-group">
                      <label>Grasa Visceral</label>
                      <input
                        type="number"
                        name="grasaVisceral"
                        value={formularioMedicion.grasaVisceral}
                        onChange={handleChangeMedicion}
                      />
                    </div>
                    <div className="ficha-cliente-form-group full-width">
                      <label>Notas</label>
                      <textarea
                        name="notas"
                        value={formularioMedicion.notas}
                        onChange={handleChangeMedicion}
                        rows="2"
                      />
                    </div>
                  </div>
                  <div className="ficha-cliente-form-actions">
                    <button type="submit" className="btn-primary" disabled={cargando}>
                      {cargando ? 'Guardando...' : 'Guardar Medicion'}
                    </button>
                  </div>
                </form>
              )}

              {cargando && !mostrarFormMedicion ? (
                <div className="ficha-cliente-cargando">Cargando mediciones...</div>
              ) : mediciones.length > 0 ? (
                <div className="ficha-cliente-tabla-wrapper">
                  <table className="ficha-cliente-tabla">
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Peso</th>
                        <th>IMC</th>
                        <th>Grasa %</th>
                        <th>Musculo</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mediciones.map(med => (
                        <tr key={med._id}>
                          <td>{formatearFecha(med.fecha)}</td>
                          <td>{med.peso ? `${med.peso} kg` : '-'}</td>
                          <td>{med.imc ? med.imc.toFixed(1) : '-'}</td>
                          <td>{med.grasaCorporal ? `${med.grasaCorporal}%` : '-'}</td>
                          <td>{med.masaMuscular ? `${med.masaMuscular} kg` : '-'}</td>
                          <td>
                            <button
                              className="btn-eliminar"
                              onClick={() => eliminarMedicion(med._id)}
                              title="Eliminar"
                            >
                              &times;
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : !mostrarFormMedicion && (
                <div className="ficha-cliente-vacio">
                  <p>No hay mediciones registradas para este cliente.</p>
                  <p>Registra la primera medicion para hacer seguimiento del progreso.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FichaCliente;
