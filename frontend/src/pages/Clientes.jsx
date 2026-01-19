import { useState, useEffect, useRef } from 'react';
import { clientesAPI, usersAPI } from '../services/api';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import './Clientes.css';

function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [entrenadores, setEntrenadores] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [clienteEditando, setClienteEditando] = useState(null);
  const [mostrarImportar, setMostrarImportar] = useState(false);
  const [archivoCSV, setArchivoCSV] = useState(null);
  const [previewCSV, setPreviewCSV] = useState(null);
  const [entrenadorImportar, setEntrenadorImportar] = useState('');
  const [importando, setImportando] = useState(false);
  const [resultadoImportacion, setResultadoImportacion] = useState(null);
  const fileInputRef = useRef(null);
  const fotoInputRef = useRef(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [archivoFoto, setArchivoFoto] = useState(null);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [formulario, setFormulario] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    fechaNacimiento: '',
    genero: 'otro',
    direccion: '',
    objetivos: '',
    condicionesMedicas: '',
    peso: '',
    altura: '',
    nivelActividad: 'sedentario',
    notas: '',
    numeroCuenta: '',
    entrenador: ''
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [clientesRes, entrenadoresRes] = await Promise.all([
        clientesAPI.obtenerTodos(),
        usersAPI.obtenerEntrenadores()
      ]);
      setClientes(clientesRes.data);
      setEntrenadores(entrenadoresRes.data);
    } catch {
      setError('Error al cargar datos');
    } finally {
      setCargando(false);
    }
  };

  const cargarClientes = async () => {
    try {
      const { data } = await clientesAPI.obtenerTodos();
      setClientes(data);
    } catch {
      setError('Error al cargar clientes');
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
      let clienteId;
      if (clienteEditando) {
        await clientesAPI.actualizar(clienteEditando._id, formulario);
        clienteId = clienteEditando._id;
      } else {
        const { data } = await clientesAPI.crear(formulario);
        clienteId = data._id;
      }

      // Si hay foto nueva, subirla
      if (archivoFoto && clienteId) {
        await handleSubirFoto(clienteId);
      }

      cargarClientes();
      cerrarFormulario();
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al guardar cliente');
    }
  };

  const handleEditar = (cliente) => {
    setClienteEditando(cliente);
    setFormulario({
      nombre: cliente.nombre,
      apellido: cliente.apellido,
      email: cliente.email,
      telefono: cliente.telefono,
      fechaNacimiento: cliente.fechaNacimiento?.split('T')[0] || '',
      genero: cliente.genero || 'otro',
      direccion: cliente.direccion || '',
      objetivos: cliente.objetivos || '',
      condicionesMedicas: cliente.condicionesMedicas || '',
      peso: cliente.peso || '',
      altura: cliente.altura || '',
      nivelActividad: cliente.nivelActividad || 'sedentario',
      notas: cliente.notas || '',
      numeroCuenta: cliente.numeroCuenta || '',
      entrenador: cliente.entrenador?._id || ''
    });
    // Si tiene foto, mostrar preview
    if (cliente.foto) {
      const apiUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
      setFotoPreview(`${apiUrl}${cliente.foto}`);
    } else {
      setFotoPreview(null);
    }
    setArchivoFoto(null);
    setMostrarFormulario(true);
  };

  const handleEliminar = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este cliente?')) {
      try {
        await clientesAPI.eliminar(id);
        cargarClientes();
      } catch {
        setError('Error al eliminar cliente');
      }
    }
  };

  const cerrarFormulario = () => {
    setMostrarFormulario(false);
    setClienteEditando(null);
    setFotoPreview(null);
    setArchivoFoto(null);
    setFormulario({
      nombre: '',
      apellido: '',
      email: '',
      telefono: '',
      fechaNacimiento: '',
      genero: 'otro',
      direccion: '',
      objetivos: '',
      condicionesMedicas: '',
      peso: '',
      altura: '',
      nivelActividad: 'sedentario',
      notas: '',
      numeroCuenta: '',
      entrenador: ''
    });
  };

  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setArchivoFoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubirFoto = async (clienteId) => {
    if (!archivoFoto) return;

    setSubiendoFoto(true);
    try {
      const formData = new FormData();
      formData.append('foto', archivoFoto);
      await clientesAPI.subirFoto(clienteId, formData);
      setArchivoFoto(null);
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al subir foto');
    } finally {
      setSubiendoFoto(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setArchivoCSV(file);
      const fileName = file.name.toLowerCase();

      if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        // Preview de archivo Excel
        const reader = new FileReader();
        reader.onload = (event) => {
          const data = new Uint8Array(event.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
          setPreviewCSV(jsonData.slice(0, 5)); // Mostrar solo las primeras 5 filas
        };
        reader.readAsArrayBuffer(file);
      } else {
        // Preview de archivo CSV
        Papa.parse(file, {
          header: true,
          preview: 5,
          complete: (results) => {
            setPreviewCSV(results.data);
          }
        });
      }
    }
  };

  const handleImportarCSV = async () => {
    if (!archivoCSV) {
      setError('Debe seleccionar un archivo');
      return;
    }

    setImportando(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('archivo', archivoCSV);
      formData.append('entrenadorId', entrenadorImportar);

      const { data } = await clientesAPI.importar(formData);
      setResultadoImportacion(data);
      cargarClientes();
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al importar clientes');
    } finally {
      setImportando(false);
    }
  };

  const cerrarModalImportar = () => {
    setMostrarImportar(false);
    setArchivoCSV(null);
    setPreviewCSV(null);
    setEntrenadorImportar('');
    setResultadoImportacion(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (cargando) return <div style={styles.container}>Cargando...</div>;

  return (
    <div style={styles.container}>
      <div className="clientes-header" style={styles.header}>
        <h1 style={styles.title}>Gestión de Clientes</h1>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setMostrarImportar(true)}
            style={styles.buttonSecondary}
          >
            📥 Importar
          </button>
          <button
            onClick={() => setMostrarFormulario(true)}
            style={styles.buttonPrimary}
          >
            + Nuevo Cliente
          </button>
        </div>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {mostrarFormulario && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h2>{clienteEditando ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
              <button onClick={cerrarFormulario} style={styles.closeButton}>×</button>
            </div>
            <form onSubmit={handleSubmit} style={styles.form}>
              {/* FOTO DESHABILITADA TEMPORALMENTE - Se reactivará cuando se implemente Cloudinary
              <div style={styles.fotoSection}>
                <div style={styles.fotoPreviewContainer}>
                  {fotoPreview ? (
                    <img src={fotoPreview} alt="Preview" style={styles.fotoPreview} />
                  ) : (
                    <div style={styles.fotoPlaceholder}>
                      <span style={{ fontSize: '40px' }}>👤</span>
                    </div>
                  )}
                </div>
                <div style={styles.fotoActions}>
                  <input
                    ref={fotoInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFotoChange}
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    onClick={() => fotoInputRef.current?.click()}
                    style={styles.buttonSecondary}
                  >
                    {fotoPreview ? 'Cambiar foto' : 'Subir foto'}
                  </button>
                  <span style={{ fontSize: '12px', color: '#666' }}>Opcional (JPG, PNG, WebP)</span>
                </div>
              </div>
              */}

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Nombre*</label>
                  <input
                    type="text"
                    name="nombre"
                    value={formulario.nombre}
                    onChange={handleChange}
                    required
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Apellido*</label>
                  <input
                    type="text"
                    name="apellido"
                    value={formulario.apellido}
                    onChange={handleChange}
                    required
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Email*</label>
                  <input
                    type="email"
                    name="email"
                    value={formulario.email}
                    onChange={handleChange}
                    required
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Teléfono*</label>
                  <input
                    type="tel"
                    name="telefono"
                    value={formulario.telefono}
                    onChange={handleChange}
                    required
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Entrenador Asignado*</label>
                <select
                  name="entrenador"
                  value={formulario.entrenador}
                  onChange={handleChange}
                  required
                  style={styles.input}
                >
                  <option value="">Seleccionar entrenador</option>
                  {entrenadores.map((entrenador) => (
                    <option key={entrenador._id} value={entrenador._id}>
                      {entrenador.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Fecha de Nacimiento</label>
                  <input
                    type="date"
                    name="fechaNacimiento"
                    value={formulario.fechaNacimiento}
                    onChange={handleChange}
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Género</label>
                  <select
                    name="genero"
                    value={formulario.genero}
                    onChange={handleChange}
                    style={styles.input}
                  >
                    <option value="masculino">Masculino</option>
                    <option value="femenino">Femenino</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Dirección</label>
                <input
                  type="text"
                  name="direccion"
                  value={formulario.direccion}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Número de Cuenta (IBAN)</label>
                <input
                  type="text"
                  name="numeroCuenta"
                  value={formulario.numeroCuenta}
                  onChange={handleChange}
                  placeholder="ES00 0000 0000 0000 0000 0000"
                  style={styles.input}
                />
                <span style={{ fontSize: '12px', color: '#666' }}>Opcional - Para recibos domiciliados</span>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Peso (kg)</label>
                  <input
                    type="number"
                    name="peso"
                    value={formulario.peso}
                    onChange={handleChange}
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Altura (cm)</label>
                  <input
                    type="number"
                    name="altura"
                    value={formulario.altura}
                    onChange={handleChange}
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Nivel de Actividad</label>
                <select
                  name="nivelActividad"
                  value={formulario.nivelActividad}
                  onChange={handleChange}
                  style={styles.input}
                >
                  <option value="sedentario">Sedentario</option>
                  <option value="ligero">Ligero</option>
                  <option value="moderado">Moderado</option>
                  <option value="activo">Activo</option>
                  <option value="muy-activo">Muy Activo</option>
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Objetivos</label>
                <textarea
                  name="objetivos"
                  value={formulario.objetivos}
                  onChange={handleChange}
                  rows="3"
                  style={{...styles.input, resize: 'vertical'}}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Condiciones Médicas</label>
                <textarea
                  name="condicionesMedicas"
                  value={formulario.condicionesMedicas}
                  onChange={handleChange}
                  rows="2"
                  style={{...styles.input, resize: 'vertical'}}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Notas</label>
                <textarea
                  name="notas"
                  value={formulario.notas}
                  onChange={handleChange}
                  rows="2"
                  style={{...styles.input, resize: 'vertical'}}
                />
              </div>

              <div style={styles.formActions}>
                <button type="button" onClick={cerrarFormulario} style={styles.buttonSecondary}>
                  Cancelar
                </button>
                <button type="submit" style={styles.buttonPrimary}>
                  {clienteEditando ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {mostrarImportar && (
        <div style={styles.modal} onClick={cerrarModalImportar}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2>Importar Clientes</h2>
              <button onClick={cerrarModalImportar} style={styles.closeButton}>×</button>
            </div>
            <div style={styles.form}>
              {!resultadoImportacion ? (
                <>
                  <div style={styles.importInfo}>
                    <h3 style={{ marginBottom: '10px', fontSize: '16px' }}>Formatos aceptados</h3>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                      <span style={styles.formatBadge}>📄 CSV</span>
                      <span style={styles.formatBadge}>📊 Excel (.xlsx)</span>
                      <span style={styles.formatBadge}>📊 Excel (.xls)</span>
                    </div>
                    <p style={{ marginBottom: '10px', fontSize: '14px', color: '#666' }}>
                      El archivo debe incluir al menos estas columnas (en cualquier orden):
                    </p>
                    <ul style={{ marginLeft: '20px', fontSize: '14px', color: '#666' }}>
                      <li><strong>nombre</strong> o <strong>name</strong> (requerido)</li>
                      <li><strong>apellido</strong>, <strong>lastname</strong> o <strong>surname</strong> (requerido)</li>
                      <li><strong>email</strong> o <strong>correo</strong> (requerido)</li>
                      <li><strong>telefono</strong>, <strong>phone</strong> o <strong>teléfono</strong> (requerido)</li>
                    </ul>
                    <p style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
                      Campos opcionales: fechaNacimiento, genero, direccion, objetivos, condicionesMedicas, peso, altura, nivelActividad, notas
                    </p>
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Seleccionar archivo (CSV o Excel)*</label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleFileChange}
                      style={styles.inputFile}
                    />
                  </div>

                  {previewCSV && (
                    <div style={styles.preview}>
                      <h4 style={{ marginBottom: '10px', fontSize: '14px' }}>Vista previa (primeras 5 filas)</h4>
                      <div style={{ overflowX: 'auto' }}>
                        <table style={styles.previewTable}>
                          <thead>
                            <tr>
                              {Object.keys(previewCSV[0] || {}).map(key => (
                                <th key={key} style={styles.previewTh}>{key}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {previewCSV.map((row, idx) => (
                              <tr key={idx}>
                                {Object.values(row).map((value, i) => (
                                  <td key={i} style={styles.previewTd}>{value || '-'}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Asignar a entrenador (opcional)</label>
                    <select
                      value={entrenadorImportar}
                      onChange={(e) => setEntrenadorImportar(e.target.value)}
                      style={styles.input}
                    >
                      <option value="">Sin asignar</option>
                      {entrenadores.map((entrenador) => (
                        <option key={entrenador._id} value={entrenador._id}>
                          {entrenador.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={styles.formActions}>
                    <button type="button" onClick={cerrarModalImportar} style={styles.buttonSecondary}>
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleImportarCSV}
                      style={styles.buttonPrimary}
                      disabled={importando || !archivoCSV}
                    >
                      {importando ? 'Importando...' : 'Importar'}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div style={styles.resultadoImportacion}>
                    <h3 style={{ color: '#28a745', marginBottom: '15px' }}>
                      ✓ Importación completada
                    </h3>
                    <p style={{ fontSize: '14px', marginBottom: '15px' }}>
                      {resultadoImportacion.mensaje}
                    </p>

                    {resultadoImportacion.clientesImportados.length > 0 && (
                      <div style={{ marginBottom: '15px' }}>
                        <h4 style={{ fontSize: '14px', marginBottom: '8px' }}>
                          Clientes importados ({resultadoImportacion.clientesImportados.length}):
                        </h4>
                        <div style={styles.listaClientes}>
                          {resultadoImportacion.clientesImportados.map((cliente, idx) => (
                            <div key={idx} style={styles.clienteItem}>
                              ✓ {cliente.nombre} {cliente.apellido} - {cliente.email}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {resultadoImportacion.errores && resultadoImportacion.errores.length > 0 && (
                      <div>
                        <h4 style={{ fontSize: '14px', marginBottom: '8px', color: '#dc3545' }}>
                          Errores ({resultadoImportacion.errores.length}):
                        </h4>
                        <div style={styles.listaErrores}>
                          {resultadoImportacion.errores.map((err, idx) => (
                            <div key={idx} style={styles.errorItem}>
                              Línea {err.linea}: {err.error}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={styles.formActions}>
                    <button type="button" onClick={cerrarModalImportar} style={styles.buttonPrimary}>
                      Cerrar
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Vista de tabla para desktop */}
      <div className="desktop-table" style={styles.table}>
        {clientes.length === 0 ? (
          <p style={styles.empty}>No hay clientes registrados</p>
        ) : (
          <table style={styles.tableElement}>
            <thead>
              <tr>
                <th style={styles.th}>Nombre</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Teléfono</th>
                <th style={styles.th}>Entrenador</th>
                <th style={styles.th}>Objetivos</th>
                <th style={styles.th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((cliente) => (
                <tr key={cliente._id} style={styles.tr}>
                  <td style={styles.td}>{cliente.nombre} {cliente.apellido}</td>
                  <td style={styles.td}>{cliente.email}</td>
                  <td style={styles.td}>{cliente.telefono}</td>
                  <td style={styles.td}>{cliente.entrenador?.nombre || '-'}</td>
                  <td style={styles.td}>{cliente.objetivos || '-'}</td>
                  <td style={styles.td}>
                    <button
                      onClick={() => handleEditar(cliente)}
                      style={styles.buttonEdit}
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleEliminar(cliente._id)}
                      style={styles.buttonDelete}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Vista de cards para móvil */}
      <div className="mobile-cards" style={styles.mobileCards}>
        {clientes.length === 0 ? (
          <p style={styles.empty}>No hay clientes registrados</p>
        ) : (
          clientes.map((cliente) => (
            <div key={cliente._id} style={styles.clienteCard}>
              <div style={styles.clienteCardHeader}>
                <h3 style={styles.clienteNombre}>{cliente.nombre} {cliente.apellido}</h3>
                {cliente.entrenador?.nombre && (
                  <span style={styles.entrenadorBadge}>{cliente.entrenador.nombre}</span>
                )}
              </div>
              <div style={styles.clienteCardBody}>
                <div style={styles.clienteInfo}>
                  <span style={styles.clienteLabel}>📧 Email:</span>
                  <span style={styles.clienteValue}>{cliente.email}</span>
                </div>
                <div style={styles.clienteInfo}>
                  <span style={styles.clienteLabel}>📱 Teléfono:</span>
                  <span style={styles.clienteValue}>{cliente.telefono}</span>
                </div>
                {cliente.objetivos && (
                  <div style={styles.clienteInfo}>
                    <span style={styles.clienteLabel}>🎯 Objetivos:</span>
                    <span style={styles.clienteValue}>{cliente.objetivos}</span>
                  </div>
                )}
              </div>
              <div style={styles.clienteCardActions}>
                <button
                  onClick={() => handleEditar(cliente)}
                  style={styles.buttonEditMobile}
                >
                  Editar
                </button>
                <button
                  onClick={() => handleEliminar(cliente._id)}
                  style={styles.buttonDeleteMobile}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

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
    marginBottom: '30px',
    flexWrap: 'wrap',
    gap: '15px'
  },
  title: {
    fontSize: 'clamp(22px, 5vw, 28px)',
    fontWeight: 'bold',
    color: '#333'
  },
  buttonPrimary: {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '500',
    color: 'white',
    backgroundColor: '#007bff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  buttonSecondary: {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#333',
    backgroundColor: '#e0e0e0',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  buttonEdit: {
    padding: '6px 12px',
    fontSize: '12px',
    color: 'white',
    backgroundColor: '#28a745',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginRight: '5px'
  },
  buttonDelete: {
    padding: '6px 12px',
    fontSize: '12px',
    color: 'white',
    backgroundColor: '#dc3545',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  error: {
    padding: '10px',
    backgroundColor: '#fee',
    color: '#c00',
    borderRadius: '4px',
    marginBottom: '20px'
  },
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    overflowY: 'auto',
    padding: '20px'
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: '8px',
    width: '100%',
    maxWidth: '700px',
    maxHeight: '90vh',
    overflowY: 'auto'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    borderBottom: '1px solid #ddd'
  },
  closeButton: {
    fontSize: '32px',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    color: '#666'
  },
  form: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '15px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#333'
  },
  input: {
    padding: '8px 12px',
    fontSize: '14px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    outline: 'none'
  },
  formActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '10px'
  },
  table: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    overflow: 'hidden'
  },
  tableElement: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  th: {
    padding: '12px',
    textAlign: 'left',
    backgroundColor: '#f8f9fa',
    fontWeight: '600',
    color: '#333',
    borderBottom: '2px solid #dee2e6'
  },
  tr: {
    borderBottom: '1px solid #dee2e6'
  },
  td: {
    padding: '12px'
  },
  empty: {
    padding: '40px',
    textAlign: 'center',
    color: '#666'
  },
  importInfo: {
    backgroundColor: '#f8f9fa',
    padding: '15px',
    borderRadius: '6px',
    marginBottom: '15px'
  },
  inputFile: {
    padding: '8px',
    fontSize: '14px',
    border: '1px solid #ddd',
    borderRadius: '4px'
  },
  preview: {
    backgroundColor: '#f8f9fa',
    padding: '15px',
    borderRadius: '6px',
    maxHeight: '300px',
    overflowY: 'auto'
  },
  previewTable: {
    width: '100%',
    fontSize: '12px',
    borderCollapse: 'collapse'
  },
  previewTh: {
    padding: '8px',
    textAlign: 'left',
    backgroundColor: '#e9ecef',
    borderBottom: '2px solid #dee2e6',
    fontWeight: 'bold',
    whiteSpace: 'nowrap'
  },
  previewTd: {
    padding: '8px',
    borderBottom: '1px solid #dee2e6',
    whiteSpace: 'nowrap'
  },
  resultadoImportacion: {
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '6px'
  },
  listaClientes: {
    maxHeight: '200px',
    overflowY: 'auto',
    backgroundColor: 'white',
    padding: '10px',
    borderRadius: '4px',
    border: '1px solid #dee2e6'
  },
  clienteItem: {
    padding: '6px 0',
    fontSize: '13px',
    color: '#28a745'
  },
  listaErrores: {
    maxHeight: '200px',
    overflowY: 'auto',
    backgroundColor: 'white',
    padding: '10px',
    borderRadius: '4px',
    border: '1px solid #dee2e6'
  },
  errorItem: {
    padding: '6px 0',
    fontSize: '13px',
    color: '#dc3545'
  },
  // Estilos para cards móviles
  mobileCards: {
    display: 'none',
    flexDirection: 'column',
    gap: '15px'
  },
  clienteCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    overflow: 'hidden'
  },
  clienteCardHeader: {
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderBottom: '1px solid #e9ecef',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '10px'
  },
  clienteNombre: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '600',
    color: '#1a1a1a'
  },
  entrenadorBadge: {
    backgroundColor: '#75b760',
    color: 'white',
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '500'
  },
  clienteCardBody: {
    padding: '15px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  clienteInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  clienteLabel: {
    fontSize: '12px',
    color: '#666',
    fontWeight: '500'
  },
  clienteValue: {
    fontSize: '14px',
    color: '#333',
    wordBreak: 'break-word'
  },
  clienteCardActions: {
    padding: '15px',
    borderTop: '1px solid #e9ecef',
    display: 'flex',
    gap: '10px'
  },
  buttonEditMobile: {
    flex: 1,
    padding: '10px 16px',
    fontSize: '14px',
    fontWeight: '500',
    color: 'white',
    backgroundColor: '#28a745',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer'
  },
  buttonDeleteMobile: {
    flex: 1,
    padding: '10px 16px',
    fontSize: '14px',
    fontWeight: '500',
    color: 'white',
    backgroundColor: '#dc3545',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer'
  },
  formatBadge: {
    display: 'inline-block',
    padding: '4px 10px',
    backgroundColor: '#e9ecef',
    borderRadius: '4px',
    fontSize: '13px',
    color: '#495057',
    fontWeight: '500'
  },
  // Estilos para sección de foto
  fotoSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    marginBottom: '10px'
  },
  fotoPreviewContainer: {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    overflow: 'hidden',
    border: '3px solid #dee2e6',
    flexShrink: 0
  },
  fotoPreview: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  fotoPlaceholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e9ecef'
  },
  fotoActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  }
};

export default Clientes;
