import { useState, useEffect } from 'react';
import { plantillasAPI, usersAPI, clientesAPI } from '../services/api';

const PlantillasSemanales = () => {
  const [entrenadores, setEntrenadores] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  // Filtros
  const [mesSeleccionado, setMesSeleccionado] = useState(new Date().getMonth() + 1);
  const [añoSeleccionado, setAñoSeleccionado] = useState(new Date().getFullYear());
  const [entrenadorActivo, setEntrenadorActivo] = useState('todos');

  // Plantilla y sesiones
  const [plantillaActual, setPlantillaActual] = useState(null);
  const [sesiones, setSesiones] = useState([]);
  const [cambiosPendientes, setCambiosPendientes] = useState(false);

  // Modal de edición de celda
  const [celdaEditando, setCeldaEditando] = useState(null);
  const [formSesion, setFormSesion] = useState({
    cliente: '',
    duracion: 60,
    tipoSesion: 'individual'
  });

  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

  // Generar horas cada 30 minutos
  const horas = [];
  for (let h = 8; h <= 20; h++) {
    horas.push(`${h.toString().padStart(2, '0')}:00`);
    if (h < 20) horas.push(`${h.toString().padStart(2, '0')}:30`);
  }

  // Colores por entrenador
  const coloresEntrenador = [
    '#e3f2fd', '#fff3e0', '#e8f5e9', '#fce4ec', '#f3e5f5',
    '#e0f7fa', '#fff8e1', '#f1f8e9', '#ffebee', '#ede7f6'
  ];

  const getColorEntrenador = (entrenadorId) => {
    const index = entrenadores.findIndex(e => e._id === entrenadorId);
    return coloresEntrenador[index % coloresEntrenador.length];
  };

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  useEffect(() => {
    cargarPlantilla();
  }, [mesSeleccionado, añoSeleccionado]);

  const cargarDatosIniciales = async () => {
    try {
      setLoading(true);
      const [entrenadoresRes, clientesRes] = await Promise.all([
        usersAPI.obtenerEntrenadores(),
        clientesAPI.obtenerTodos()
      ]);
      setEntrenadores(entrenadoresRes.data);
      setClientes(clientesRes.data);
    } catch (err) {
      setError('Error al cargar datos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const cargarPlantilla = async () => {
    try {
      const res = await plantillasAPI.obtenerPlantillaBase(mesSeleccionado, añoSeleccionado);
      setPlantillaActual(res.data);
      setSesiones(res.data.sesiones || []);
      setCambiosPendientes(false);
    } catch (err) {
      if (err.response?.status === 404) {
        setPlantillaActual(null);
        setSesiones([]);
      } else {
        console.error('Error cargando plantilla:', err);
      }
    }
  };

  const crearPlantillaBase = async () => {
    try {
      const primerLunes = obtenerPrimerLunesMes(añoSeleccionado, mesSeleccionado);
      const datos = {
        nombre: `Plantilla Base ${meses[mesSeleccionado - 1]} ${añoSeleccionado}`,
        descripcion: 'Plantilla base del mes',
        mes: mesSeleccionado,
        año: añoSeleccionado,
        semanaReferencia: primerLunes.toISOString().split('T')[0],
        esPlantillaBase: true
      };
      const res = await plantillasAPI.crear(datos);
      setPlantillaActual(res.data);
      setSesiones([]);
      setMensaje('Plantilla creada correctamente');
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al crear plantilla');
    }
  };

  const obtenerPrimerLunesMes = (año, mes) => {
    const primerDia = new Date(año, mes - 1, 1);
    const diaSemana = primerDia.getDay();
    const diasHastaLunes = diaSemana === 0 ? 1 : (diaSemana === 1 ? 0 : 8 - diaSemana);
    primerDia.setDate(primerDia.getDate() + diasHastaLunes);
    return primerDia;
  };

  // Buscar sesión en una celda específica
  const getSesionEnCelda = (dia, hora) => {
    return sesiones.find(s => {
      const coincideDia = s.diaSemana === dia;
      const coincideHora = s.horaInicio === hora;
      const coincideEntrenador = entrenadorActivo === 'todos' ||
        s.entrenador?._id === entrenadorActivo ||
        s.entrenador === entrenadorActivo;
      return coincideDia && coincideHora && coincideEntrenador;
    });
  };

  // Verificar si una celda es continuación de una sesión de 1h
  const esCeldaContinuacion = (dia, hora) => {
    const horaAnterior = obtenerHoraAnterior(hora);
    if (!horaAnterior) return null;

    const sesionAnterior = sesiones.find(s => {
      const coincideDia = s.diaSemana === dia;
      const coincideHora = s.horaInicio === horaAnterior;
      const duracion = s.duracion || 60;
      const coincideEntrenador = entrenadorActivo === 'todos' ||
        s.entrenador?._id === entrenadorActivo ||
        s.entrenador === entrenadorActivo;
      return coincideDia && coincideHora && duracion >= 60 && coincideEntrenador;
    });

    return sesionAnterior || null;
  };

  const obtenerHoraAnterior = (hora) => {
    const [h, m] = hora.split(':').map(Number);
    if (m === 30) return `${h.toString().padStart(2, '0')}:00`;
    if (h > 8) return `${(h - 1).toString().padStart(2, '0')}:30`;
    return null;
  };

  const calcularHoraFin = (horaInicio, duracion) => {
    const [h, m] = horaInicio.split(':').map(Number);
    const totalMinutos = h * 60 + m + duracion;
    const nuevaHora = Math.floor(totalMinutos / 60);
    const nuevosMinutos = totalMinutos % 60;
    return `${nuevaHora.toString().padStart(2, '0')}:${nuevosMinutos.toString().padStart(2, '0')}`;
  };

  // Click en celda
  const handleClickCelda = (dia, hora) => {
    const sesionExistente = getSesionEnCelda(dia, hora);
    const esContinuacion = esCeldaContinuacion(dia, hora);

    if (esContinuacion) {
      // Es parte de una sesión de 1h, editar la sesión original
      setCeldaEditando({
        dia,
        hora: esContinuacion.horaInicio,
        sesion: esContinuacion
      });
      setFormSesion({
        cliente: esContinuacion.cliente?._id || esContinuacion.cliente || '',
        duracion: esContinuacion.duracion || 60,
        tipoSesion: esContinuacion.tipoSesion || 'individual',
        entrenador: esContinuacion.entrenador?._id || esContinuacion.entrenador || ''
      });
    } else if (sesionExistente) {
      // Editar sesión existente
      setCeldaEditando({
        dia,
        hora,
        sesion: sesionExistente
      });
      setFormSesion({
        cliente: sesionExistente.cliente?._id || sesionExistente.cliente || '',
        duracion: sesionExistente.duracion || 60,
        tipoSesion: sesionExistente.tipoSesion || 'individual',
        entrenador: sesionExistente.entrenador?._id || sesionExistente.entrenador || ''
      });
    } else {
      // Nueva sesión
      if (entrenadorActivo === 'todos') {
        setError('Selecciona un entrenador primero');
        return;
      }
      setCeldaEditando({ dia, hora, sesion: null });
      setFormSesion({
        cliente: '',
        duracion: 60,
        tipoSesion: 'individual',
        entrenador: entrenadorActivo
      });
    }
  };

  const handleGuardarSesion = async () => {
    if (!plantillaActual) {
      setError('No hay plantilla. Crea una primero.');
      return;
    }

    try {
      const datos = {
        entrenador: formSesion.entrenador || entrenadorActivo,
        diaSemana: celdaEditando.dia,
        horaInicio: celdaEditando.hora,
        horaFin: calcularHoraFin(celdaEditando.hora, formSesion.duracion),
        cliente: formSesion.cliente || null,
        tipoSesion: formSesion.tipoSesion,
        duracion: formSesion.duracion
      };

      if (celdaEditando.sesion) {
        // Eliminar sesión anterior y crear nueva
        await plantillasAPI.eliminarSesion(plantillaActual._id, celdaEditando.sesion._id);
      }

      await plantillasAPI.añadirSesion(plantillaActual._id, datos);
      setMensaje('Sesión guardada');
      setCeldaEditando(null);
      cargarPlantilla();
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al guardar sesión');
    }
  };

  const handleEliminarSesion = async () => {
    if (!celdaEditando?.sesion) return;

    try {
      await plantillasAPI.eliminarSesion(plantillaActual._id, celdaEditando.sesion._id);
      setMensaje('Sesión eliminada');
      setCeldaEditando(null);
      cargarPlantilla();
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al eliminar sesión');
    }
  };

  const getNombreCliente = (sesion) => {
    if (!sesion.cliente) return 'Slot vacío';
    if (typeof sesion.cliente === 'object') {
      return `${sesion.cliente.nombre} ${sesion.cliente.apellido || ''}`.trim();
    }
    const cliente = clientes.find(c => c._id === sesion.cliente);
    return cliente ? `${cliente.nombre} ${cliente.apellido || ''}`.trim() : 'Cliente';
  };

  const getNombreEntrenador = (sesion) => {
    if (typeof sesion.entrenador === 'object') {
      return sesion.entrenador.nombre;
    }
    const entrenador = entrenadores.find(e => e._id === sesion.entrenador);
    return entrenador ? entrenador.nombre : '';
  };

  if (loading) {
    return <div style={styles.loading}>Cargando...</div>;
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Horario Base Semanal</h1>
        <p style={styles.subtitle}>Define el horario ideal de cada entrenador</p>
      </div>

      {/* Alertas */}
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

      {/* Barra de controles */}
      <div style={styles.controles}>
        <div style={styles.filtros}>
          <div style={styles.filtroGroup}>
            <label>Mes:</label>
            <select
              value={mesSeleccionado}
              onChange={(e) => setMesSeleccionado(parseInt(e.target.value))}
              style={styles.select}
            >
              {meses.map((mes, i) => (
                <option key={i} value={i + 1}>{mes}</option>
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
              {[2024, 2025, 2026, 2027].map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>

          <div style={styles.filtroGroup}>
            <label>Entrenador:</label>
            <select
              value={entrenadorActivo}
              onChange={(e) => setEntrenadorActivo(e.target.value)}
              style={styles.selectEntrenador}
            >
              <option value="todos">Todos los entrenadores</option>
              {entrenadores.map(e => (
                <option key={e._id} value={e._id}>{e.nombre}</option>
              ))}
            </select>
          </div>
        </div>

        {!plantillaActual && (
          <button onClick={crearPlantillaBase} style={styles.crearButton}>
            + Crear Plantilla Base
          </button>
        )}
      </div>

      {/* Leyenda de entrenadores */}
      {entrenadorActivo === 'todos' && (
        <div style={styles.leyenda}>
          {entrenadores.map((e, i) => (
            <div key={e._id} style={styles.leyendaItem}>
              <span style={{
                ...styles.leyendaColor,
                backgroundColor: coloresEntrenador[i % coloresEntrenador.length]
              }}></span>
              {e.nombre}
            </div>
          ))}
        </div>
      )}

      {/* Grid del calendario */}
      {plantillaActual ? (
        <div style={styles.gridContainer}>
          <table style={styles.grid}>
            <thead>
              <tr>
                <th style={styles.thHora}>Hora</th>
                {diasSemana.map((dia, i) => (
                  <th key={i} style={styles.thDia}>{dia}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {horas.map((hora) => (
                <tr key={hora}>
                  <td style={styles.tdHora}>{hora}</td>
                  {diasSemana.map((_, diaIndex) => {
                    const dia = diaIndex + 1;
                    const sesion = getSesionEnCelda(dia, hora);
                    const continuacion = esCeldaContinuacion(dia, hora);

                    if (continuacion) {
                      // Celda de continuación (parte inferior de sesión 1h)
                      return (
                        <td
                          key={diaIndex}
                          style={{
                            ...styles.tdCelda,
                            ...styles.celdaContinuacion,
                            backgroundColor: getColorEntrenador(
                              continuacion.entrenador?._id || continuacion.entrenador
                            ),
                            cursor: 'pointer'
                          }}
                          onClick={() => handleClickCelda(dia, hora)}
                        >
                          <div style={styles.continuacionContent}>
                            <span style={styles.continuacionLabel}>↑ continúa</span>
                          </div>
                        </td>
                      );
                    }

                    if (sesion) {
                      // Celda con sesión
                      return (
                        <td
                          key={diaIndex}
                          style={{
                            ...styles.tdCelda,
                            ...styles.celdaOcupada,
                            backgroundColor: getColorEntrenador(
                              sesion.entrenador?._id || sesion.entrenador
                            ),
                            cursor: 'pointer'
                          }}
                          onClick={() => handleClickCelda(dia, hora)}
                        >
                          <div style={styles.sesionContent}>
                            <div style={styles.sesionCliente}>
                              {getNombreCliente(sesion)}
                            </div>
                            {entrenadorActivo === 'todos' && (
                              <div style={styles.sesionEntrenador}>
                                {getNombreEntrenador(sesion)}
                              </div>
                            )}
                            <div style={styles.sesionDuracion}>
                              {sesion.duracion || 60} min
                            </div>
                          </div>
                        </td>
                      );
                    }

                    // Celda vacía
                    return (
                      <td
                        key={diaIndex}
                        style={{
                          ...styles.tdCelda,
                          ...styles.celdaVacia,
                          cursor: entrenadorActivo !== 'todos' ? 'pointer' : 'default'
                        }}
                        onClick={() => handleClickCelda(dia, hora)}
                      >
                        {entrenadorActivo !== 'todos' && (
                          <span style={styles.addIcon}>+</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={styles.noPlantilla}>
          <p>No hay plantilla base para {meses[mesSeleccionado - 1]} {añoSeleccionado}</p>
          <p>Crea una para empezar a planificar los horarios.</p>
        </div>
      )}

      {/* Modal de edición */}
      {celdaEditando && (
        <div style={styles.modalOverlay} onClick={() => setCeldaEditando(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>
              {celdaEditando.sesion ? 'Editar Sesión' : 'Nueva Sesión'}
            </h3>
            <p style={styles.modalSubtitle}>
              {diasSemana[celdaEditando.dia - 1]} a las {celdaEditando.hora}
            </p>

            <div style={styles.formGroup}>
              <label>Entrenador</label>
              <select
                value={formSesion.entrenador || entrenadorActivo}
                onChange={(e) => setFormSesion({ ...formSesion, entrenador: e.target.value })}
                style={styles.selectModal}
                disabled={entrenadorActivo !== 'todos' && !celdaEditando.sesion}
              >
                {entrenadores.map(e => (
                  <option key={e._id} value={e._id}>{e.nombre}</option>
                ))}
              </select>
            </div>

            <div style={styles.formGroup}>
              <label>Cliente</label>
              <select
                value={formSesion.cliente}
                onChange={(e) => setFormSesion({ ...formSesion, cliente: e.target.value })}
                style={styles.selectModal}
              >
                <option value="">Sin asignar (slot vacío)</option>
                {clientes.map(c => (
                  <option key={c._id} value={c._id}>
                    {c.nombre} {c.apellido}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.formGroup}>
              <label>Duración</label>
              <div style={styles.duracionButtons}>
                <button
                  type="button"
                  onClick={() => setFormSesion({ ...formSesion, duracion: 30 })}
                  style={{
                    ...styles.duracionBtn,
                    ...(formSesion.duracion === 30 ? styles.duracionBtnActivo : {})
                  }}
                >
                  30 min
                </button>
                <button
                  type="button"
                  onClick={() => setFormSesion({ ...formSesion, duracion: 60 })}
                  style={{
                    ...styles.duracionBtn,
                    ...(formSesion.duracion === 60 ? styles.duracionBtnActivo : {})
                  }}
                >
                  1 hora
                </button>
              </div>
            </div>

            <div style={styles.formGroup}>
              <label>Tipo de Sesión</label>
              <select
                value={formSesion.tipoSesion}
                onChange={(e) => setFormSesion({ ...formSesion, tipoSesion: e.target.value })}
                style={styles.selectModal}
              >
                <option value="individual">Individual</option>
                <option value="pareja">Pareja</option>
                <option value="grupo">Grupo</option>
              </select>
            </div>

            <div style={styles.modalActions}>
              <button onClick={handleGuardarSesion} style={styles.saveButton}>
                Guardar
              </button>
              {celdaEditando.sesion && (
                <button onClick={handleEliminarSesion} style={styles.deleteButton}>
                  Eliminar
                </button>
              )}
              <button onClick={() => setCeldaEditando(null)} style={styles.cancelButton}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
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
    marginBottom: '20px'
  },
  title: {
    margin: 0,
    color: '#1a365d'
  },
  subtitle: {
    color: '#666',
    marginTop: '5px'
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
  controles: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '15px'
  },
  filtros: {
    display: 'flex',
    gap: '15px',
    flexWrap: 'wrap',
    alignItems: 'center'
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
    fontSize: '14px',
    minWidth: '100px'
  },
  selectEntrenador: {
    padding: '8px 12px',
    borderRadius: '6px',
    border: '2px solid #75b760',
    fontSize: '14px',
    minWidth: '180px',
    fontWeight: '500'
  },
  crearButton: {
    backgroundColor: '#c41e3a',
    color: '#fff',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600'
  },
  leyenda: {
    display: 'flex',
    gap: '15px',
    marginBottom: '15px',
    flexWrap: 'wrap',
    padding: '10px 15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px'
  },
  leyendaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px'
  },
  leyendaColor: {
    width: '16px',
    height: '16px',
    borderRadius: '4px',
    border: '1px solid #ddd'
  },
  gridContainer: {
    overflowX: 'auto',
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  grid: {
    width: '100%',
    borderCollapse: 'collapse',
    minWidth: '800px'
  },
  thHora: {
    backgroundColor: '#1a365d',
    color: '#fff',
    padding: '12px 8px',
    fontWeight: '600',
    width: '80px',
    position: 'sticky',
    left: 0,
    zIndex: 2
  },
  thDia: {
    backgroundColor: '#1a365d',
    color: '#fff',
    padding: '12px 8px',
    fontWeight: '600',
    textAlign: 'center'
  },
  tdHora: {
    backgroundColor: '#f8f9fa',
    padding: '8px',
    fontWeight: '500',
    fontSize: '13px',
    textAlign: 'center',
    borderBottom: '1px solid #eee',
    position: 'sticky',
    left: 0,
    zIndex: 1
  },
  tdCelda: {
    padding: '4px',
    borderBottom: '1px solid #eee',
    borderRight: '1px solid #eee',
    height: '45px',
    verticalAlign: 'top',
    transition: 'background-color 0.2s'
  },
  celdaVacia: {
    backgroundColor: '#fff'
  },
  celdaOcupada: {
    borderRadius: '4px'
  },
  celdaContinuacion: {
    borderTop: 'none',
    opacity: 0.7
  },
  sesionContent: {
    padding: '4px 6px',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center'
  },
  sesionCliente: {
    fontWeight: '600',
    fontSize: '12px',
    color: '#333',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  sesionEntrenador: {
    fontSize: '10px',
    color: '#666',
    marginTop: '2px'
  },
  sesionDuracion: {
    fontSize: '10px',
    color: '#888',
    marginTop: '2px'
  },
  continuacionContent: {
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  continuacionLabel: {
    fontSize: '10px',
    color: '#999'
  },
  addIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: '#ccc',
    fontSize: '20px',
    fontWeight: '300'
  },
  noPlantilla: {
    textAlign: 'center',
    padding: '60px 20px',
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    color: '#666'
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
    padding: '25px',
    width: '90%',
    maxWidth: '400px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
  },
  modalTitle: {
    margin: '0 0 5px 0',
    color: '#1a365d'
  },
  modalSubtitle: {
    color: '#666',
    margin: '0 0 20px 0',
    fontSize: '14px'
  },
  formGroup: {
    marginBottom: '15px'
  },
  selectModal: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '6px',
    border: '1px solid #ddd',
    fontSize: '14px',
    marginTop: '5px'
  },
  duracionButtons: {
    display: 'flex',
    gap: '10px',
    marginTop: '5px'
  },
  duracionBtn: {
    flex: 1,
    padding: '10px',
    border: '2px solid #ddd',
    borderRadius: '6px',
    backgroundColor: '#fff',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s'
  },
  duracionBtnActivo: {
    borderColor: '#75b760',
    backgroundColor: '#75b760',
    color: '#fff'
  },
  modalActions: {
    display: 'flex',
    gap: '10px',
    marginTop: '20px'
  },
  saveButton: {
    flex: 1,
    padding: '12px',
    backgroundColor: '#28a745',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500'
  },
  deleteButton: {
    padding: '12px 20px',
    backgroundColor: '#dc3545',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500'
  },
  cancelButton: {
    padding: '12px 20px',
    backgroundColor: '#6c757d',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500'
  }
};

export default PlantillasSemanales;
