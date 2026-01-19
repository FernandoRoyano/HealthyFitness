import { useState, useEffect, useCallback } from 'react';
import { vacacionesAPI, usersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Vacaciones.css';

function Vacaciones() {
  const { usuario } = useAuth();
  const esGerente = usuario?.rol === 'gerente';

  // Estados principales
  const [vacaciones, setVacaciones] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [resumenGlobal, setResumenGlobal] = useState(null);
  const [entrenadores, setEntrenadores] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  // Filtros
  const [filtroEstado, setFiltroEstado] = useState('pendiente');
  const [filtroAño, setFiltroAño] = useState(new Date().getFullYear());
  const [filtroEntrenador, setFiltroEntrenador] = useState('');

  // Modal de nueva solicitud
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [formulario, setFormulario] = useState({
    fechaInicio: '',
    fechaFin: '',
    motivo: '',
    entrenadorId: ''
  });
  const [previewDias, setPreviewDias] = useState(null);
  const [guardando, setGuardando] = useState(false);

  // Modal de detalles/aprobación
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [procesando, setProcesando] = useState(false);

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatos();
  }, [filtroEstado, filtroAño, filtroEntrenador]);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      setError('');

      const params = { año: filtroAño };
      if (filtroEstado !== 'todas') params.estado = filtroEstado;
      if (filtroEntrenador) params.entrenador = filtroEntrenador;

      const [vacacionesRes, resumenRes] = await Promise.all([
        vacacionesAPI.obtenerTodas(params),
        esGerente
          ? vacacionesAPI.obtenerResumenGlobal(filtroAño)
          : vacacionesAPI.obtenerMiResumen(filtroAño)
      ]);

      setVacaciones(vacacionesRes.data);

      if (esGerente) {
        setResumenGlobal(vacacionesRes.data);
        // Usar el primer entrenador como resumen o null
        if (resumenRes.data.entrenadores?.length > 0) {
          setResumen(resumenRes.data.entrenadores[0]);
        }
      } else {
        setResumen(resumenRes.data);
      }

      // Cargar entrenadores para el filtro (solo gerente)
      if (esGerente) {
        const entrenadoresRes = await usersAPI.obtenerEntrenadores();
        setEntrenadores(entrenadoresRes.data);
      }
    } catch (err) {
      console.error('Error al cargar datos:', err);
      setError('Error al cargar los datos de vacaciones');
    } finally {
      setCargando(false);
    }
  };

  // Calcular días laborables en el cliente para preview
  const calcularDiasLaborables = (fechaInicio, fechaFin) => {
    if (!fechaInicio || !fechaFin) return null;

    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);

    if (fin < inicio) return null;

    let dias = 0;
    let diasEstivales = 0;
    const fecha = new Date(inicio);

    while (fecha <= fin) {
      const diaSemana = fecha.getDay();
      if (diaSemana !== 0 && diaSemana !== 6) {
        dias++;
        const mes = fecha.getMonth();
        if (mes >= 5 && mes <= 8) {
          diasEstivales++;
        }
      }
      fecha.setDate(fecha.getDate() + 1);
    }

    const tipoPeriodo = diasEstivales >= (dias / 2) ? 'estival' : 'no_estival';

    return { dias, diasEstivales, tipoPeriodo };
  };

  // Actualizar preview cuando cambian las fechas
  useEffect(() => {
    const preview = calcularDiasLaborables(formulario.fechaInicio, formulario.fechaFin);
    setPreviewDias(preview);
  }, [formulario.fechaInicio, formulario.fechaFin]);

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formulario.fechaInicio || !formulario.fechaFin) {
      setError('Debes seleccionar fecha de inicio y fin');
      return;
    }

    if (!previewDias || previewDias.dias <= 0) {
      setError('El período seleccionado no contiene días laborables');
      return;
    }

    try {
      setGuardando(true);
      const datos = {
        fechaInicio: formulario.fechaInicio,
        fechaFin: formulario.fechaFin,
        motivo: formulario.motivo
      };

      // Si el gerente crea para otro entrenador
      if (esGerente && formulario.entrenadorId) {
        datos.entrenadorId = formulario.entrenadorId;
      }

      await vacacionesAPI.crear(datos);
      setMostrarFormulario(false);
      setFormulario({ fechaInicio: '', fechaFin: '', motivo: '', entrenadorId: '' });
      cargarDatos();
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al crear solicitud de vacaciones');
    } finally {
      setGuardando(false);
    }
  };

  // Manejar aprobación
  const handleAprobar = async (id) => {
    if (!window.confirm('¿Estás seguro de aprobar estas vacaciones?')) return;

    try {
      setProcesando(true);
      await vacacionesAPI.aprobar(id);
      cargarDatos();
      cerrarModal();
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al aprobar vacaciones');
    } finally {
      setProcesando(false);
    }
  };

  // Manejar rechazo
  const handleRechazar = async (id) => {
    if (!motivoRechazo.trim()) {
      setError('Debes proporcionar un motivo de rechazo');
      return;
    }

    try {
      setProcesando(true);
      await vacacionesAPI.rechazar(id, motivoRechazo);
      cargarDatos();
      cerrarModal();
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al rechazar vacaciones');
    } finally {
      setProcesando(false);
    }
  };

  // Manejar cancelación
  const handleCancelar = async (id) => {
    if (!window.confirm('¿Estás seguro de cancelar esta solicitud?')) return;

    try {
      await vacacionesAPI.cancelar(id);
      cargarDatos();
      cerrarModal();
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al cancelar solicitud');
    }
  };

  const abrirModal = (vacacion) => {
    setSolicitudSeleccionada(vacacion);
    setMostrarModal(true);
    setError('');
    setMotivoRechazo('');
  };

  const cerrarModal = () => {
    setMostrarModal(false);
    setSolicitudSeleccionada(null);
    setMotivoRechazo('');
    setError('');
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'pendiente': return '#ffc107';
      case 'aprobado': return '#28a745';
      case 'rechazado': return '#dc3545';
      case 'cancelado': return '#6c757d';
      default: return '#666';
    }
  };

  const getEstadoBadge = (estado) => {
    switch (estado) {
      case 'pendiente': return 'Pendiente';
      case 'aprobado': return 'Aprobada';
      case 'rechazado': return 'Rechazada';
      case 'cancelado': return 'Cancelada';
      default: return estado;
    }
  };

  const getTipoPeriodoLabel = (tipo) => {
    return tipo === 'estival' ? 'Verano (Jun-Sep)' : 'Resto del año';
  };

  // Años disponibles para el filtro
  const añosDisponibles = [
    new Date().getFullYear() - 1,
    new Date().getFullYear(),
    new Date().getFullYear() + 1
  ];

  if (cargando) {
    return (
      <div className="vacaciones-container">
        <div className="vacaciones-loading">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="vacaciones-container">
      {/* Header */}
      <div className="vacaciones-header">
        <h1>{esGerente ? 'Control de Vacaciones' : 'Mis Vacaciones'}</h1>
        <button
          onClick={() => setMostrarFormulario(true)}
          className="btn-nueva-solicitud"
        >
          + Nueva Solicitud
        </button>
      </div>

      {/* Resumen de días */}
      {resumen && !esGerente && (
        <div className="resumen-container">
          <h3 className="resumen-titulo">Mi Balance {filtroAño}</h3>
          <div className="resumen-grid">
            <div className="resumen-card">
              <div className="resumen-numero">{resumen.diasPendientes}</div>
              <div className="resumen-label">Días Disponibles</div>
              <div className="resumen-subtexto">de {resumen.diasTotales} totales</div>
            </div>
            <div className="resumen-card estival">
              <div className="resumen-numero">{resumen.estival?.pendientes || 0}</div>
              <div className="resumen-label">Pendientes Verano</div>
              <div className="resumen-subtexto">Mínimo {resumen.estival?.minimo || 15} días (Jun-Sep)</div>
            </div>
            <div className="resumen-card no-estival">
              <div className="resumen-numero">{resumen.noEstival?.disponibles || 0}</div>
              <div className="resumen-label">Disponibles Resto Año</div>
              <div className="resumen-subtexto">Máximo {resumen.noEstival?.maximo || 8} días</div>
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="filtros-container">
        <div className="filtros-estado">
          {['pendiente', 'aprobado', 'rechazado', 'cancelado', 'todas'].map((estado) => (
            <button
              key={estado}
              onClick={() => setFiltroEstado(estado)}
              className={`filtro-btn ${filtroEstado === estado ? 'activo' : ''}`}
            >
              {estado === 'todas' ? 'Todas' : getEstadoBadge(estado)}
            </button>
          ))}
        </div>

        <div className="filtros-secundarios">
          <select
            value={filtroAño}
            onChange={(e) => setFiltroAño(parseInt(e.target.value))}
            className="filtro-select"
          >
            {añosDisponibles.map((año) => (
              <option key={año} value={año}>{año}</option>
            ))}
          </select>

          {esGerente && (
            <select
              value={filtroEntrenador}
              onChange={(e) => setFiltroEntrenador(e.target.value)}
              className="filtro-select"
            >
              <option value="">Todos los entrenadores</option>
              {entrenadores.map((ent) => (
                <option key={ent._id} value={ent._id}>{ent.nombre}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {error && <div className="error-mensaje">{error}</div>}

      {/* Lista de vacaciones - Desktop */}
      <div className="vacaciones-tabla desktop-only">
        <table>
          <thead>
            <tr>
              {esGerente && <th>Entrenador</th>}
              <th>Período</th>
              <th>Días</th>
              <th>Tipo</th>
              <th>Estado</th>
              <th>Motivo</th>
              <th>Fecha Solicitud</th>
            </tr>
          </thead>
          <tbody>
            {vacaciones.length === 0 ? (
              <tr>
                <td colSpan={esGerente ? 7 : 6} className="tabla-vacia">
                  No hay solicitudes de vacaciones
                </td>
              </tr>
            ) : (
              vacaciones.map((vac) => (
                <tr key={vac._id} onClick={() => abrirModal(vac)} className="fila-clickeable">
                  {esGerente && (
                    <td>
                      <div className="entrenador-info">
                        {vac.entrenador?.foto ? (
                          <img src={vac.entrenador.foto} alt="" className="entrenador-foto" />
                        ) : (
                          <div className="entrenador-foto-placeholder">
                            {vac.entrenador?.nombre?.charAt(0)}
                          </div>
                        )}
                        <span>{vac.entrenador?.nombre}</span>
                      </div>
                    </td>
                  )}
                  <td>
                    <div className="periodo-fechas">
                      {formatearFecha(vac.fechaInicio)}
                      <span className="periodo-separador">→</span>
                      {formatearFecha(vac.fechaFin)}
                    </div>
                  </td>
                  <td className="dias-cell">{vac.diasLaborables}</td>
                  <td>
                    <span className={`tipo-badge ${vac.tipoPeriodo}`}>
                      {getTipoPeriodoLabel(vac.tipoPeriodo)}
                    </span>
                  </td>
                  <td>
                    <span
                      className="estado-badge"
                      style={{ backgroundColor: getEstadoColor(vac.estado) }}
                    >
                      {getEstadoBadge(vac.estado)}
                    </span>
                  </td>
                  <td className="motivo-cell">{vac.motivo || '-'}</td>
                  <td className="fecha-cell">
                    {new Date(vac.createdAt).toLocaleDateString('es-ES')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Lista de vacaciones - Mobile */}
      <div className="vacaciones-cards mobile-only">
        {vacaciones.length === 0 ? (
          <div className="cards-vacio">No hay solicitudes de vacaciones</div>
        ) : (
          vacaciones.map((vac) => (
            <div key={vac._id} className="vacacion-card" onClick={() => abrirModal(vac)}>
              <div className="card-header">
                {esGerente && (
                  <div className="entrenador-info">
                    {vac.entrenador?.foto ? (
                      <img src={vac.entrenador.foto} alt="" className="entrenador-foto" />
                    ) : (
                      <div className="entrenador-foto-placeholder">
                        {vac.entrenador?.nombre?.charAt(0)}
                      </div>
                    )}
                    <span>{vac.entrenador?.nombre}</span>
                  </div>
                )}
                <span
                  className="estado-badge"
                  style={{ backgroundColor: getEstadoColor(vac.estado) }}
                >
                  {getEstadoBadge(vac.estado)}
                </span>
              </div>

              <div className="card-body">
                <div className="card-fechas">
                  <span>{formatearFecha(vac.fechaInicio)}</span>
                  <span className="periodo-separador">→</span>
                  <span>{formatearFecha(vac.fechaFin)}</span>
                </div>
                <div className="card-info">
                  <span className="dias-badge">{vac.diasLaborables} días</span>
                  <span className={`tipo-badge ${vac.tipoPeriodo}`}>
                    {getTipoPeriodoLabel(vac.tipoPeriodo)}
                  </span>
                </div>
                {vac.motivo && <p className="card-motivo">{vac.motivo}</p>}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Nueva Solicitud */}
      {mostrarFormulario && (
        <div className="modal-overlay" onClick={() => setMostrarFormulario(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Nueva Solicitud de Vacaciones</h2>
              <button onClick={() => setMostrarFormulario(false)} className="modal-close">×</button>
            </div>

            <form onSubmit={handleSubmit} className="modal-body">
              {esGerente && (
                <div className="form-group">
                  <label>Entrenador</label>
                  <select
                    value={formulario.entrenadorId}
                    onChange={(e) => setFormulario({ ...formulario, entrenadorId: e.target.value })}
                    className="form-input"
                  >
                    <option value="">Para mí mismo</option>
                    {entrenadores.map((ent) => (
                      <option key={ent._id} value={ent._id}>{ent.nombre}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label>Fecha Inicio *</label>
                  <input
                    type="date"
                    value={formulario.fechaInicio}
                    onChange={(e) => setFormulario({ ...formulario, fechaInicio: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Fecha Fin *</label>
                  <input
                    type="date"
                    value={formulario.fechaFin}
                    onChange={(e) => setFormulario({ ...formulario, fechaFin: e.target.value })}
                    className="form-input"
                    min={formulario.fechaInicio}
                    required
                  />
                </div>
              </div>

              {/* Preview de días con cálculo de balance */}
              {previewDias && resumen && (
                <div className="preview-dias-completo">
                  <div className="preview-solicitud">
                    <h4>Esta solicitud</h4>
                    <div className="preview-solicitud-info">
                      <span className="preview-dias-numero">{previewDias.dias}</span>
                      <span className="preview-dias-texto">días laborables</span>
                      <span className={`tipo-badge ${previewDias.tipoPeriodo}`}>
                        {getTipoPeriodoLabel(previewDias.tipoPeriodo)}
                      </span>
                    </div>
                  </div>

                  <div className="preview-balance">
                    <h4>Balance tras solicitud</h4>
                    <div className="preview-balance-grid">
                      <div className="preview-balance-item">
                        <span className="balance-actual">{resumen.diasPendientes}</span>
                        <span className="balance-flecha">→</span>
                        <span className={`balance-nuevo ${resumen.diasPendientes - previewDias.dias < 0 ? 'negativo' : ''}`}>
                          {resumen.diasPendientes - previewDias.dias}
                        </span>
                        <span className="balance-label">días totales</span>
                      </div>

                      {previewDias.tipoPeriodo === 'estival' ? (
                        <div className="preview-balance-item estival">
                          <span className="balance-actual">{resumen.estival?.usados || 0}</span>
                          <span className="balance-flecha">→</span>
                          <span className="balance-nuevo">{(resumen.estival?.usados || 0) + previewDias.dias}</span>
                          <span className="balance-label">días verano usados</span>
                          <span className="balance-meta">(mín. 15)</span>
                        </div>
                      ) : (
                        <div className="preview-balance-item no-estival">
                          <span className="balance-actual">{resumen.noEstival?.usados || 0}</span>
                          <span className="balance-flecha">→</span>
                          <span className={`balance-nuevo ${(resumen.noEstival?.usados || 0) + previewDias.dias > 8 ? 'negativo' : ''}`}>
                            {(resumen.noEstival?.usados || 0) + previewDias.dias}
                          </span>
                          <span className="balance-label">días resto año</span>
                          <span className="balance-meta">(máx. 8)</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Advertencias */}
                  {resumen.diasPendientes - previewDias.dias < 0 && (
                    <div className="preview-advertencia error">
                      No tienes suficientes días disponibles
                    </div>
                  )}
                  {previewDias.tipoPeriodo === 'no_estival' && (resumen.noEstival?.usados || 0) + previewDias.dias > 8 && (
                    <div className="preview-advertencia error">
                      Excedes el máximo de 8 días fuera del período estival
                    </div>
                  )}
                </div>
              )}

              <div className="form-group">
                <label>Motivo (opcional)</label>
                <textarea
                  value={formulario.motivo}
                  onChange={(e) => setFormulario({ ...formulario, motivo: e.target.value })}
                  className="form-textarea"
                  placeholder="Ej: Vacaciones familiares, viaje..."
                  rows="3"
                />
              </div>

              {error && <div className="error-mensaje">{error}</div>}

              <div className="form-actions">
                <button type="button" onClick={() => setMostrarFormulario(false)} className="btn-cancelar">
                  Cancelar
                </button>
                <button type="submit" disabled={guardando} className="btn-guardar">
                  {guardando ? 'Guardando...' : 'Solicitar Vacaciones'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detalles */}
      {mostrarModal && solicitudSeleccionada && (
        <div className="modal-overlay" onClick={cerrarModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Detalles de Vacaciones</h2>
              <button onClick={cerrarModal} className="modal-close">×</button>
            </div>

            <div className="modal-body">
              {esGerente && (
                <div className="detalle-grupo">
                  <strong>Entrenador:</strong>
                  <div className="entrenador-info large">
                    {solicitudSeleccionada.entrenador?.foto ? (
                      <img src={solicitudSeleccionada.entrenador.foto} alt="" className="entrenador-foto" />
                    ) : (
                      <div className="entrenador-foto-placeholder">
                        {solicitudSeleccionada.entrenador?.nombre?.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p>{solicitudSeleccionada.entrenador?.nombre}</p>
                      <p className="texto-secundario">{solicitudSeleccionada.entrenador?.email}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="detalle-grupo">
                <strong>Período:</strong>
                <div className="detalle-fechas">
                  <span>{formatearFecha(solicitudSeleccionada.fechaInicio)}</span>
                  <span className="periodo-separador">→</span>
                  <span>{formatearFecha(solicitudSeleccionada.fechaFin)}</span>
                </div>
              </div>

              <div className="detalle-row">
                <div className="detalle-grupo">
                  <strong>Días laborables:</strong>
                  <p className="dias-grande">{solicitudSeleccionada.diasLaborables}</p>
                </div>
                <div className="detalle-grupo">
                  <strong>Tipo de período:</strong>
                  <span className={`tipo-badge ${solicitudSeleccionada.tipoPeriodo}`}>
                    {getTipoPeriodoLabel(solicitudSeleccionada.tipoPeriodo)}
                  </span>
                </div>
                <div className="detalle-grupo">
                  <strong>Estado:</strong>
                  <span
                    className="estado-badge"
                    style={{ backgroundColor: getEstadoColor(solicitudSeleccionada.estado) }}
                  >
                    {getEstadoBadge(solicitudSeleccionada.estado)}
                  </span>
                </div>
              </div>

              {solicitudSeleccionada.motivo && (
                <div className="detalle-grupo">
                  <strong>Motivo:</strong>
                  <p>{solicitudSeleccionada.motivo}</p>
                </div>
              )}

              {solicitudSeleccionada.estado === 'rechazado' && solicitudSeleccionada.motivoRechazo && (
                <div className="detalle-grupo rechazo">
                  <strong>Motivo del rechazo:</strong>
                  <p>{solicitudSeleccionada.motivoRechazo}</p>
                </div>
              )}

              {solicitudSeleccionada.revisadoPor && (
                <div className="detalle-grupo">
                  <strong>Revisado por:</strong>
                  <p>{solicitudSeleccionada.revisadoPor.nombre}</p>
                  <p className="texto-secundario">
                    {new Date(solicitudSeleccionada.fechaRevision).toLocaleString('es-ES')}
                  </p>
                </div>
              )}

              {/* Acciones para solicitudes pendientes */}
              {solicitudSeleccionada.estado === 'pendiente' && (
                <div className="acciones-container">
                  {esGerente ? (
                    <>
                      <div className="form-group">
                        <label>Motivo del rechazo (requerido para rechazar):</label>
                        <textarea
                          value={motivoRechazo}
                          onChange={(e) => setMotivoRechazo(e.target.value)}
                          placeholder="Escribe el motivo si vas a rechazar..."
                          className="form-textarea"
                          rows="3"
                        />
                      </div>

                      {error && <div className="error-mensaje">{error}</div>}

                      <div className="botones-accion">
                        <button
                          onClick={() => handleAprobar(solicitudSeleccionada._id)}
                          disabled={procesando}
                          className="btn-aprobar"
                        >
                          {procesando ? 'Procesando...' : 'Aprobar'}
                        </button>
                        <button
                          onClick={() => handleRechazar(solicitudSeleccionada._id)}
                          disabled={procesando}
                          className="btn-rechazar"
                        >
                          {procesando ? 'Procesando...' : 'Rechazar'}
                        </button>
                      </div>
                    </>
                  ) : (
                    <button
                      onClick={() => handleCancelar(solicitudSeleccionada._id)}
                      className="btn-cancelar-solicitud"
                    >
                      Cancelar Solicitud
                    </button>
                  )}
                </div>
              )}

              {/* Acción para cancelar vacaciones aprobadas */}
              {solicitudSeleccionada.estado === 'aprobado' && (
                <div className="acciones-container">
                  <button
                    onClick={() => handleCancelar(solicitudSeleccionada._id)}
                    className="btn-cancelar-solicitud"
                  >
                    Cancelar Vacaciones
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Vacaciones;
