import { useState, useEffect } from 'react';
import { plantillasAPI, usersAPI, clientesAPI } from '../services/api';

const PlantillasSemanales = () => {
  const [plantillas, setPlantillas] = useState([]);
  const [entrenadores, setEntrenadores] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  // Filtros
  const [mesSeleccionado, setMesSeleccionado] = useState(new Date().getMonth() + 1);
  const [añoSeleccionado, setAñoSeleccionado] = useState(new Date().getFullYear());

  // Modal crear/editar plantilla
  const [mostrarModal, setMostrarModal] = useState(false);
  const [plantillaEditando, setPlantillaEditando] = useState(null);
  const [formPlantilla, setFormPlantilla] = useState({
    nombre: '',
    descripcion: '',
    esPlantillaBase: false,
    semanaReferencia: ''
  });

  // Modal editar plantilla (sesiones)
  const [mostrarEditor, setMostrarEditor] = useState(false);
  const [plantillaSeleccionada, setPlantillaSeleccionada] = useState(null);

  // Modal duplicar
  const [mostrarModalDuplicar, setMostrarModalDuplicar] = useState(false);
  const [plantillaDuplicar, setPlantillaDuplicar] = useState(null);
  const [formDuplicar, setFormDuplicar] = useState({
    nuevaSemanaReferencia: '',
    nuevoNombre: ''
  });

  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

  useEffect(() => {
    cargarDatos();
  }, [mesSeleccionado, añoSeleccionado]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [plantillasRes, entrenadoresRes, clientesRes] = await Promise.all([
        plantillasAPI.obtenerTodas({ mes: mesSeleccionado, año: añoSeleccionado }),
        usersAPI.obtenerEntrenadores(),
        clientesAPI.obtenerTodos()
      ]);
      setPlantillas(plantillasRes.data);
      setEntrenadores(entrenadoresRes.data);
      setClientes(clientesRes.data);
    } catch (err) {
      setError('Error al cargar datos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const obtenerLunesDeSemana = (fecha) => {
    const d = new Date(fecha);
    const dia = d.getDay();
    const diff = d.getDate() - dia + (dia === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleCrearPlantilla = () => {
    const hoy = new Date();
    const lunes = obtenerLunesDeSemana(hoy);
    setFormPlantilla({
      nombre: `Semana ${meses[mesSeleccionado - 1]} ${añoSeleccionado}`,
      descripcion: '',
      esPlantillaBase: false,
      semanaReferencia: lunes.toISOString().split('T')[0]
    });
    setPlantillaEditando(null);
    setMostrarModal(true);
  };

  const handleGuardarPlantilla = async (e) => {
    e.preventDefault();
    try {
      const fechaRef = new Date(formPlantilla.semanaReferencia);
      const datos = {
        ...formPlantilla,
        mes: fechaRef.getMonth() + 1,
        año: fechaRef.getFullYear()
      };

      if (plantillaEditando) {
        await plantillasAPI.actualizar(plantillaEditando._id, datos);
        setMensaje('Plantilla actualizada correctamente');
      } else {
        await plantillasAPI.crear(datos);
        setMensaje('Plantilla creada correctamente');
      }

      setMostrarModal(false);
      cargarDatos();
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al guardar plantilla');
    }
  };

  const handleEditarSesiones = (plantilla) => {
    setPlantillaSeleccionada(plantilla);
    setMostrarEditor(true);
  };

  const handleDuplicar = (plantilla) => {
    setPlantillaDuplicar(plantilla);
    const siguienteSemana = new Date(plantilla.semanaReferencia);
    siguienteSemana.setDate(siguienteSemana.getDate() + 7);
    setFormDuplicar({
      nuevaSemanaReferencia: siguienteSemana.toISOString().split('T')[0],
      nuevoNombre: `${plantilla.nombre} - Copia`
    });
    setMostrarModalDuplicar(true);
  };

  const handleConfirmarDuplicar = async () => {
    try {
      await plantillasAPI.duplicar(plantillaDuplicar._id, formDuplicar);
      setMensaje('Plantilla duplicada correctamente');
      setMostrarModalDuplicar(false);
      cargarDatos();
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al duplicar plantilla');
    }
  };

  const handleAplicarPlantilla = async (plantilla) => {
    if (!window.confirm(`¿Aplicar la plantilla "${plantilla.nombre}"? Esto creará las reservas correspondientes.`)) {
      return;
    }

    try {
      const res = await plantillasAPI.aplicar(plantilla._id);
      setMensaje(res.data.mensaje);
      cargarDatos();
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al aplicar plantilla');
    }
  };

  const handleEliminarPlantilla = async (plantilla) => {
    if (!window.confirm(`¿Eliminar la plantilla "${plantilla.nombre}"?`)) {
      return;
    }

    try {
      await plantillasAPI.eliminar(plantilla._id);
      setMensaje('Plantilla eliminada correctamente');
      cargarDatos();
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al eliminar plantilla');
    }
  };

  const getEstadoBadge = (estado) => {
    const colores = {
      borrador: { bg: '#6c757d', text: '#fff' },
      activa: { bg: '#28a745', text: '#fff' },
      aplicada: { bg: '#17a2b8', text: '#fff' },
      archivada: { bg: '#ffc107', text: '#000' }
    };
    return colores[estado] || colores.borrador;
  };

  // Componente Editor de Sesiones
  const EditorSesiones = ({ plantilla, onClose, onUpdate }) => {
    const [sesiones, setSesiones] = useState(plantilla.sesiones || []);
    const [mostrarFormSesion, setMostrarFormSesion] = useState(false);
    const [formSesion, setFormSesion] = useState({
      entrenador: '',
      diaSemana: 1,
      horaInicio: '08:00',
      horaFin: '09:00',
      cliente: '',
      tipoSesion: 'individual',
      duracion: 60,
      notas: ''
    });

    const horas = [];
    for (let h = 8; h <= 21; h++) {
      horas.push(`${h.toString().padStart(2, '0')}:00`);
      if (h < 21) horas.push(`${h.toString().padStart(2, '0')}:30`);
    }

    const handleAñadirSesion = async () => {
      if (!formSesion.entrenador) {
        setError('Selecciona un entrenador');
        return;
      }

      try {
        const datos = {
          ...formSesion,
          cliente: formSesion.cliente || null
        };
        await plantillasAPI.añadirSesion(plantilla._id, datos);
        setMensaje('Sesión añadida');
        setMostrarFormSesion(false);
        onUpdate();
      } catch (err) {
        setError(err.response?.data?.mensaje || 'Error al añadir sesión');
      }
    };

    const handleEliminarSesion = async (sesionId) => {
      try {
        await plantillasAPI.eliminarSesion(plantilla._id, sesionId);
        setMensaje('Sesión eliminada');
        onUpdate();
      } catch (err) {
        setError(err.response?.data?.mensaje || 'Error al eliminar sesión');
      }
    };

    const getSesionesPorDia = (dia) => {
      return plantilla.sesiones
        .filter(s => s.diaSemana === dia)
        .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
    };

    return (
      <div style={styles.modalOverlay}>
        <div style={styles.editorModal}>
          <div style={styles.editorHeader}>
            <h2>{plantilla.nombre}</h2>
            <p>Semana del {formatearFecha(plantilla.semanaReferencia)}</p>
            <button onClick={onClose} style={styles.closeButton}>×</button>
          </div>

          <div style={styles.editorContent}>
            <div style={styles.editorActions}>
              <button
                onClick={() => setMostrarFormSesion(true)}
                style={styles.addButton}
              >
                + Añadir Sesión
              </button>
            </div>

            {mostrarFormSesion && (
              <div style={styles.formSesion}>
                <h4>Nueva Sesión</h4>
                <div style={styles.formGrid}>
                  <div style={styles.formGroup}>
                    <label>Entrenador *</label>
                    <select
                      value={formSesion.entrenador}
                      onChange={(e) => setFormSesion({ ...formSesion, entrenador: e.target.value })}
                      style={styles.select}
                    >
                      <option value="">Seleccionar...</option>
                      {entrenadores.map(e => (
                        <option key={e._id} value={e._id}>{e.nombre}</option>
                      ))}
                    </select>
                  </div>

                  <div style={styles.formGroup}>
                    <label>Día</label>
                    <select
                      value={formSesion.diaSemana}
                      onChange={(e) => setFormSesion({ ...formSesion, diaSemana: parseInt(e.target.value) })}
                      style={styles.select}
                    >
                      {diasSemana.map((d, i) => (
                        <option key={i} value={i + 1}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div style={styles.formGroup}>
                    <label>Hora Inicio</label>
                    <select
                      value={formSesion.horaInicio}
                      onChange={(e) => setFormSesion({ ...formSesion, horaInicio: e.target.value })}
                      style={styles.select}
                    >
                      {horas.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  <div style={styles.formGroup}>
                    <label>Hora Fin</label>
                    <select
                      value={formSesion.horaFin}
                      onChange={(e) => setFormSesion({ ...formSesion, horaFin: e.target.value })}
                      style={styles.select}
                    >
                      {horas.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  <div style={styles.formGroup}>
                    <label>Cliente (opcional)</label>
                    <select
                      value={formSesion.cliente}
                      onChange={(e) => setFormSesion({ ...formSesion, cliente: e.target.value })}
                      style={styles.select}
                    >
                      <option value="">Sin asignar (slot vacío)</option>
                      {clientes.map(c => (
                        <option key={c._id} value={c._id}>{c.nombre} {c.apellido}</option>
                      ))}
                    </select>
                  </div>

                  <div style={styles.formGroup}>
                    <label>Tipo Sesión</label>
                    <select
                      value={formSesion.tipoSesion}
                      onChange={(e) => setFormSesion({ ...formSesion, tipoSesion: e.target.value })}
                      style={styles.select}
                    >
                      <option value="individual">Individual</option>
                      <option value="pareja">Pareja</option>
                      <option value="grupo">Grupo</option>
                    </select>
                  </div>
                </div>

                <div style={styles.formActions}>
                  <button onClick={handleAñadirSesion} style={styles.saveButton}>
                    Guardar Sesión
                  </button>
                  <button onClick={() => setMostrarFormSesion(false)} style={styles.cancelButton}>
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            <div style={styles.calendarioGrid}>
              {diasSemana.map((dia, index) => (
                <div key={index} style={styles.diaColumna}>
                  <div style={styles.diaHeader}>{dia}</div>
                  <div style={styles.sesionesLista}>
                    {getSesionesPorDia(index + 1).map(sesion => (
                      <div key={sesion._id} style={styles.sesionCard}>
                        <div style={styles.sesionHora}>
                          {sesion.horaInicio} - {sesion.horaFin}
                        </div>
                        <div style={styles.sesionEntrenador}>
                          {sesion.entrenador?.nombre || 'Sin entrenador'}
                        </div>
                        <div style={styles.sesionCliente}>
                          {sesion.cliente
                            ? `${sesion.cliente.nombre} ${sesion.cliente.apellido}`
                            : 'Slot vacío'}
                        </div>
                        <button
                          onClick={() => handleEliminarSesion(sesion._id)}
                          style={styles.deleteSessionButton}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    {getSesionesPorDia(index + 1).length === 0 && (
                      <div style={styles.sinSesiones}>Sin sesiones</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return <div style={styles.loading}>Cargando plantillas...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Plantillas Semanales</h1>
        <button onClick={handleCrearPlantilla} style={styles.primaryButton}>
          + Nueva Plantilla
        </button>
      </div>

      {error && (
        <div style={styles.error}>
          {error}
          <button onClick={() => setError('')} style={styles.closeAlert}>×</button>
        </div>
      )}

      {mensaje && (
        <div style={styles.success}>
          {mensaje}
          <button onClick={() => setMensaje('')} style={styles.closeAlert}>×</button>
        </div>
      )}

      <div style={styles.filtros}>
        <div style={styles.filtroGroup}>
          <label>Mes:</label>
          <select
            value={mesSeleccionado}
            onChange={(e) => setMesSeleccionado(parseInt(e.target.value))}
            style={styles.select}
          >
            {meses.map((mes, index) => (
              <option key={index} value={index + 1}>{mes}</option>
            ))}
          </select>
        </div>

        <div style={styles.filtroGroup}>
          <label>Año:</label>
          <select
            value={añoSeleccionado}
            onChange={(e) => setAñoSeleccionado(parseInt(e.target.value))}
            style={styles.select}
          >
            {[2024, 2025, 2026, 2027].map(año => (
              <option key={año} value={año}>{año}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={styles.plantillasGrid}>
        {plantillas.length === 0 ? (
          <div style={styles.noData}>
            No hay plantillas para {meses[mesSeleccionado - 1]} {añoSeleccionado}
          </div>
        ) : (
          plantillas.map(plantilla => (
            <div key={plantilla._id} style={styles.plantillaCard}>
              <div style={styles.plantillaHeader}>
                <h3>{plantilla.nombre}</h3>
                {plantilla.esPlantillaBase && (
                  <span style={styles.baseBadge}>BASE</span>
                )}
              </div>

              <div style={styles.plantillaInfo}>
                <p><strong>Semana del:</strong> {formatearFecha(plantilla.semanaReferencia)}</p>
                <p><strong>Sesiones:</strong> {plantilla.sesiones?.length || 0}</p>
                <p>
                  <strong>Estado:</strong>
                  <span style={{
                    ...styles.estadoBadge,
                    backgroundColor: getEstadoBadge(plantilla.estado).bg,
                    color: getEstadoBadge(plantilla.estado).text
                  }}>
                    {plantilla.estado}
                  </span>
                </p>
              </div>

              <div style={styles.plantillaActions}>
                <button
                  onClick={() => handleEditarSesiones(plantilla)}
                  style={styles.actionButton}
                >
                  Editar Sesiones
                </button>
                <button
                  onClick={() => handleDuplicar(plantilla)}
                  style={styles.actionButton}
                >
                  Duplicar
                </button>
                {plantilla.estado !== 'aplicada' && (
                  <button
                    onClick={() => handleAplicarPlantilla(plantilla)}
                    style={styles.applyButton}
                  >
                    Aplicar
                  </button>
                )}
                <button
                  onClick={() => handleEliminarPlantilla(plantilla)}
                  style={styles.deleteButton}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Crear/Editar Plantilla */}
      {mostrarModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h2>{plantillaEditando ? 'Editar Plantilla' : 'Nueva Plantilla'}</h2>
            <form onSubmit={handleGuardarPlantilla}>
              <div style={styles.formGroup}>
                <label>Nombre *</label>
                <input
                  type="text"
                  value={formPlantilla.nombre}
                  onChange={(e) => setFormPlantilla({ ...formPlantilla, nombre: e.target.value })}
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label>Descripción</label>
                <textarea
                  value={formPlantilla.descripcion}
                  onChange={(e) => setFormPlantilla({ ...formPlantilla, descripcion: e.target.value })}
                  style={styles.textarea}
                />
              </div>

              <div style={styles.formGroup}>
                <label>Fecha del Lunes de la Semana *</label>
                <input
                  type="date"
                  value={formPlantilla.semanaReferencia}
                  onChange={(e) => setFormPlantilla({ ...formPlantilla, semanaReferencia: e.target.value })}
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={formPlantilla.esPlantillaBase}
                    onChange={(e) => setFormPlantilla({ ...formPlantilla, esPlantillaBase: e.target.checked })}
                  />
                  Marcar como Plantilla Base del Mes
                </label>
                <small style={styles.hint}>
                  La plantilla base representa el horario ideal del mes y se usa como referencia para los entrenadores.
                </small>
              </div>

              <div style={styles.modalActions}>
                <button type="submit" style={styles.saveButton}>
                  Guardar
                </button>
                <button
                  type="button"
                  onClick={() => setMostrarModal(false)}
                  style={styles.cancelButton}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Duplicar */}
      {mostrarModalDuplicar && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h2>Duplicar Plantilla</h2>
            <p>Duplicando: {plantillaDuplicar?.nombre}</p>

            <div style={styles.formGroup}>
              <label>Nuevo Nombre</label>
              <input
                type="text"
                value={formDuplicar.nuevoNombre}
                onChange={(e) => setFormDuplicar({ ...formDuplicar, nuevoNombre: e.target.value })}
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label>Fecha del Lunes de la Nueva Semana</label>
              <input
                type="date"
                value={formDuplicar.nuevaSemanaReferencia}
                onChange={(e) => setFormDuplicar({ ...formDuplicar, nuevaSemanaReferencia: e.target.value })}
                style={styles.input}
              />
            </div>

            <div style={styles.modalActions}>
              <button onClick={handleConfirmarDuplicar} style={styles.saveButton}>
                Duplicar
              </button>
              <button
                onClick={() => setMostrarModalDuplicar(false)}
                style={styles.cancelButton}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Editor de Sesiones */}
      {mostrarEditor && plantillaSeleccionada && (
        <EditorSesiones
          plantilla={plantillaSeleccionada}
          onClose={() => {
            setMostrarEditor(false);
            setPlantillaSeleccionada(null);
          }}
          onUpdate={async () => {
            const res = await plantillasAPI.obtenerPorId(plantillaSeleccionada._id);
            setPlantillaSeleccionada(res.data);
            cargarDatos();
          }}
        />
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1400px',
    margin: '0 auto'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '10px'
  },
  title: {
    margin: 0,
    color: '#1a365d'
  },
  primaryButton: {
    backgroundColor: '#c41e3a',
    color: '#fff',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600'
  },
  filtros: {
    display: 'flex',
    gap: '20px',
    marginBottom: '20px',
    flexWrap: 'wrap'
  },
  filtroGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  select: {
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid #ddd',
    fontSize: '14px'
  },
  plantillasGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '20px'
  },
  plantillaCard: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  plantillaHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px'
  },
  baseBadge: {
    backgroundColor: '#c41e3a',
    color: '#fff',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 'bold'
  },
  plantillaInfo: {
    marginBottom: '15px'
  },
  estadoBadge: {
    marginLeft: '8px',
    padding: '3px 8px',
    borderRadius: '4px',
    fontSize: '12px'
  },
  plantillaActions: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap'
  },
  actionButton: {
    backgroundColor: '#f8f9fa',
    border: '1px solid #ddd',
    padding: '6px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px'
  },
  applyButton: {
    backgroundColor: '#28a745',
    color: '#fff',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px'
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    color: '#fff',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px'
  },
  noData: {
    textAlign: 'center',
    padding: '40px',
    color: '#666',
    gridColumn: '1 / -1'
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    fontSize: '16px'
  },
  error: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
    padding: '12px 20px',
    borderRadius: '8px',
    marginBottom: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  success: {
    backgroundColor: '#d4edda',
    color: '#155724',
    padding: '12px 20px',
    borderRadius: '8px',
    marginBottom: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  closeAlert: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '30px',
    width: '90%',
    maxWidth: '500px',
    maxHeight: '90vh',
    overflow: 'auto'
  },
  editorModal: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    width: '95%',
    maxWidth: '1200px',
    maxHeight: '95vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column'
  },
  editorHeader: {
    padding: '20px',
    borderBottom: '1px solid #eee',
    position: 'relative'
  },
  closeButton: {
    position: 'absolute',
    top: '15px',
    right: '15px',
    background: 'none',
    border: 'none',
    fontSize: '28px',
    cursor: 'pointer',
    color: '#666'
  },
  editorContent: {
    padding: '20px',
    overflow: 'auto',
    flex: 1
  },
  editorActions: {
    marginBottom: '20px'
  },
  addButton: {
    backgroundColor: '#c41e3a',
    color: '#fff',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '8px',
    cursor: 'pointer'
  },
  formSesion: {
    backgroundColor: '#f8f9fa',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '20px'
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '15px'
  },
  formGroup: {
    marginBottom: '15px'
  },
  input: {
    width: '100%',
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid #ddd',
    fontSize: '14px',
    boxSizing: 'border-box'
  },
  textarea: {
    width: '100%',
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid #ddd',
    fontSize: '14px',
    minHeight: '80px',
    resize: 'vertical',
    boxSizing: 'border-box'
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer'
  },
  hint: {
    display: 'block',
    marginTop: '5px',
    color: '#666',
    fontSize: '12px'
  },
  formActions: {
    display: 'flex',
    gap: '10px',
    marginTop: '15px'
  },
  modalActions: {
    display: 'flex',
    gap: '10px',
    marginTop: '20px'
  },
  saveButton: {
    backgroundColor: '#28a745',
    color: '#fff',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  cancelButton: {
    backgroundColor: '#6c757d',
    color: '#fff',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  calendarioGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '10px'
  },
  diaColumna: {
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    minHeight: '300px'
  },
  diaHeader: {
    backgroundColor: '#1a365d',
    color: '#fff',
    padding: '10px',
    textAlign: 'center',
    fontWeight: '600',
    borderRadius: '8px 8px 0 0'
  },
  sesionesLista: {
    padding: '10px'
  },
  sesionCard: {
    backgroundColor: '#fff',
    padding: '10px',
    borderRadius: '6px',
    marginBottom: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    position: 'relative'
  },
  sesionHora: {
    fontWeight: '600',
    color: '#c41e3a',
    marginBottom: '5px'
  },
  sesionEntrenador: {
    fontSize: '13px',
    color: '#333'
  },
  sesionCliente: {
    fontSize: '12px',
    color: '#666',
    marginTop: '3px'
  },
  deleteSessionButton: {
    position: 'absolute',
    top: '5px',
    right: '5px',
    background: 'none',
    border: 'none',
    color: '#dc3545',
    cursor: 'pointer',
    fontSize: '18px'
  },
  sinSesiones: {
    textAlign: 'center',
    color: '#999',
    padding: '20px',
    fontSize: '13px'
  }
};

export default PlantillasSemanales;
