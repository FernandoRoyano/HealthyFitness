import { useState, useEffect } from 'react';
import { facturacionAPI, clientesAPI, productosAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { BarChart3, Banknote, Clock, FileText, Eye, Printer, Mail, Pencil, CreditCard, Send, Trash2, Check } from 'lucide-react';
import CalendarioAsistencias from '../components/CalendarioAsistencias';
import './Facturacion.css';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

function Facturacion() {
  const { usuario } = useAuth();
  const esGerente = usuario?.rol === 'gerente';

  // Estado del período seleccionado
  const [mesSeleccionado, setMesSeleccionado] = useState(new Date().getMonth() + 1);
  const [anioSeleccionado, setAnioSeleccionado] = useState(new Date().getFullYear());

  // Tab activo
  const [tabActivo, setTabActivo] = useState('facturas');

  // Estados de datos
  const [facturas, setFacturas] = useState([]);
  const [suscripciones, setSuscripciones] = useState([]);
  const [resumenMes, setResumenMes] = useState(null);
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);

  // Estados de UI
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  // Modal de suscripción
  const [modalSuscripcion, setModalSuscripcion] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [formSuscripcion, setFormSuscripcion] = useState({
    productoId: '',
    diasPorSemana: 2,
    diasEntrenamiento: [],
    notas: ''
  });

  // Modal de detalle factura
  const [modalFactura, setModalFactura] = useState(false);
  const [facturaDetalle, setFacturaDetalle] = useState(null);

  // Modal de pago
  const [modalPago, setModalPago] = useState(false);
  const [formPago, setFormPago] = useState({
    monto: '',
    metodoPago: 'transferencia',
    referencia: ''
  });

  // Modal de nueva factura manual
  const [modalNuevaFactura, setModalNuevaFactura] = useState(false);
  const [formNuevaFactura, setFormNuevaFactura] = useState({
    clienteId: '',
    sesiones: '',
    precioUnitario: '',
    descuento: '',
    notas: ''
  });
  const [suscripcionCliente, setSuscripcionCliente] = useState(null);
  const [buscandoSuscripcion, setBuscandoSuscripcion] = useState(false);
  const [diasAsistenciaNueva, setDiasAsistenciaNueva] = useState([]);

  // Modal de editar factura
  const [modalEditarFactura, setModalEditarFactura] = useState(false);
  const [facturaEditando, setFacturaEditando] = useState(null);
  const [formEditarFactura, setFormEditarFactura] = useState({
    sesiones: '',
    precioUnitario: '',
    descuento: '',
    notas: ''
  });
  const [diasAsistenciaEditar, setDiasAsistenciaEditar] = useState([]);

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatos();
  }, [mesSeleccionado, anioSeleccionado]);

  useEffect(() => {
    cargarProductos();
    cargarClientes();
  }, []);

  const cargarDatos = async () => {
    setCargando(true);
    setError('');
    try {
      const [facturasRes, suscripcionesRes, resumenRes] = await Promise.all([
        facturacionAPI.obtenerFacturas({ mes: mesSeleccionado, anio: anioSeleccionado }),
        facturacionAPI.obtenerSuscripciones({ estado: 'activa' }),
        facturacionAPI.obtenerResumenMes(mesSeleccionado, anioSeleccionado)
      ]);

      setFacturas(facturasRes.data);
      setSuscripciones(suscripcionesRes.data);
      setResumenMes(resumenRes.data);
    } catch (err) {
      console.error('Error al cargar datos:', err);
      setError('Error al cargar los datos');
    } finally {
      setCargando(false);
    }
  };

  const cargarProductos = async () => {
    try {
      const res = await productosAPI.obtenerTodos({ activo: true });
      setProductos(res.data);
    } catch (err) {
      console.error('Error al cargar productos:', err);
    }
  };

  const cargarClientes = async () => {
    try {
      const res = await clientesAPI.obtenerTodos();
      setClientes(res.data.filter(c => c.activo));
    } catch (err) {
      console.error('Error al cargar clientes:', err);
    }
  };

  // Generar facturas masivas
  const handleGenerarFacturas = async () => {
    if (!window.confirm(`¿Generar facturas para ${MESES[mesSeleccionado - 1]} ${anioSeleccionado}?`)) {
      return;
    }

    setCargando(true);
    setError('');
    setMensaje('');

    try {
      const res = await facturacionAPI.generarFacturasMasivas(mesSeleccionado, anioSeleccionado);
      setMensaje(res.data.mensaje);
      cargarDatos();
    } catch (err) {
      console.error('Error al generar facturas:', err);
      setError(err.response?.data?.mensaje || 'Error al generar facturas');
    } finally {
      setCargando(false);
    }
  };

  // Abrir modal de suscripción
  const abrirModalSuscripcion = async (cliente) => {
    setClienteSeleccionado(cliente);
    setFormSuscripcion({
      productoId: '',
      diasPorSemana: 2,
      diasEntrenamiento: [],
      notas: ''
    });

    // Si el cliente ya tiene suscripción, cargar sus datos
    try {
      const res = await facturacionAPI.obtenerSuscripcionCliente(cliente._id);
      if (res.data.existe) {
        const sus = res.data;
        setFormSuscripcion({
          productoId: sus.producto?._id || '',
          diasPorSemana: sus.diasPorSemana || 2,
          diasEntrenamiento: sus.diasEntrenamiento || [],
          notas: sus.notas || ''
        });
      }
    } catch (err) {
      // Cliente sin suscripción
    }

    setModalSuscripcion(true);
  };

  // Guardar suscripción
  const handleGuardarSuscripcion = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError('');

    try {
      await facturacionAPI.guardarSuscripcion(clienteSeleccionado._id, formSuscripcion);
      setMensaje('Suscripción guardada correctamente');
      setModalSuscripcion(false);
      cargarDatos();
    } catch (err) {
      console.error('Error al guardar suscripción:', err);
      setError(err.response?.data?.mensaje || 'Error al guardar suscripción');
    } finally {
      setCargando(false);
    }
  };

  // Toggle día de entrenamiento
  const toggleDiaEntrenamiento = (dia) => {
    const dias = [...formSuscripcion.diasEntrenamiento];
    const index = dias.indexOf(dia);
    if (index > -1) {
      dias.splice(index, 1);
    } else if (dias.length < formSuscripcion.diasPorSemana) {
      dias.push(dia);
    }
    setFormSuscripcion({ ...formSuscripcion, diasEntrenamiento: dias.sort() });
  };

  // Ver detalle de factura
  const verDetalleFactura = async (factura) => {
    try {
      const res = await facturacionAPI.obtenerFacturaPorId(factura._id);
      setFacturaDetalle(res.data);
      setModalFactura(true);
    } catch (err) {
      console.error('Error al cargar factura:', err);
      setError('Error al cargar el detalle de la factura');
    }
  };

  // Abrir modal de pago
  const abrirModalPago = (factura) => {
    setFacturaDetalle(factura);
    setFormPago({
      monto: (factura.totalAPagar - factura.totalPagado).toFixed(2),
      metodoPago: 'transferencia',
      referencia: ''
    });
    setModalPago(true);
  };

  // Registrar pago
  const handleRegistrarPago = async (e) => {
    e.preventDefault();
    setCargando(true);

    try {
      await facturacionAPI.registrarPago(facturaDetalle._id, formPago);
      setMensaje('Pago registrado correctamente');
      setModalPago(false);
      cargarDatos();
    } catch (err) {
      console.error('Error al registrar pago:', err);
      setError(err.response?.data?.mensaje || 'Error al registrar pago');
    } finally {
      setCargando(false);
    }
  };

  // Abrir modal nueva factura
  const abrirModalNuevaFactura = () => {
    setFormNuevaFactura({
      clienteId: '',
      sesiones: '',
      precioUnitario: '',
      descuento: '',
      notas: ''
    });
    setSuscripcionCliente(null);
    setDiasAsistenciaNueva([]);
    setModalNuevaFactura(true);
  };

  // Manejar cambio de días en calendario nueva factura
  const handleDiasAsistenciaNuevaChange = (dias) => {
    setDiasAsistenciaNueva(dias);
    setFormNuevaFactura(prev => ({
      ...prev,
      sesiones: dias.length.toString()
    }));
  };

  // Buscar suscripción cuando cambia el cliente
  const handleClienteChange = async (clienteId) => {
    setFormNuevaFactura(prev => ({ ...prev, clienteId }));
    setSuscripcionCliente(null);

    if (!clienteId) {
      setFormNuevaFactura(prev => ({ ...prev, precioUnitario: '' }));
      return;
    }

    setBuscandoSuscripcion(true);
    try {
      const res = await facturacionAPI.obtenerSuscripcionCliente(clienteId);
      if (res.data.existe) {
        setSuscripcionCliente(res.data);
        setFormNuevaFactura(prev => ({
          ...prev,
          precioUnitario: res.data.precioUnitarioFijado?.toString() || ''
        }));
      } else {
        setSuscripcionCliente(null);
        setFormNuevaFactura(prev => ({ ...prev, precioUnitario: '' }));
      }
    } catch (err) {
      console.error('Error al buscar suscripción:', err);
      setSuscripcionCliente(null);
    } finally {
      setBuscandoSuscripcion(false);
    }
  };

  // Crear factura manual
  const handleCrearFacturaManual = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError('');

    try {
      await facturacionAPI.crearFacturaManual({
        clienteId: formNuevaFactura.clienteId,
        mes: mesSeleccionado,
        anio: anioSeleccionado,
        sesiones: parseInt(formNuevaFactura.sesiones),
        precioUnitario: parseFloat(formNuevaFactura.precioUnitario),
        descuento: formNuevaFactura.descuento ? parseFloat(formNuevaFactura.descuento) : 0,
        notas: formNuevaFactura.notas,
        diasAsistencia: diasAsistenciaNueva
      });
      setMensaje('Factura creada correctamente');
      setModalNuevaFactura(false);
      setDiasAsistenciaNueva([]);
      cargarDatos();
    } catch (err) {
      console.error('Error al crear factura:', err);
      setError(err.response?.data?.mensaje || 'Error al crear factura');
    } finally {
      setCargando(false);
    }
  };

  // Calcular total preview
  const calcularTotalPreview = () => {
    const sesiones = parseInt(formNuevaFactura.sesiones) || 0;
    const precio = parseFloat(formNuevaFactura.precioUnitario) || 0;
    const descuento = parseFloat(formNuevaFactura.descuento) || 0;
    return (sesiones * precio - descuento).toFixed(2);
  };

  // Emitir factura
  const handleEmitirFactura = async (facturaId) => {
    try {
      await facturacionAPI.emitirFactura(facturaId);
      setMensaje('Factura emitida');
      cargarDatos();
    } catch (err) {
      console.error('Error al emitir factura:', err);
      setError(err.response?.data?.mensaje || 'Error al emitir factura');
    }
  };

  // Abrir modal de editar factura
  const abrirModalEditarFactura = (factura) => {
    setFacturaEditando(factura);
    setFormEditarFactura({
      sesiones: factura.totalSesionesACobrar?.toString() || '',
      precioUnitario: factura.datosSuscripcion?.precioUnitario?.toString() || '',
      descuento: factura.totalDescuentos?.toString() || '0',
      notas: factura.notasInternas || ''
    });
    // Cargar días de asistencia si existen
    setDiasAsistenciaEditar(factura.diasAsistencia || []);
    setModalEditarFactura(true);
  };

  // Manejar cambio de días en calendario editar factura
  const handleDiasAsistenciaEditarChange = (dias) => {
    setDiasAsistenciaEditar(dias);
    setFormEditarFactura(prev => ({
      ...prev,
      sesiones: dias.length.toString()
    }));
  };

  // Guardar cambios de factura
  const handleGuardarFactura = async (e) => {
    e.preventDefault();
    if (!facturaEditando) return;

    setCargando(true);
    setError('');

    try {
      const sesiones = parseInt(formEditarFactura.sesiones);
      const precio = parseFloat(formEditarFactura.precioUnitario);
      const descuento = parseFloat(formEditarFactura.descuento) || 0;
      const subtotal = sesiones * precio;
      const totalAPagar = subtotal - descuento;

      await facturacionAPI.actualizarFactura(facturaEditando._id, {
        totalSesionesACobrar: sesiones,
        'datosSuscripcion.precioUnitario': precio,
        subtotal: subtotal,
        totalDescuentos: descuento,
        totalAPagar: totalAPagar,
        notasInternas: formEditarFactura.notas,
        diasAsistencia: diasAsistenciaEditar
      });

      setMensaje('Factura actualizada correctamente');
      setModalEditarFactura(false);
      setFacturaEditando(null);
      setDiasAsistenciaEditar([]);
      cargarDatos();
    } catch (err) {
      console.error('Error al actualizar factura:', err);
      setError(err.response?.data?.mensaje || 'Error al actualizar factura');
    } finally {
      setCargando(false);
    }
  };

  // Calcular total en edición
  const calcularTotalEdicion = () => {
    const sesiones = parseInt(formEditarFactura.sesiones) || 0;
    const precio = parseFloat(formEditarFactura.precioUnitario) || 0;
    const descuento = parseFloat(formEditarFactura.descuento) || 0;
    return (sesiones * precio - descuento).toFixed(2);
  };

  // Anular/Eliminar factura
  const handleAnularFactura = async (factura) => {
    const mensaje = factura.estado === 'generada' || factura.estado === 'borrador'
      ? '¿Estás seguro de eliminar esta factura?'
      : '¿Estás seguro de anular esta factura? Esta acción no se puede deshacer.';

    if (!window.confirm(mensaje)) return;

    try {
      await facturacionAPI.anularFactura(factura._id, 'Anulada por el usuario');
      setMensaje('Factura anulada correctamente');
      cargarDatos();
    } catch (err) {
      console.error('Error al anular factura:', err);
      setError(err.response?.data?.mensaje || 'Error al anular factura');
    }
  };

  // Obtener clase CSS según estado de factura
  const getEstadoClass = (estado) => {
    const clases = {
      borrador: 'estado-borrador',
      generada: 'estado-generada',
      enviada: 'estado-enviada',
      pagada: 'estado-pagada',
      parcial: 'estado-parcial',
      vencida: 'estado-vencida',
      anulada: 'estado-anulada'
    };
    return clases[estado] || '';
  };

  // Obtener etiqueta de estado
  const getEstadoLabel = (estado) => {
    const labels = {
      borrador: 'Borrador',
      generada: 'Generada',
      enviada: 'Enviada',
      pagada: 'Pagada',
      parcial: 'Pago Parcial',
      vencida: 'Vencida',
      anulada: 'Anulada'
    };
    return labels[estado] || estado;
  };

  // Descargar PDF de factura
  const handleDescargarPDF = async (factura) => {
    try {
      setCargando(true);
      const response = await facturacionAPI.descargarPDF(factura._id);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `factura-${factura.numeroFactura || factura._id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error al descargar PDF:', err);
      setError('Error al descargar el PDF de la factura');
    } finally {
      setCargando(false);
    }
  };

  // Enviar factura por email
  const handleEnviarEmail = async (factura) => {
    if (!factura.cliente?.email) {
      setError('El cliente no tiene email configurado');
      return;
    }

    if (!window.confirm(`¿Enviar factura por email a ${factura.cliente.email}?`)) {
      return;
    }

    try {
      setCargando(true);
      await facturacionAPI.enviarEmail(factura._id);
      setMensaje(`Factura enviada correctamente a ${factura.cliente.email}`);
      cargarDatos();
    } catch (err) {
      console.error('Error al enviar email:', err);
      setError(err.response?.data?.mensaje || 'Error al enviar la factura por email');
    } finally {
      setCargando(false);
    }
  };

  // Imprimir factura
  const handleImprimir = async (factura) => {
    try {
      setCargando(true);
      const response = await facturacionAPI.descargarPDF(factura._id);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    } catch (err) {
      console.error('Error al imprimir:', err);
      setError('Error al generar el PDF para imprimir');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="facturacion-container">
      <div className="facturacion-header">
        <div className="header-titulo">
          <h1>Facturación</h1>
          <p className="header-subtitulo">Gestión de cobros mensuales</p>
        </div>

        <div className="header-controles">
          <div className="selector-periodo">
            <select
              value={mesSeleccionado}
              onChange={(e) => setMesSeleccionado(parseInt(e.target.value))}
            >
              {MESES.map((mes, i) => (
                <option key={i} value={i + 1}>{mes}</option>
              ))}
            </select>
            <select
              value={anioSeleccionado}
              onChange={(e) => setAnioSeleccionado(parseInt(e.target.value))}
            >
              {[2024, 2025, 2026, 2027].map(anio => (
                <option key={anio} value={anio}>{anio}</option>
              ))}
            </select>
          </div>

          {esGerente && (
            <>
              <button
                className="btn-nueva-factura"
                onClick={abrirModalNuevaFactura}
                disabled={cargando}
              >
                + Nueva Factura
              </button>
              <button
                className="btn-generar"
                onClick={handleGenerarFacturas}
                disabled={cargando}
              >
                Generar Facturas del Mes
              </button>
            </>
          )}
        </div>
      </div>

      {/* Mensajes */}
      {error && <div className="mensaje-error">{error}</div>}
      {mensaje && <div className="mensaje-exito">{mensaje}</div>}

      {/* Resumen del mes */}
      {resumenMes && (
        <div className="resumen-cards">
          <div className="resumen-card total-facturado">
            <span className="resumen-icono"><BarChart3 size={24} /></span>
            <div className="resumen-info">
              <span className="resumen-valor">{resumenMes.totalFacturado?.toFixed(2) || '0.00'}€</span>
              <span className="resumen-label">Total Facturado</span>
            </div>
          </div>
          <div className="resumen-card total-cobrado">
            <span className="resumen-icono"><Banknote size={24} /></span>
            <div className="resumen-info">
              <span className="resumen-valor">{resumenMes.totalCobrado?.toFixed(2) || '0.00'}€</span>
              <span className="resumen-label">Total Cobrado</span>
            </div>
          </div>
          <div className="resumen-card pendiente">
            <span className="resumen-icono"><Clock size={24} /></span>
            <div className="resumen-info">
              <span className="resumen-valor">{resumenMes.pendienteCobro?.toFixed(2) || '0.00'}€</span>
              <span className="resumen-label">Pendiente de Cobro</span>
            </div>
          </div>
          <div className="resumen-card facturas-count">
            <span className="resumen-icono"><FileText size={24} /></span>
            <div className="resumen-info">
              <span className="resumen-valor">{resumenMes.totalFacturas || 0}</span>
              <span className="resumen-label">Facturas</span>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="facturacion-tabs">
        <button
          className={`tab ${tabActivo === 'facturas' ? 'activo' : ''}`}
          onClick={() => setTabActivo('facturas')}
        >
          Facturas
        </button>
        <button
          className={`tab ${tabActivo === 'suscripciones' ? 'activo' : ''}`}
          onClick={() => setTabActivo('suscripciones')}
        >
          Suscripciones
        </button>
      </div>

      {/* Contenido del tab */}
      <div className="tab-contenido">
        {cargando ? (
          <div className="cargando">Cargando...</div>
        ) : tabActivo === 'facturas' ? (
          <div className="tabla-facturas-container">
            {facturas.length === 0 ? (
              <div className="sin-datos">
                <p>No hay facturas para {MESES[mesSeleccionado - 1]} {anioSeleccionado}</p>
                {esGerente && <p>Haz clic en "Generar Facturas del Mes" para crearlas</p>}
              </div>
            ) : (
              <table className="tabla-facturas">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Sesiones</th>
                    <th>Precio/Sesión</th>
                    <th>Total</th>
                    <th>Pagado</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {facturas.map(factura => (
                    <tr key={factura._id}>
                      <td className="cliente-cell">
                        <span className="cliente-nombre">
                          {factura.cliente?.nombre} {factura.cliente?.apellido}
                        </span>
                      </td>
                      <td>{factura.totalSesionesACobrar}</td>
                      <td>{factura.datosSuscripcion?.precioUnitario?.toFixed(2)}€</td>
                      <td className="total-cell">{factura.totalAPagar?.toFixed(2)}€</td>
                      <td className="pagado-cell">{factura.totalPagado?.toFixed(2)}€</td>
                      <td>
                        <span className={`estado-badge ${getEstadoClass(factura.estado)}`}>
                          {getEstadoLabel(factura.estado)}
                        </span>
                      </td>
                      <td className="acciones-cell">
                        <button
                          className="btn-accion btn-ver"
                          onClick={() => verDetalleFactura(factura)}
                          title="Ver detalle"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          className="btn-accion btn-pdf"
                          onClick={() => handleDescargarPDF(factura)}
                          title="Descargar PDF"
                        >
                          <FileText size={16} />
                        </button>
                        <button
                          className="btn-accion btn-imprimir"
                          onClick={() => handleImprimir(factura)}
                          title="Imprimir"
                        >
                          <Printer size={16} />
                        </button>
                        {factura.cliente?.email && (
                          <button
                            className="btn-accion btn-email"
                            onClick={() => handleEnviarEmail(factura)}
                            title={`Enviar a ${factura.cliente.email}`}
                          >
                            <Mail size={16} />
                          </button>
                        )}
                        {esGerente && factura.estado !== 'pagada' && factura.estado !== 'anulada' && (
                          <>
                            <button
                              className="btn-accion btn-editar"
                              onClick={() => abrirModalEditarFactura(factura)}
                              title="Editar factura"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              className="btn-accion btn-pago"
                              onClick={() => abrirModalPago(factura)}
                              title="Registrar pago"
                            >
                              <CreditCard size={16} />
                            </button>
                            {(factura.estado === 'generada' || factura.estado === 'borrador') && (
                              <button
                                className="btn-accion btn-emitir"
                                onClick={() => handleEmitirFactura(factura._id)}
                                title="Emitir factura"
                              >
                                <Send size={16} />
                              </button>
                            )}
                            <button
                              className="btn-accion btn-eliminar"
                              onClick={() => handleAnularFactura(factura)}
                              title="Anular/Eliminar factura"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          <div className="lista-suscripciones">
            <div className="suscripciones-header">
              <h3>Clientes con Suscripción Activa</h3>
            </div>

            {suscripciones.length === 0 ? (
              <div className="sin-datos">
                <p>No hay suscripciones activas</p>
                <p>Selecciona un cliente para crear su suscripción</p>
              </div>
            ) : (
              <div className="suscripciones-grid">
                {suscripciones.map(sus => (
                  <div key={sus._id} className="suscripcion-card">
                    <div className="suscripcion-header">
                      <span className="suscripcion-cliente">
                        {sus.cliente?.nombre} {sus.cliente?.apellido}
                      </span>
                      <span className={`suscripcion-estado estado-${sus.estado}`}>
                        {sus.estado}
                      </span>
                    </div>
                    <div className="suscripcion-body">
                      <div className="suscripcion-producto">
                        <strong>{sus.producto?.nombre}</strong>
                      </div>
                      <div className="suscripcion-detalles">
                        <span>{sus.diasPorSemana} días/semana</span>
                        <span>{sus.precioUnitarioFijado?.toFixed(2)}€/sesión</span>
                      </div>
                      <div className="suscripcion-dias">
                        {sus.diasEntrenamiento?.map(d => (
                          <span key={d} className="dia-badge">{DIAS_SEMANA[d]?.substring(0, 3)}</span>
                        ))}
                      </div>
                      {sus.sesionesAcumuladas > 0 && (
                        <div className="suscripcion-acumuladas">
                          <span className="acumuladas-badge">
                            +{sus.sesionesAcumuladas} sesiones acumuladas
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="suscripcion-acciones">
                      <button
                        className="btn-editar-suscripcion"
                        onClick={() => abrirModalSuscripcion(sus.cliente)}
                      >
                        Editar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Lista de clientes sin suscripción */}
            <div className="clientes-sin-suscripcion">
              <h4>Asignar Suscripción a Cliente</h4>
              <div className="clientes-lista">
                {clientes
                  .filter(c => !suscripciones.find(s => s.cliente?._id === c._id))
                  .slice(0, 10)
                  .map(cliente => (
                    <button
                      key={cliente._id}
                      className="cliente-item"
                      onClick={() => abrirModalSuscripcion(cliente)}
                    >
                      {cliente.nombre} {cliente.apellido}
                    </button>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Suscripción */}
      {modalSuscripcion && (
        <div className="modal-overlay" onClick={() => setModalSuscripcion(false)}>
          <div className="modal-content modal-suscripcion" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Suscripción de {clienteSeleccionado?.nombre} {clienteSeleccionado?.apellido}</h2>
              <button className="btn-cerrar" onClick={() => setModalSuscripcion(false)}>×</button>
            </div>

            <form onSubmit={handleGuardarSuscripcion}>
              <div className="form-grupo">
                <label>Producto/Tipo de Sesión</label>
                <select
                  value={formSuscripcion.productoId}
                  onChange={(e) => setFormSuscripcion({ ...formSuscripcion, productoId: e.target.value })}
                  required
                >
                  <option value="">Seleccionar producto...</option>
                  {productos.map(p => (
                    <option key={p._id} value={p._id}>{p.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="form-grupo">
                <label>Días por Semana</label>
                <select
                  value={formSuscripcion.diasPorSemana}
                  onChange={(e) => setFormSuscripcion({
                    ...formSuscripcion,
                    diasPorSemana: parseInt(e.target.value),
                    diasEntrenamiento: formSuscripcion.diasEntrenamiento.slice(0, parseInt(e.target.value))
                  })}
                >
                  {[1, 2, 3, 4, 5].map(n => (
                    <option key={n} value={n}>{n} día{n > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>

              <div className="form-grupo">
                <label>Días de Entrenamiento (selecciona {formSuscripcion.diasPorSemana})</label>
                <div className="dias-selector">
                  {DIAS_SEMANA.map((dia, i) => (
                    <button
                      key={i}
                      type="button"
                      className={`dia-btn ${formSuscripcion.diasEntrenamiento.includes(i) ? 'seleccionado' : ''}`}
                      onClick={() => toggleDiaEntrenamiento(i)}
                    >
                      {dia}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-grupo">
                <label>Notas (opcional)</label>
                <textarea
                  value={formSuscripcion.notas}
                  onChange={(e) => setFormSuscripcion({ ...formSuscripcion, notas: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="modal-acciones">
                <button type="button" className="btn-cancelar" onClick={() => setModalSuscripcion(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-guardar" disabled={cargando}>
                  {cargando ? 'Guardando...' : 'Guardar Suscripción'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detalle Factura */}
      {modalFactura && facturaDetalle && (
        <div className="modal-overlay" onClick={() => setModalFactura(false)}>
          <div className="modal-content modal-factura" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Factura {facturaDetalle.numeroFactura || 'Borrador'}</h2>
              <button className="btn-cerrar" onClick={() => setModalFactura(false)}>×</button>
            </div>

            <div className="factura-detalle">
              <div className="factura-cliente">
                <h3>{facturaDetalle.cliente?.nombre} {facturaDetalle.cliente?.apellido}</h3>
                <p>{facturaDetalle.cliente?.email}</p>
                {facturaDetalle.cliente?.numeroCuenta && (
                  <p>Cuenta: {facturaDetalle.cliente.numeroCuenta}</p>
                )}
              </div>

              <div className="factura-periodo">
                <span>{MESES[facturaDetalle.mes - 1]} {facturaDetalle.anio}</span>
                <span className={`estado-badge ${getEstadoClass(facturaDetalle.estado)}`}>
                  {getEstadoLabel(facturaDetalle.estado)}
                </span>
              </div>

              <div className="factura-desglose">
                <h4>Desglose de Sesiones</h4>
                <table className="tabla-desglose">
                  <tbody>
                    <tr>
                      <td>Sesiones programadas</td>
                      <td>{facturaDetalle.sesionesProgramadas}</td>
                    </tr>
                    <tr>
                      <td>+ Sesiones acumuladas mes anterior</td>
                      <td>{facturaDetalle.sesionesAcumuladasAnterior}</td>
                    </tr>
                    <tr>
                      <td>- Canceladas por el centro</td>
                      <td>{facturaDetalle.sesionesCanceladasCentro}</td>
                    </tr>
                    <tr>
                      <td>- Acumuladas para siguiente mes</td>
                      <td>{facturaDetalle.sesionesAcumuladasSiguiente}</td>
                    </tr>
                    <tr className="total-row">
                      <td><strong>Total sesiones a cobrar</strong></td>
                      <td><strong>{facturaDetalle.totalSesionesACobrar}</strong></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="factura-totales">
                <div className="total-linea">
                  <span>Subtotal ({facturaDetalle.totalSesionesACobrar} × {facturaDetalle.datosSuscripcion?.precioUnitario?.toFixed(2)}€)</span>
                  <span>{facturaDetalle.subtotal?.toFixed(2)}€</span>
                </div>
                {facturaDetalle.totalDescuentos > 0 && (
                  <div className="total-linea descuento">
                    <span>Descuentos</span>
                    <span>-{facturaDetalle.totalDescuentos?.toFixed(2)}€</span>
                  </div>
                )}
                <div className="total-linea total-final">
                  <span>Total a Pagar</span>
                  <span>{facturaDetalle.totalAPagar?.toFixed(2)}€</span>
                </div>
                <div className="total-linea pagado">
                  <span>Total Pagado</span>
                  <span>{facturaDetalle.totalPagado?.toFixed(2)}€</span>
                </div>
                {facturaDetalle.totalAPagar - facturaDetalle.totalPagado > 0 && (
                  <div className="total-linea pendiente">
                    <span>Pendiente</span>
                    <span>{(facturaDetalle.totalAPagar - facturaDetalle.totalPagado).toFixed(2)}€</span>
                  </div>
                )}
              </div>

              {facturaDetalle.pagos?.length > 0 && (
                <div className="factura-pagos">
                  <h4>Historial de Pagos</h4>
                  <ul>
                    {facturaDetalle.pagos.map((pago, i) => (
                      <li key={i}>
                        <span>{new Date(pago.fecha).toLocaleDateString()}</span>
                        <span>{pago.monto?.toFixed(2)}€</span>
                        <span>{pago.metodoPago}</span>
                        {pago.referencia && <span>Ref: {pago.referencia}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="modal-acciones modal-acciones-factura">
              <div className="acciones-izquierda">
                <button
                  className="btn-secundario btn-pdf-modal"
                  onClick={() => handleDescargarPDF(facturaDetalle)}
                >
                  <FileText size={16} style={{ marginRight: '4px', display: 'inline' }} /> Descargar PDF
                </button>
                <button
                  className="btn-secundario btn-imprimir-modal"
                  onClick={() => handleImprimir(facturaDetalle)}
                >
                  <Printer size={16} style={{ marginRight: '4px', display: 'inline' }} /> Imprimir
                </button>
                {facturaDetalle.cliente?.email && (
                  <button
                    className="btn-secundario btn-email-modal"
                    onClick={() => handleEnviarEmail(facturaDetalle)}
                  >
                    <Mail size={16} style={{ marginRight: '4px', display: 'inline' }} /> Enviar Email
                  </button>
                )}
              </div>
              <div className="acciones-derecha">
                <button className="btn-cancelar" onClick={() => setModalFactura(false)}>
                  Cerrar
                </button>
                {esGerente && facturaDetalle.estado !== 'pagada' && facturaDetalle.estado !== 'anulada' && (
                  <button className="btn-guardar" onClick={() => {
                    setModalFactura(false);
                    abrirModalPago(facturaDetalle);
                  }}>
                    Registrar Pago
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Pago */}
      {modalPago && facturaDetalle && (
        <div className="modal-overlay" onClick={() => setModalPago(false)}>
          <div className="modal-content modal-pago" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Registrar Pago</h2>
              <button className="btn-cerrar" onClick={() => setModalPago(false)}>×</button>
            </div>

            <div className="pago-info">
              <p><strong>Cliente:</strong> {facturaDetalle.cliente?.nombre} {facturaDetalle.cliente?.apellido}</p>
              <p><strong>Pendiente:</strong> {(facturaDetalle.totalAPagar - facturaDetalle.totalPagado).toFixed(2)}€</p>
            </div>

            <form onSubmit={handleRegistrarPago}>
              <div className="form-grupo">
                <label>Monto (€)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formPago.monto}
                  onChange={(e) => setFormPago({ ...formPago, monto: e.target.value })}
                  required
                />
              </div>

              <div className="form-grupo">
                <label>Método de Pago</label>
                <select
                  value={formPago.metodoPago}
                  onChange={(e) => setFormPago({ ...formPago, metodoPago: e.target.value })}
                >
                  <option value="transferencia">Transferencia</option>
                  <option value="domiciliacion">Domiciliación</option>
                  <option value="efectivo">Efectivo</option>
                  <option value="tarjeta">Tarjeta</option>
                  <option value="otro">Otro</option>
                </select>
              </div>

              <div className="form-grupo">
                <label>Referencia (opcional)</label>
                <input
                  type="text"
                  value={formPago.referencia}
                  onChange={(e) => setFormPago({ ...formPago, referencia: e.target.value })}
                  placeholder="Número de transferencia, recibo, etc."
                />
              </div>

              <div className="modal-acciones">
                <button type="button" className="btn-cancelar" onClick={() => setModalPago(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-guardar" disabled={cargando}>
                  {cargando ? 'Registrando...' : 'Registrar Pago'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nueva Factura Manual */}
      {modalNuevaFactura && (
        <div className="modal-overlay" onClick={() => setModalNuevaFactura(false)}>
          <div className="modal-content modal-nueva-factura" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Nueva Factura - {MESES[mesSeleccionado - 1]} {anioSeleccionado}</h2>
              <button className="btn-cerrar" onClick={() => setModalNuevaFactura(false)}>×</button>
            </div>

            <form onSubmit={handleCrearFacturaManual}>
              <div className="form-grupo">
                <label>Cliente *</label>
                <select
                  value={formNuevaFactura.clienteId}
                  onChange={(e) => handleClienteChange(e.target.value)}
                  required
                >
                  <option value="">Seleccionar cliente...</option>
                  {clientes.map(c => (
                    <option key={c._id} value={c._id}>{c.nombre} {c.apellido}</option>
                  ))}
                </select>
                {buscandoSuscripcion && (
                  <span className="buscando-suscripcion">Buscando tarifa...</span>
                )}
              </div>

              {/* Info de suscripción del cliente */}
              {formNuevaFactura.clienteId && !buscandoSuscripcion && (
                <div className={`info-suscripcion ${suscripcionCliente ? 'con-suscripcion' : 'sin-suscripcion'}`}>
                  {suscripcionCliente ? (
                    <>
                      <span className="suscripcion-icono"><Check size={16} /></span>
                      <span>
                        <strong>{suscripcionCliente.producto?.nombre || 'Suscripción'}</strong>
                        {' - '}{suscripcionCliente.diasPorSemana} días/semana
                        {' - '}<strong>{suscripcionCliente.precioUnitarioFijado?.toFixed(2)}€</strong>/sesión
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="suscripcion-icono">!</span>
                      <span>Cliente sin suscripción - introduce precio manualmente</span>
                    </>
                  )}
                </div>
              )}

              {/* Calendario de asistencias */}
              <div className="form-grupo">
                <label>Marcar días de asistencia (opcional)</label>
                <CalendarioAsistencias
                  mes={mesSeleccionado}
                  anio={anioSeleccionado}
                  diasSeleccionados={diasAsistenciaNueva}
                  onChange={handleDiasAsistenciaNuevaChange}
                />
              </div>

              <div className="form-row-2">
                <div className="form-grupo">
                  <label>Nº Sesiones *</label>
                  <input
                    type="number"
                    min="1"
                    value={formNuevaFactura.sesiones}
                    onChange={(e) => setFormNuevaFactura({ ...formNuevaFactura, sesiones: e.target.value })}
                    placeholder="Ej: 8"
                    required
                  />
                  <small className="input-hint">Se actualiza automáticamente al marcar días</small>
                </div>
                <div className="form-grupo">
                  <label>Precio/Sesión (€) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formNuevaFactura.precioUnitario}
                    onChange={(e) => setFormNuevaFactura({ ...formNuevaFactura, precioUnitario: e.target.value })}
                    placeholder="Ej: 25"
                    required
                  />
                </div>
              </div>

              <div className="form-grupo">
                <label>Descuento (€) - Opcional</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formNuevaFactura.descuento}
                  onChange={(e) => setFormNuevaFactura({ ...formNuevaFactura, descuento: e.target.value })}
                  placeholder="Ej: 10"
                />
              </div>

              <div className="form-grupo">
                <label>Notas (opcional)</label>
                <textarea
                  value={formNuevaFactura.notas}
                  onChange={(e) => setFormNuevaFactura({ ...formNuevaFactura, notas: e.target.value })}
                  rows={2}
                  placeholder="Observaciones internas..."
                />
              </div>

              {/* Preview del total */}
              <div className="preview-total">
                <div className="preview-calculo">
                  <span>{formNuevaFactura.sesiones || 0} sesiones × {formNuevaFactura.precioUnitario || 0}€</span>
                  {formNuevaFactura.descuento && <span> - {formNuevaFactura.descuento}€ dto.</span>}
                </div>
                <div className="preview-resultado">
                  <span>Total:</span>
                  <strong>{calcularTotalPreview()}€</strong>
                </div>
              </div>

              <div className="modal-acciones">
                <button type="button" className="btn-cancelar" onClick={() => setModalNuevaFactura(false)}>
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-guardar"
                  disabled={cargando || !formNuevaFactura.clienteId || !formNuevaFactura.sesiones || !formNuevaFactura.precioUnitario}
                >
                  {cargando ? 'Creando...' : 'Crear Factura'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Factura */}
      {modalEditarFactura && facturaEditando && (
        <div className="modal-overlay" onClick={() => setModalEditarFactura(false)}>
          <div className="modal-content modal-editar-factura" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Editar Factura</h2>
              <button className="btn-cerrar" onClick={() => setModalEditarFactura(false)}>×</button>
            </div>

            <div className="factura-cliente-info">
              <strong>{facturaEditando.cliente?.nombre} {facturaEditando.cliente?.apellido}</strong>
              <span>{MESES[facturaEditando.mes - 1]} {facturaEditando.anio}</span>
            </div>

            <form onSubmit={handleGuardarFactura}>
              {/* Calendario de asistencias */}
              <div className="form-grupo">
                <label>Marcar días de asistencia</label>
                <CalendarioAsistencias
                  mes={facturaEditando.mes}
                  anio={facturaEditando.anio}
                  diasSeleccionados={diasAsistenciaEditar}
                  onChange={handleDiasAsistenciaEditarChange}
                />
              </div>

              <div className="form-row-2">
                <div className="form-grupo">
                  <label>Nº Sesiones *</label>
                  <input
                    type="number"
                    min="1"
                    value={formEditarFactura.sesiones}
                    onChange={(e) => setFormEditarFactura({ ...formEditarFactura, sesiones: e.target.value })}
                    required
                  />
                  <small className="input-hint">Se actualiza automáticamente al marcar días</small>
                </div>
                <div className="form-grupo">
                  <label>Precio/Sesión (€) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formEditarFactura.precioUnitario}
                    onChange={(e) => setFormEditarFactura({ ...formEditarFactura, precioUnitario: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-grupo">
                <label>Descuento (€)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formEditarFactura.descuento}
                  onChange={(e) => setFormEditarFactura({ ...formEditarFactura, descuento: e.target.value })}
                />
              </div>

              <div className="form-grupo">
                <label>Notas internas</label>
                <textarea
                  value={formEditarFactura.notas}
                  onChange={(e) => setFormEditarFactura({ ...formEditarFactura, notas: e.target.value })}
                  rows={2}
                  placeholder="Notas internas sobre la factura..."
                />
              </div>

              {/* Preview del total */}
              <div className="preview-total">
                <div className="preview-calculo">
                  <span>{formEditarFactura.sesiones || 0} sesiones × {formEditarFactura.precioUnitario || 0}€</span>
                  {parseFloat(formEditarFactura.descuento) > 0 && <span> - {formEditarFactura.descuento}€ dto.</span>}
                </div>
                <div className="preview-resultado">
                  <span>Total:</span>
                  <strong>{calcularTotalEdicion()}€</strong>
                </div>
              </div>

              <div className="modal-acciones">
                <button type="button" className="btn-cancelar" onClick={() => setModalEditarFactura(false)}>
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-guardar"
                  disabled={cargando || !formEditarFactura.sesiones || !formEditarFactura.precioUnitario}
                >
                  {cargando ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Facturacion;
