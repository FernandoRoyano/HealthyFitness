import { useState, useEffect } from 'react';
import { clientesPotencialesAPI, usersAPI } from '../services/api';
import './ClientesPotenciales.css';

const ESTADOS = [
  { valor: 'todos', etiqueta: 'Todos', color: '#6b7280' },
  { valor: 'pendiente', etiqueta: 'Pendiente', color: '#f59e0b' },
  { valor: 'contactado', etiqueta: 'Contactado', color: '#3b82f6' },
  { valor: 'interesado', etiqueta: 'Interesado', color: '#10b981' },
  { valor: 'apuntado', etiqueta: 'Apuntado', color: '#059669' },
  { valor: 'no_interesado', etiqueta: 'No Interesado', color: '#9ca3af' }
];

function ClientesPotenciales() {
  const [leads, setLeads] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  // Modal crear/editar
  const [modalAbierto, setModalAbierto] = useState(false);
  const [leadEditando, setLeadEditando] = useState(null);
  const [formulario, setFormulario] = useState({
    nombre: '',
    email: '',
    telefono: '',
    busca: '',
    notas: '',
    estado: 'pendiente'
  });

  // Modal convertir a cliente
  const [modalConvertir, setModalConvertir] = useState(false);
  const [leadConvertir, setLeadConvertir] = useState(null);
  const [entrenadores, setEntrenadores] = useState([]);
  const [entrenadorSeleccionado, setEntrenadorSeleccionado] = useState('');

  useEffect(() => {
    cargarDatos();
    cargarEntrenadores();
  }, []);

  useEffect(() => {
    cargarLeads();
  }, [filtroEstado, busqueda]);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const [leadsRes, statsRes] = await Promise.all([
        clientesPotencialesAPI.obtenerTodos({ estado: filtroEstado !== 'todos' ? filtroEstado : undefined }),
        clientesPotencialesAPI.obtenerEstadisticas()
      ]);
      setLeads(leadsRes.data);
      setEstadisticas(statsRes.data);
    } catch (err) {
      console.error('Error al cargar datos:', err);
      setError('Error al cargar los datos');
    } finally {
      setCargando(false);
    }
  };

  const cargarLeads = async () => {
    try {
      const params = {};
      if (filtroEstado !== 'todos') params.estado = filtroEstado;
      if (busqueda) params.buscar = busqueda;

      const res = await clientesPotencialesAPI.obtenerTodos(params);
      setLeads(res.data);
    } catch (err) {
      console.error('Error al cargar leads:', err);
    }
  };

  const cargarEntrenadores = async () => {
    try {
      const res = await usersAPI.obtenerEntrenadores();
      setEntrenadores(res.data);
    } catch (err) {
      console.error('Error al cargar entrenadores:', err);
    }
  };

  const abrirModalNuevo = () => {
    setLeadEditando(null);
    setFormulario({
      nombre: '',
      email: '',
      telefono: '',
      busca: '',
      notas: '',
      estado: 'pendiente'
    });
    setModalAbierto(true);
  };

  const abrirModalEditar = (lead) => {
    setLeadEditando(lead);
    setFormulario({
      nombre: lead.nombre || '',
      email: lead.email || '',
      telefono: lead.telefono || '',
      busca: lead.busca || '',
      notas: lead.notas || '',
      estado: lead.estado || 'pendiente'
    });
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setLeadEditando(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormulario(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (leadEditando) {
        await clientesPotencialesAPI.actualizar(leadEditando._id, formulario);
        setMensaje('Lead actualizado correctamente');
      } else {
        await clientesPotencialesAPI.crear(formulario);
        setMensaje('Lead creado correctamente');
      }
      cerrarModal();
      cargarDatos();
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al guardar');
    }
  };

  const cambiarEstadoRapido = async (lead, nuevoEstado) => {
    try {
      await clientesPotencialesAPI.cambiarEstado(lead._id, nuevoEstado);
      setMensaje(`Estado cambiado a "${ESTADOS.find(e => e.valor === nuevoEstado)?.etiqueta}"`);
      cargarDatos();
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al cambiar estado');
    }
  };

  const eliminarLead = async (lead) => {
    if (!window.confirm(`¿Eliminar a ${lead.nombre}?`)) return;

    try {
      await clientesPotencialesAPI.eliminar(lead._id);
      setMensaje('Lead eliminado');
      cargarDatos();
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al eliminar');
    }
  };

  const abrirModalConvertir = (lead) => {
    setLeadConvertir(lead);
    setEntrenadorSeleccionado('');
    setModalConvertir(true);
  };

  const convertirACliente = async () => {
    if (!leadConvertir) return;

    try {
      await clientesPotencialesAPI.convertirACliente(leadConvertir._id, {
        entrenador: entrenadorSeleccionado || null
      });
      setMensaje(`${leadConvertir.nombre} convertido a cliente correctamente`);
      setModalConvertir(false);
      setLeadConvertir(null);
      cargarDatos();
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al convertir');
    }
  };

  const getEstadoConfig = (estado) => {
    return ESTADOS.find(e => e.valor === estado) || ESTADOS[0];
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Limpiar mensajes
  useEffect(() => {
    if (mensaje || error) {
      const timer = setTimeout(() => {
        setMensaje('');
        setError('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [mensaje, error]);

  return (
    <div className="leads-container">
      <div className="leads-header">
        <div className="header-titulo">
          <h1>Clientes Potenciales</h1>
          <p className="header-subtitulo">Gestiona tus leads y seguimiento</p>
        </div>
        <button className="btn-nuevo-lead" onClick={abrirModalNuevo}>
          + Nuevo Lead
        </button>
      </div>

      {/* Mensajes */}
      {error && <div className="mensaje-error">{error}</div>}
      {mensaje && <div className="mensaje-exito">{mensaje}</div>}

      {/* Estadisticas */}
      {estadisticas && (
        <div className="leads-stats">
          {ESTADOS.filter(e => e.valor !== 'todos').map(estado => (
            <div
              key={estado.valor}
              className={`stat-card ${filtroEstado === estado.valor ? 'activo' : ''}`}
              onClick={() => setFiltroEstado(estado.valor)}
              style={{ '--estado-color': estado.color }}
            >
              <span className="stat-numero">{estadisticas[estado.valor] || 0}</span>
              <span className="stat-etiqueta">{estado.etiqueta}</span>
            </div>
          ))}
          <div
            className={`stat-card stat-total ${filtroEstado === 'todos' ? 'activo' : ''}`}
            onClick={() => setFiltroEstado('todos')}
          >
            <span className="stat-numero">{estadisticas.total || 0}</span>
            <span className="stat-etiqueta">Total</span>
          </div>
        </div>
      )}

      {/* Barra de busqueda */}
      <div className="leads-filtros">
        <input
          type="text"
          placeholder="Buscar por nombre, telefono, email..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="input-busqueda"
        />
      </div>

      {/* Tabla de leads */}
      {cargando ? (
        <div className="cargando">Cargando...</div>
      ) : leads.length === 0 ? (
        <div className="sin-datos">
          <p>No hay leads {filtroEstado !== 'todos' ? `con estado "${getEstadoConfig(filtroEstado).etiqueta}"` : ''}</p>
          <button className="btn-nuevo-lead" onClick={abrirModalNuevo}>
            + Crear primer lead
          </button>
        </div>
      ) : (
        <div className="leads-tabla-container">
          <table className="leads-tabla">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Telefono</th>
                <th>Email</th>
                <th>Busca</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {leads.map(lead => {
                const estadoConfig = getEstadoConfig(lead.estado);
                return (
                  <tr key={lead._id} className={lead.clienteConvertido ? 'lead-convertido' : ''}>
                    <td className="td-nombre">{lead.nombre}</td>
                    <td className="td-telefono">
                      <a href={`tel:${lead.telefono}`}>{lead.telefono}</a>
                    </td>
                    <td className="td-email">
                      {lead.email ? (
                        <a href={`mailto:${lead.email}`}>{lead.email}</a>
                      ) : '-'}
                    </td>
                    <td className="td-busca" title={lead.busca}>
                      {lead.busca?.length > 40 ? lead.busca.substring(0, 40) + '...' : lead.busca}
                    </td>
                    <td>
                      <span
                        className="estado-badge"
                        style={{ backgroundColor: estadoConfig.color }}
                      >
                        {estadoConfig.etiqueta}
                      </span>
                    </td>
                    <td className="td-fecha">{formatearFecha(lead.createdAt)}</td>
                    <td className="td-acciones">
                      <div className="acciones-grupo">
                        {/* Cambio rapido de estado */}
                        {lead.estado !== 'apuntado' && !lead.clienteConvertido && (
                          <select
                            className="select-estado-rapido"
                            value=""
                            onChange={(e) => {
                              if (e.target.value) cambiarEstadoRapido(lead, e.target.value);
                            }}
                          >
                            <option value="">Estado</option>
                            {ESTADOS.filter(e => e.valor !== 'todos' && e.valor !== lead.estado).map(e => (
                              <option key={e.valor} value={e.valor}>{e.etiqueta}</option>
                            ))}
                          </select>
                        )}

                        <button
                          className="btn-accion btn-editar"
                          onClick={() => abrirModalEditar(lead)}
                          title="Editar"
                        >
                          Editar
                        </button>

                        {lead.estado !== 'apuntado' && !lead.clienteConvertido && (
                          <button
                            className="btn-accion btn-convertir"
                            onClick={() => abrirModalConvertir(lead)}
                            title="Convertir a cliente"
                          >
                            Convertir
                          </button>
                        )}

                        {lead.clienteConvertido && (
                          <span className="badge-convertido" title="Ya es cliente">
                            Cliente
                          </span>
                        )}

                        <button
                          className="btn-accion btn-eliminar"
                          onClick={() => eliminarLead(lead)}
                          title="Eliminar"
                        >
                          X
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Crear/Editar */}
      {modalAbierto && (
        <div className="modal-overlay" onClick={cerrarModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{leadEditando ? 'Editar Lead' : 'Nuevo Lead'}</h2>
              <button className="btn-cerrar" onClick={cerrarModal}>X</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-grupo">
                <label>Nombre *</label>
                <input
                  type="text"
                  name="nombre"
                  value={formulario.nombre}
                  onChange={handleChange}
                  placeholder="Nombre completo"
                  required
                />
              </div>

              <div className="form-row-2">
                <div className="form-grupo">
                  <label>Telefono *</label>
                  <input
                    type="tel"
                    name="telefono"
                    value={formulario.telefono}
                    onChange={handleChange}
                    placeholder="612 345 678"
                    required
                  />
                </div>
                <div className="form-grupo">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formulario.email}
                    onChange={handleChange}
                    placeholder="email@ejemplo.com"
                  />
                </div>
              </div>

              <div className="form-grupo">
                <label>Que busca/necesita *</label>
                <textarea
                  name="busca"
                  value={formulario.busca}
                  onChange={handleChange}
                  placeholder="Describe que busca este cliente potencial..."
                  rows={3}
                  required
                />
              </div>

              {leadEditando && (
                <div className="form-grupo">
                  <label>Estado</label>
                  <select
                    name="estado"
                    value={formulario.estado}
                    onChange={handleChange}
                  >
                    {ESTADOS.filter(e => e.valor !== 'todos').map(e => (
                      <option key={e.valor} value={e.valor}>{e.etiqueta}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-grupo">
                <label>Notas (opcional)</label>
                <textarea
                  name="notas"
                  value={formulario.notas}
                  onChange={handleChange}
                  placeholder="Notas adicionales..."
                  rows={2}
                />
              </div>

              <div className="modal-acciones">
                <button type="button" className="btn-cancelar" onClick={cerrarModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn-guardar">
                  {leadEditando ? 'Guardar Cambios' : 'Crear Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Convertir a Cliente */}
      {modalConvertir && leadConvertir && (
        <div className="modal-overlay" onClick={() => setModalConvertir(false)}>
          <div className="modal-content modal-convertir" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Convertir a Cliente</h2>
              <button className="btn-cerrar" onClick={() => setModalConvertir(false)}>X</button>
            </div>

            <div className="convertir-info">
              <p><strong>Nombre:</strong> {leadConvertir.nombre}</p>
              <p><strong>Telefono:</strong> {leadConvertir.telefono}</p>
              {leadConvertir.email && <p><strong>Email:</strong> {leadConvertir.email}</p>}
              <p><strong>Busca:</strong> {leadConvertir.busca}</p>
            </div>

            <div className="form-grupo">
              <label>Asignar Entrenador (opcional)</label>
              <select
                value={entrenadorSeleccionado}
                onChange={(e) => setEntrenadorSeleccionado(e.target.value)}
              >
                <option value="">Sin asignar</option>
                {entrenadores.map(ent => (
                  <option key={ent._id} value={ent._id}>{ent.nombre}</option>
                ))}
              </select>
            </div>

            <div className="modal-acciones">
              <button
                type="button"
                className="btn-cancelar"
                onClick={() => setModalConvertir(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-guardar btn-convertir-confirmar"
                onClick={convertirACliente}
              >
                Convertir a Cliente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ClientesPotenciales;
