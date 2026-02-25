import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  clientesAPI,
  usersAPI,
  reservasAPI,
  facturacionAPI,
  medicionesAPI,
  productosAPI,
  clienteAuthAPI,
  entrenamientoAPI
} from '../services/api';
import { Pencil } from 'lucide-react';
import RegistrarEntrenamiento from './RegistrarEntrenamiento';
import ProgresoEjercicio from './ProgresoEjercicio';
import ModalEditarRutina from './ModalEditarRutina';
import './FichaCliente.css';

// Formatear fecha local sin problemas de zona horaria
const formatearFechaLocal = (fecha) => {
  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, '0');
  const day = String(fecha.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

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
  const [sesionesInfo, setSesionesInfo] = useState(null);
  const [editandoAcumuladas, setEditandoAcumuladas] = useState(false);
  const [valorAcumuladas, setValorAcumuladas] = useState(0);
  const [editandoSaldo, setEditandoSaldo] = useState(false);
  const [valorSaldo, setValorSaldo] = useState(0);

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
    fechaNacimiento: cliente.fechaNacimiento ? formatearFechaLocal(new Date(cliente.fechaNacimiento)) : '',
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
    fecha: formatearFechaLocal(new Date()),
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

  // Estados para portal de cliente
  const [portalInfo, setPortalInfo] = useState(null);
  const [mostrarFormPortal, setMostrarFormPortal] = useState(false);
  const [passwordPortal, setPasswordPortal] = useState('');
  const [cargandoPortal, setCargandoPortal] = useState(false);

  // Estados para entrenamiento
  const [rutinaActiva, setRutinaActiva] = useState(null);
  const [registrosEntrenamiento, setRegistrosEntrenamiento] = useState([]);
  const [prsCliente, setPrsCliente] = useState([]);
  const [cargandoEntrenamiento, setCargandoEntrenamiento] = useState(false);
  const [mostrarRegistrarEntrenamiento, setMostrarRegistrarEntrenamiento] = useState(false);
  const [progresoEjercicio, setProgresoEjercicio] = useState(null);
  const [mostrarModalRutina, setMostrarModalRutina] = useState(false);

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
    } else if (tabActivo === 'portal' && !portalInfo) {
      cargarEstadoPortal();
    } else if (tabActivo === 'membresia' && suscripcion && !sesionesInfo) {
      cargarSesionesInfo();
    } else if (tabActivo === 'entrenamiento' && registrosEntrenamiento.length === 0) {
      cargarDatosEntrenamiento();
    }
  }, [tabActivo, suscripcion]);

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

  const cargarEstadoPortal = async () => {
    try {
      setCargandoPortal(true);
      const res = await clienteAuthAPI.verificarEstado(cliente._id);
      setPortalInfo(res.data);
    } catch (err) {
      console.error('Error al cargar estado del portal:', err);
      setPortalInfo({ portalActivo: false });
    } finally {
      setCargandoPortal(false);
    }
  };

  const cargarDatosEntrenamiento = async () => {
    try {
      setCargandoEntrenamiento(true);
      const [rutinasRes, registrosRes, prsRes] = await Promise.all([
        entrenamientoAPI.obtenerRutinasPorCliente(cliente._id),
        entrenamientoAPI.obtenerRegistrosPorCliente(cliente._id, { limit: 10 }),
        entrenamientoAPI.obtenerPRs(cliente._id)
      ]);

      const activa = rutinasRes.data.find(r => r.activa);
      setRutinaActiva(activa || null);
      setRegistrosEntrenamiento(registrosRes.data || []);
      setPrsCliente(prsRes.data || []);
    } catch (err) {
      console.error('Error al cargar datos de entrenamiento:', err);
    } finally {
      setCargandoEntrenamiento(false);
    }
  };

  const cargarSesionesInfo = async () => {
    if (!suscripcion) return;

    try {
      const mesActual = new Date().getMonth() + 1;
      const anioActual = new Date().getFullYear();

      // Calcular sesiones contratadas este mes
      const diasEntrenamiento = suscripcion.diasEntrenamiento || [];
      let sesionesContratadas = 0;
      const ultimoDia = new Date(anioActual, mesActual, 0);

      for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
        const fecha = new Date(anioActual, mesActual - 1, dia);
        const diaSemana = fecha.getDay();
        if (diaSemana >= 1 && diaSemana <= 5) {
          const diaConvertido = diaSemana - 1;
          if (diasEntrenamiento.includes(diaConvertido)) {
            sesionesContratadas++;
          }
        }
      }

      // Obtener sesiones usadas (reservas confirmadas/completadas del mes)
      const reservasRes = await reservasAPI.obtenerTodas({ cliente: cliente._id });
      const inicioMes = new Date(anioActual, mesActual - 1, 1);
      const finMes = new Date(anioActual, mesActual, 0, 23, 59, 59);

      const sesionesUsadasMes = reservasRes.data.filter(r => {
        const fechaReserva = new Date(r.fecha);
        return fechaReserva >= inicioMes &&
          fechaReserva <= finMes &&
          ['confirmada', 'completada', 'pendiente'].includes(r.estado);
      }).length;

      // Obtener saldo real del servidor
      const saldoRes = await facturacionAPI.obtenerSaldoSesiones(cliente._id);
      const saldoSesiones = saldoRes.data.saldoSesiones || 0;

      const acumuladas = suscripcion.sesionesAcumuladas || 0;

      setSesionesInfo({
        contratadas: sesionesContratadas,
        acumuladas: acumuladas,
        usadasMes: sesionesUsadasMes,
        saldoSesiones: saldoSesiones,
        mes: mesActual,
        anio: anioActual
      });
      setValorAcumuladas(acumuladas);
      setValorSaldo(saldoSesiones);
    } catch (err) {
      console.error('Error al calcular sesiones:', err);
    }
  };

  const actualizarSesionesAcumuladas = async (nuevoValor) => {
    if (nuevoValor < 0) return;

    try {
      setCargando(true);
      await facturacionAPI.actualizarSesionesAcumuladas(cliente._id, nuevoValor);

      // Actualizar estado local
      setSuscripcion(prev => ({ ...prev, sesionesAcumuladas: nuevoValor }));
      setSesionesInfo(prev => ({
        ...prev,
        acumuladas: nuevoValor
      }));
      setValorAcumuladas(nuevoValor);
      setEditandoAcumuladas(false);
      setMensaje('Sesiones acumuladas actualizadas');
      setTimeout(() => setMensaje(''), 3000);
    } catch (err) {
      setError('Error al actualizar sesiones acumuladas');
    } finally {
      setCargando(false);
    }
  };

  const actualizarSaldoSesiones = async (nuevoValor) => {
    if (nuevoValor < 0) return;

    try {
      setCargando(true);
      const motivo = window.prompt('Motivo del ajuste (opcional):') || '';
      await facturacionAPI.actualizarSaldoSesiones(cliente._id, nuevoValor, motivo);

      setSesionesInfo(prev => ({
        ...prev,
        saldoSesiones: nuevoValor
      }));
      setValorSaldo(nuevoValor);
      setEditandoSaldo(false);
      setMensaje('Saldo de sesiones actualizado');
      setTimeout(() => setMensaje(''), 3000);
    } catch (err) {
      setError('Error al actualizar saldo de sesiones');
    } finally {
      setCargando(false);
    }
  };

  const crearAccesoPortal = async (e) => {
    e.preventDefault();
    if (!passwordPortal || passwordPortal.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    try {
      setCargandoPortal(true);
      setError('');
      await clienteAuthAPI.crearAcceso(cliente._id, passwordPortal);
      setMensaje('Acceso al portal creado correctamente');
      setMostrarFormPortal(false);
      setPasswordPortal('');
      cargarEstadoPortal();
      setTimeout(() => setMensaje(''), 3000);
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al crear acceso al portal');
    } finally {
      setCargandoPortal(false);
    }
  };

  const desactivarAccesoPortal = async () => {
    if (!window.confirm('¿Desactivar el acceso al portal para este cliente?')) return;
    try {
      setCargandoPortal(true);
      setError('');
      await clienteAuthAPI.desactivarAcceso(cliente._id);
      setMensaje('Acceso al portal desactivado');
      cargarEstadoPortal();
      setTimeout(() => setMensaje(''), 3000);
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al desactivar acceso');
    } finally {
      setCargandoPortal(false);
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
        fecha: formatearFechaLocal(new Date()),
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

  const eliminarReserva = async (id) => {
    if (!window.confirm('¿Eliminar esta reserva?')) return;
    try {
      await reservasAPI.eliminar(id);
      cargarReservas();
      setMensaje('Reserva eliminada correctamente');
      setTimeout(() => setMensaje(''), 3000);
    } catch (err) {
      setError('Error al eliminar reserva');
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
    { id: 'seguimiento', label: 'Seguimiento' },
    { id: 'entrenamiento', label: 'Entrenamiento' },
    { id: 'portal', label: 'Portal' }
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
                      <span className="info-value">{formatearDinero(suscripcion.precioUnitarioFijado)}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Dias de entrenamiento</span>
                      <span className="info-value">
                        {suscripcion.diasEntrenamiento?.map(d => ['Lun', 'Mar', 'Mie', 'Jue', 'Vie'][d]).join(', ') || 'No especificados'}
                      </span>
                    </div>
                  </div>

                  {/* Sección de Sesiones */}
                  {sesionesInfo && (
                    <div className="ficha-cliente-sesiones">
                      <h4 className="sesiones-titulo">
                        Sesiones del Mes ({sesionesInfo.mes}/{sesionesInfo.anio})
                      </h4>
                      <div className="sesiones-grid">
                        <div className="sesiones-item">
                          <span className="sesiones-label">Contratadas este mes</span>
                          <span className="sesiones-valor">{sesionesInfo.contratadas}</span>
                        </div>
                        <div className="sesiones-item">
                          <span className="sesiones-label">Acumuladas de meses ant.</span>
                          <div className="sesiones-valor-editable">
                            {editandoAcumuladas ? (
                              <div className="sesiones-input-group">
                                <input
                                  type="number"
                                  min="0"
                                  value={valorAcumuladas}
                                  onChange={(e) => setValorAcumuladas(parseInt(e.target.value) || 0)}
                                  className="sesiones-input"
                                />
                                <button
                                  className="btn-sesiones-ok"
                                  onClick={() => actualizarSesionesAcumuladas(valorAcumuladas)}
                                  disabled={cargando}
                                >
                                  OK
                                </button>
                                <button
                                  className="btn-sesiones-cancel"
                                  onClick={() => {
                                    setEditandoAcumuladas(false);
                                    setValorAcumuladas(sesionesInfo.acumuladas);
                                  }}
                                >
                                  X
                                </button>
                              </div>
                            ) : (
                              <div className="sesiones-controles">
                                <button
                                  className="btn-sesiones"
                                  onClick={() => actualizarSesionesAcumuladas(sesionesInfo.acumuladas - 1)}
                                  disabled={sesionesInfo.acumuladas <= 0 || cargando}
                                >
                                  -
                                </button>
                                <span className="sesiones-numero">{sesionesInfo.acumuladas}</span>
                                <button
                                  className="btn-sesiones"
                                  onClick={() => actualizarSesionesAcumuladas(sesionesInfo.acumuladas + 1)}
                                  disabled={cargando}
                                >
                                  +
                                </button>
                                <button
                                  className="btn-sesiones-edit"
                                  onClick={() => setEditandoAcumuladas(true)}
                                  title="Editar valor"
                                >
                                  <Pencil size={14} />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="sesiones-item">
                          <span className="sesiones-label">Usadas este mes</span>
                          <span className="sesiones-valor">{sesionesInfo.usadasMes}</span>
                        </div>
                        <div className="sesiones-item sesiones-disponibles">
                          <span className="sesiones-label">Saldo de sesiones</span>
                          <div className="sesiones-valor-editable">
                            {editandoSaldo ? (
                              <div className="sesiones-input-group">
                                <input
                                  type="number"
                                  min="0"
                                  value={valorSaldo}
                                  onChange={(e) => setValorSaldo(parseInt(e.target.value) || 0)}
                                  className="sesiones-input"
                                />
                                <button
                                  className="btn-sesiones-ok"
                                  onClick={() => actualizarSaldoSesiones(valorSaldo)}
                                  disabled={cargando}
                                >
                                  OK
                                </button>
                                <button
                                  className="btn-sesiones-cancel"
                                  onClick={() => {
                                    setEditandoSaldo(false);
                                    setValorSaldo(sesionesInfo.saldoSesiones);
                                  }}
                                >
                                  X
                                </button>
                              </div>
                            ) : (
                              <div className="sesiones-controles">
                                <span className="sesiones-numero sesiones-saldo">{sesionesInfo.saldoSesiones}</span>
                                {esGerente && (
                                  <button
                                    className="btn-sesiones-edit"
                                    onClick={() => setEditandoSaldo(true)}
                                    title="Ajustar saldo manualmente"
                                  >
                                    <Pencil size={14} />
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
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
                        <th>Acciones</th>
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
                          <td>
                            <button
                              className="btn-eliminar"
                              onClick={() => eliminarReserva(reserva._id)}
                              title="Eliminar reserva"
                            >
                              &times;
                            </button>
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

          {/* TAB: ENTRENAMIENTO */}
          {tabActivo === 'entrenamiento' && (
            <div className="ficha-cliente-seccion">
              {cargandoEntrenamiento ? (
                <div className="ficha-cliente-cargando">Cargando datos de entrenamiento...</div>
              ) : (
                <>
                  {/* Rutina activa */}
                  <div className="ficha-cliente-seccion-header">
                    <h3>Rutina Activa</h3>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {rutinaActiva && (
                        <button
                          className="btn-primary"
                          onClick={() => setMostrarRegistrarEntrenamiento(true)}
                        >
                          + Registrar Entrenamiento
                        </button>
                      )}
                    </div>
                  </div>

                  {rutinaActiva ? (
                    <div style={{ marginBottom: '24px' }}>
                      <div style={{
                        padding: '16px',
                        backgroundColor: '#f0f9ee',
                        borderRadius: '10px',
                        border: '1px solid #10b981'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <h4 style={{ margin: 0, color: '#1a1a2e', fontSize: '16px' }}>{rutinaActiva.nombre}</h4>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <span style={{
                              padding: '3px 10px',
                              borderRadius: '12px',
                              fontSize: '12px',
                              fontWeight: 600,
                              backgroundColor: '#10b981',
                              color: '#fff'
                            }}>Activa</span>
                          </div>
                        </div>
                        {rutinaActiva.objetivo && (
                          <p style={{ margin: '0 0 6px', fontSize: '13px', color: '#6b7280' }}>
                            Objetivo: {rutinaActiva.objetivo.replace(/_/g, ' ')}
                          </p>
                        )}
                        <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>
                          {rutinaActiva.diasPorSemana} dias/semana &middot; {rutinaActiva.dias?.length || 0} dias programados
                        </p>
                        {rutinaActiva.dias && rutinaActiva.dias.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
                            {rutinaActiva.dias.map((dia, idx) => (
                              <span key={idx} style={{
                                padding: '4px 10px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                backgroundColor: '#e8f5e3',
                                color: '#2d5a1e',
                                fontWeight: 500
                              }}>
                                {dia.nombre} ({dia.ejercicios?.length || 0} ejercicios)
                              </span>
                            ))}
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: '8px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #c8e6c0' }}>
                          <button
                            style={{
                              padding: '6px 14px',
                              backgroundColor: '#fff',
                              color: '#10b981',
                              border: '1px solid #10b981',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '13px',
                              fontWeight: 600
                            }}
                            onClick={() => setMostrarModalRutina(true)}
                          >
                            Ver / Editar Rutina
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      padding: '24px 16px',
                      backgroundColor: '#f9fafb',
                      borderRadius: '10px',
                      textAlign: 'center',
                      marginBottom: '24px'
                    }}>
                      <p style={{ color: '#6b7280', fontSize: '14px', margin: '0 0 12px' }}>
                        Este cliente no tiene una rutina activa asignada.
                      </p>
                      <button
                        className="btn-primary"
                        onClick={() => setMostrarModalRutina(true)}
                      >
                        + Crear Rutina
                      </button>
                    </div>
                  )}

                  {/* Records personales */}
                  {prsCliente.length > 0 && (
                    <div style={{ marginBottom: '24px' }}>
                      <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#1a1a2e', marginBottom: '12px' }}>
                        Records Personales (PRs)
                      </h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
                        {prsCliente.slice(0, 8).map((pr, idx) => (
                          <div
                            key={idx}
                            style={{
                              padding: '12px',
                              backgroundColor: '#f9fafb',
                              borderRadius: '8px',
                              borderLeft: '3px solid #FF6F00',
                              cursor: 'pointer'
                            }}
                            onClick={() => setProgresoEjercicio({
                              id: pr.ejercicio?._id || pr.ejercicioId,
                              nombre: pr.ejercicio?.nombre || pr.ejercicioNombre
                            })}
                            title="Ver progreso de este ejercicio"
                          >
                            <div style={{ fontSize: '13px', fontWeight: 600, color: '#1a1a2e', marginBottom: '4px' }}>
                              {pr.ejercicio?.nombre || pr.ejercicioNombre}
                            </div>
                            <div style={{ fontSize: '20px', fontWeight: 700, color: '#FF6F00' }}>
                              {pr.pesoMaximo} kg
                            </div>
                            <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                              {pr.fecha ? new Date(pr.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Últimos registros */}
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#1a1a2e', marginBottom: '12px' }}>
                      Ultimos Entrenamientos
                    </h3>
                    {registrosEntrenamiento.length > 0 ? (
                      <div className="ficha-cliente-tabla-wrapper">
                        <table className="ficha-cliente-tabla">
                          <thead>
                            <tr>
                              <th>Fecha</th>
                              <th>Dia</th>
                              <th>Ejercicios</th>
                              <th>Duracion</th>
                              <th>Estado</th>
                            </tr>
                          </thead>
                          <tbody>
                            {registrosEntrenamiento.map(registro => (
                              <tr key={registro._id}>
                                <td>{formatearFecha(registro.fecha)}</td>
                                <td>{registro.diaRutina || '-'}</td>
                                <td>{registro.ejercicios?.length || 0} ejercicios</td>
                                <td>{registro.duracionMinutos ? `${registro.duracionMinutos} min` : '-'}</td>
                                <td>
                                  <span className={`estado-badge ${registro.completado ? 'activa' : 'pendiente'}`}>
                                    {registro.completado ? 'Completado' : 'Parcial'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="ficha-cliente-vacio">
                        <p>No hay entrenamientos registrados para este cliente.</p>
                        <p>Registra el primer entrenamiento para comenzar el seguimiento.</p>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Modal Registrar Entrenamiento */}
              {mostrarRegistrarEntrenamiento && (
                <RegistrarEntrenamiento
                  clienteId={cliente._id}
                  clienteNombre={`${cliente.nombre} ${cliente.apellido}`}
                  onClose={() => setMostrarRegistrarEntrenamiento(false)}
                  onRegistrado={() => {
                    setMostrarRegistrarEntrenamiento(false);
                    cargarDatosEntrenamiento();
                  }}
                />
              )}

              {/* Modal Progreso Ejercicio */}
              {progresoEjercicio && (
                <ProgresoEjercicio
                  clienteId={cliente._id}
                  ejercicioId={progresoEjercicio.id}
                  ejercicioNombre={progresoEjercicio.nombre}
                  onClose={() => setProgresoEjercicio(null)}
                />
              )}

              {/* Modal Ver/Editar Rutina */}
              {mostrarModalRutina && (
                <ModalEditarRutina
                  clienteId={cliente._id}
                  clienteNombre={`${cliente.nombre} ${cliente.apellido}`}
                  rutina={rutinaActiva}
                  onClose={() => setMostrarModalRutina(false)}
                  onGuardado={() => {
                    setMostrarModalRutina(false);
                    cargarDatosEntrenamiento();
                  }}
                />
              )}
            </div>
          )}

          {/* TAB: PORTAL */}
          {tabActivo === 'portal' && (
            <div className="ficha-cliente-seccion">
              <div className="ficha-cliente-seccion-header">
                <h3>Acceso al Portal del Cliente</h3>
              </div>

              {cargandoPortal ? (
                <div className="ficha-cliente-cargando">Cargando estado del portal...</div>
              ) : (
                <div className="ficha-cliente-portal">
                  <div className="portal-info-card">
                    <div className="portal-estado">
                      <span className="portal-estado-label">Estado del portal:</span>
                      <span className={`estado-badge ${portalInfo?.portalActivo ? 'activa' : 'inactiva'}`}>
                        {portalInfo?.portalActivo ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>

                    {portalInfo?.portalActivo && (
                      <>
                        <div className="portal-info-item">
                          <span className="portal-info-label">Email de acceso:</span>
                          <span className="portal-info-value">{cliente.email}</span>
                        </div>
                        {portalInfo?.ultimoAcceso && (
                          <div className="portal-info-item">
                            <span className="portal-info-label">Ultimo acceso:</span>
                            <span className="portal-info-value">
                              {formatearFecha(portalInfo.ultimoAcceso)}
                            </span>
                          </div>
                        )}
                        <div className="portal-url-info">
                          <span className="portal-info-label">URL del portal:</span>
                          <code className="portal-url">/cliente/login</code>
                        </div>
                      </>
                    )}
                  </div>

                  {!portalInfo?.portalActivo ? (
                    <div className="portal-acciones">
                      {!mostrarFormPortal ? (
                        <div className="portal-crear-acceso">
                          <p className="portal-descripcion">
                            El cliente podra acceder a su propio portal donde vera su calendario,
                            sesiones, facturas y seguimiento de progreso.
                          </p>
                          <button
                            className="btn-primary"
                            onClick={() => setMostrarFormPortal(true)}
                          >
                            Crear Acceso al Portal
                          </button>
                        </div>
                      ) : (
                        <form onSubmit={crearAccesoPortal} className="portal-form">
                          <div className="ficha-cliente-form-group">
                            <label>Contraseña inicial para el cliente</label>
                            <input
                              type="password"
                              value={passwordPortal}
                              onChange={(e) => setPasswordPortal(e.target.value)}
                              placeholder="Minimo 6 caracteres"
                              minLength={6}
                              required
                            />
                            <small className="portal-hint">
                              El cliente usara su email ({cliente.email}) y esta contraseña para acceder.
                            </small>
                          </div>
                          <div className="portal-form-actions">
                            <button
                              type="button"
                              className="btn-secondary"
                              onClick={() => {
                                setMostrarFormPortal(false);
                                setPasswordPortal('');
                              }}
                            >
                              Cancelar
                            </button>
                            <button
                              type="submit"
                              className="btn-primary"
                              disabled={cargandoPortal}
                            >
                              {cargandoPortal ? 'Creando...' : 'Crear Acceso'}
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  ) : (
                    <div className="portal-acciones">
                      <div className="portal-acciones-activo">
                        <button
                          className="btn-primary"
                          onClick={() => setMostrarFormPortal(true)}
                        >
                          Cambiar Contraseña
                        </button>
                        <button
                          className="btn-danger"
                          onClick={desactivarAccesoPortal}
                          disabled={cargandoPortal}
                        >
                          Desactivar Acceso
                        </button>
                      </div>

                      {mostrarFormPortal && (
                        <form onSubmit={crearAccesoPortal} className="portal-form">
                          <div className="ficha-cliente-form-group">
                            <label>Nueva contraseña</label>
                            <input
                              type="password"
                              value={passwordPortal}
                              onChange={(e) => setPasswordPortal(e.target.value)}
                              placeholder="Minimo 6 caracteres"
                              minLength={6}
                              required
                            />
                          </div>
                          <div className="portal-form-actions">
                            <button
                              type="button"
                              className="btn-secondary"
                              onClick={() => {
                                setMostrarFormPortal(false);
                                setPasswordPortal('');
                              }}
                            >
                              Cancelar
                            </button>
                            <button
                              type="submit"
                              className="btn-primary"
                              disabled={cargandoPortal}
                            >
                              {cargandoPortal ? 'Guardando...' : 'Guardar'}
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  )}
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
