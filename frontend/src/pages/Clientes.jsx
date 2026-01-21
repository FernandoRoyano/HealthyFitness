import { useState, useEffect, useRef } from 'react';
import { clientesAPI, usersAPI, facturacionAPI, productosAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import './Clientes.css';

function Clientes() {
  const { usuario } = useAuth();
  const esGerente = usuario?.rol === 'gerente';
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
  // Estados para membresía/suscripción
  const [suscripcionCliente, setSuscripcionCliente] = useState(null);
  const [cargandoSuscripcion, setCargandoSuscripcion] = useState(false);
  const [mostrarModalSuscripcion, setMostrarModalSuscripcion] = useState(false);
  const [productos, setProductos] = useState([]);
  const [formSuscripcion, setFormSuscripcion] = useState({
    producto: '',
    diasPorSemana: '2',
    diasEspecificos: [],
    notas: ''
  });
  const [precioCalculado, setPrecioCalculado] = useState(null);
  const [guardandoSuscripcion, setGuardandoSuscripcion] = useState(false);
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
      const [clientesRes, entrenadoresRes, productosRes] = await Promise.all([
        clientesAPI.obtenerTodos(),
        usersAPI.obtenerEntrenadores(),
        productosAPI.obtenerTodos({ activo: true })
      ]);
      setClientes(clientesRes.data);
      setEntrenadores(entrenadoresRes.data);
      setProductos(productosRes.data);
    } catch {
      setError('Error al cargar datos');
    } finally {
      setCargando(false);
    }
  };

  // Cargar suscripción de un cliente
  const cargarSuscripcionCliente = async (clienteId) => {
    setCargandoSuscripcion(true);
    setSuscripcionCliente(null);
    try {
      const res = await facturacionAPI.obtenerSuscripcionCliente(clienteId);
      if (res.data.existe) {
        setSuscripcionCliente(res.data);
      }
    } catch (err) {
      console.error('Error al cargar suscripción:', err);
    } finally {
      setCargandoSuscripcion(false);
    }
  };

  // Calcular precio según producto y días
  const calcularPrecio = async (productoId, diasPorSemana) => {
    if (!productoId || !diasPorSemana) {
      setPrecioCalculado(null);
      return;
    }
    try {
      const res = await productosAPI.obtenerPrecio({
        producto_id: productoId,
        dias_semana: parseInt(diasPorSemana)
      });
      setPrecioCalculado(res.data.precio);
    } catch {
      setPrecioCalculado(null);
    }
  };

  // Handler para cambios en el form de suscripción
  const handleSuscripcionChange = (e) => {
    const { name, value } = e.target;
    setFormSuscripcion(prev => ({ ...prev, [name]: value }));

    if (name === 'producto' || name === 'diasPorSemana') {
      const productoId = name === 'producto' ? value : formSuscripcion.producto;
      const dias = name === 'diasPorSemana' ? value : formSuscripcion.diasPorSemana;
      calcularPrecio(productoId, dias);
    }
  };

  // Toggle día específico
  const toggleDiaEspecifico = (dia) => {
    setFormSuscripcion(prev => {
      const dias = prev.diasEspecificos.includes(dia)
        ? prev.diasEspecificos.filter(d => d !== dia)
        : [...prev.diasEspecificos, dia];
      return { ...prev, diasEspecificos: dias };
    });
  };

  // Abrir modal de suscripción
  const abrirModalSuscripcion = () => {
    if (suscripcionCliente) {
      // Editar existente
      setFormSuscripcion({
        producto: suscripcionCliente.producto?._id || '',
        diasPorSemana: suscripcionCliente.diasPorSemana?.toString() || '2',
        diasEspecificos: suscripcionCliente.diasEspecificos || [],
        notas: suscripcionCliente.notas || ''
      });
      setPrecioCalculado(suscripcionCliente.precioUnitarioFijado);
    } else {
      // Nueva suscripción
      setFormSuscripcion({
        producto: productos.length > 0 ? productos[0]._id : '',
        diasPorSemana: '2',
        diasEspecificos: [],
        notas: ''
      });
      if (productos.length > 0) {
        calcularPrecio(productos[0]._id, '2');
      }
    }
    setMostrarModalSuscripcion(true);
  };

  // Guardar suscripción
  const guardarSuscripcion = async () => {
    if (!clienteEditando || !formSuscripcion.producto) return;

    setGuardandoSuscripcion(true);
    try {
      await facturacionAPI.guardarSuscripcion(clienteEditando._id, {
        productoId: formSuscripcion.producto,
        diasPorSemana: parseInt(formSuscripcion.diasPorSemana),
        diasEspecificos: formSuscripcion.diasEspecificos,
        notas: formSuscripcion.notas
      });

      // Recargar suscripción
      await cargarSuscripcionCliente(clienteEditando._id);
      setMostrarModalSuscripcion(false);
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al guardar suscripción');
    } finally {
      setGuardandoSuscripcion(false);
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
    // Cargar suscripción del cliente
    cargarSuscripcionCliente(cliente._id);
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
    // Limpiar estados de suscripción
    setSuscripcionCliente(null);
    setMostrarModalSuscripcion(false);
    setPrecioCalculado(null);
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
        <div>
          <h1 style={styles.title}>{esGerente ? 'Gestión de Clientes' : 'Mis Clientes'}</h1>
          <p style={styles.subtitle}>
            {esGerente
              ? `${clientes.length} clientes registrados en el sistema`
              : `${clientes.length} clientes asignados a tu perfil`
            }
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {esGerente && (
            <button
              onClick={() => setMostrarImportar(true)}
              style={styles.buttonSecondary}
            >
              📥 Importar
            </button>
          )}
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

              {/* Sección de Membresía - Solo visible al editar */}
              {clienteEditando && (
                <div className="seccion-membresia" style={styles.membresiaSection}>
                  <h3 style={styles.membresiaTitle}>Membresía</h3>
                  {cargandoSuscripcion ? (
                    <div style={styles.membresiaLoading}>Cargando información de membresía...</div>
                  ) : suscripcionCliente ? (
                    <div className="membresia-info" style={styles.membresiaCard}>
                      <div style={styles.membresiaIcono}>
                        <span style={{ fontSize: '24px' }}>✓</span>
                      </div>
                      <div style={styles.membresiaDetalles}>
                        <div style={styles.membresiaProducto}>{suscripcionCliente.producto?.nombre || 'Producto'}</div>
                        <div style={styles.membresiaDatos}>
                          {suscripcionCliente.diasPorSemana} días/semana - <strong>{suscripcionCliente.precioUnitarioFijado?.toFixed(2)}€</strong>/sesión
                        </div>
                        {suscripcionCliente.diasEspecificos?.length > 0 && (
                          <div style={styles.membresiaDias}>
                            {suscripcionCliente.diasEspecificos.join(', ')}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={abrirModalSuscripcion}
                        style={styles.membresiaEditarBtn}
                      >
                        Editar
                      </button>
                    </div>
                  ) : (
                    <div style={styles.sinMembresia}>
                      <span style={styles.sinMembresiaTexto}>Este cliente no tiene membresía asignada</span>
                      <button
                        type="button"
                        onClick={abrirModalSuscripcion}
                        style={styles.asignarMembresiaBtn}
                      >
                        + Asignar Membresía
                      </button>
                    </div>
                  )}
                </div>
              )}

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

      {/* Modal de Suscripción/Membresía */}
      {mostrarModalSuscripcion && (
        <div style={styles.modal} onClick={() => setMostrarModalSuscripcion(false)}>
          <div style={{ ...styles.modalContent, maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2>{suscripcionCliente ? 'Editar Membresía' : 'Asignar Membresía'}</h2>
              <button onClick={() => setMostrarModalSuscripcion(false)} style={styles.closeButton}>×</button>
            </div>
            <div style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Tipo de Entrenamiento*</label>
                <select
                  name="producto"
                  value={formSuscripcion.producto}
                  onChange={handleSuscripcionChange}
                  style={styles.input}
                >
                  <option value="">Seleccionar tipo</option>
                  {productos.map(producto => (
                    <option key={producto._id} value={producto._id}>
                      {producto.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Días por Semana*</label>
                <select
                  name="diasPorSemana"
                  value={formSuscripcion.diasPorSemana}
                  onChange={handleSuscripcionChange}
                  style={styles.input}
                >
                  {[1, 2, 3, 4, 5].map(n => (
                    <option key={n} value={n}>{n} día{n > 1 ? 's' : ''}/semana</option>
                  ))}
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Días Específicos (opcional)</label>
                <div style={styles.diasSemana}>
                  {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'].map(dia => (
                    <button
                      key={dia}
                      type="button"
                      onClick={() => toggleDiaEspecifico(dia)}
                      style={{
                        ...styles.diaBtn,
                        ...(formSuscripcion.diasEspecificos.includes(dia) ? styles.diaBtnActivo : {})
                      }}
                    >
                      {dia.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>

              {precioCalculado !== null && (
                <div style={styles.precioPreview}>
                  <span>Precio por sesión:</span>
                  <strong style={{ fontSize: '20px', color: '#28a745' }}>{precioCalculado.toFixed(2)}€</strong>
                </div>
              )}

              <div style={styles.formGroup}>
                <label style={styles.label}>Notas</label>
                <textarea
                  name="notas"
                  value={formSuscripcion.notas}
                  onChange={handleSuscripcionChange}
                  rows="2"
                  placeholder="Notas adicionales sobre la membresía..."
                  style={{ ...styles.input, resize: 'vertical' }}
                />
              </div>

              <div style={styles.formActions}>
                <button
                  type="button"
                  onClick={() => setMostrarModalSuscripcion(false)}
                  style={styles.buttonSecondary}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={guardarSuscripcion}
                  disabled={guardandoSuscripcion || !formSuscripcion.producto}
                  style={styles.buttonPrimary}
                >
                  {guardandoSuscripcion ? 'Guardando...' : 'Guardar Membresía'}
                </button>
              </div>
            </div>
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
    color: '#333',
    margin: 0
  },
  subtitle: {
    fontSize: '14px',
    color: '#666',
    marginTop: '4px'
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
  },
  // Estilos para sección de membresía
  membresiaSection: {
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    padding: '16px',
    marginTop: '10px',
    border: '1px solid #e9ecef'
  },
  membresiaTitle: {
    margin: '0 0 12px 0',
    fontSize: '16px',
    fontWeight: '600',
    color: '#333',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  membresiaLoading: {
    color: '#666',
    fontSize: '14px',
    textAlign: 'center',
    padding: '15px'
  },
  membresiaCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    backgroundColor: '#f0fdf4',
    borderRadius: '8px',
    border: '1px solid #86efac'
  },
  membresiaIcono: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#22c55e',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    flexShrink: 0
  },
  membresiaDetalles: {
    flex: 1
  },
  membresiaProducto: {
    fontWeight: '600',
    color: '#166534',
    fontSize: '15px'
  },
  membresiaDatos: {
    fontSize: '13px',
    color: '#166534',
    marginTop: '2px'
  },
  membresiaDias: {
    fontSize: '12px',
    color: '#15803d',
    marginTop: '4px'
  },
  membresiaEditarBtn: {
    padding: '6px 14px',
    fontSize: '13px',
    fontWeight: '500',
    color: '#166534',
    backgroundColor: '#dcfce7',
    border: '1px solid #86efac',
    borderRadius: '6px',
    cursor: 'pointer'
  },
  sinMembresia: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    padding: '20px',
    backgroundColor: '#fef3c7',
    borderRadius: '8px',
    border: '1px solid #fcd34d'
  },
  sinMembresiaTexto: {
    color: '#92400e',
    fontSize: '14px'
  },
  asignarMembresiaBtn: {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '500',
    color: 'white',
    backgroundColor: '#f59e0b',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer'
  },
  // Estilos para modal de suscripción
  diasSemana: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap'
  },
  diaBtn: {
    padding: '8px 12px',
    fontSize: '13px',
    fontWeight: '500',
    color: '#666',
    backgroundColor: '#f3f4f6',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  diaBtnActivo: {
    backgroundColor: '#dbeafe',
    color: '#1d4ed8',
    borderColor: '#3b82f6'
  },
  precioPreview: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px',
    backgroundColor: '#f0fdf4',
    borderRadius: '8px',
    border: '1px solid #86efac',
    marginTop: '5px'
  }
};

export default Clientes;
