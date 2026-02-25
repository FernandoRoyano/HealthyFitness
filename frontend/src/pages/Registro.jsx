import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Registro() {
  const [formulario, setFormulario] = useState({
    nombre: '',
    email: '',
    password: '',
    telefono: '',
    rol: 'entrenador'
  });
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const { registro } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormulario({
      ...formulario,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    try {
      await registro(formulario);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al registrarse');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>HealthyFitness</h1>
        <h2 style={styles.subtitle}>Crear Cuenta</h2>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Nombre Completo*</label>
            <input
              type="text"
              name="nombre"
              value={formulario.nombre}
              onChange={handleChange}
              required
              style={styles.input}
              placeholder="Juan Pérez"
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Email*</label>
            <input
              type="email"
              name="email"
              value={formulario.email}
              onChange={handleChange}
              required
              style={styles.input}
              placeholder="tu@email.com"
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Teléfono</label>
            <input
              type="tel"
              name="telefono"
              value={formulario.telefono}
              onChange={handleChange}
              style={styles.input}
              placeholder="+34 600 000 000"
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Contraseña*</label>
            <input
              type="password"
              name="password"
              value={formulario.password}
              onChange={handleChange}
              required
              minLength="6"
              style={styles.input}
              placeholder="••••••••"
            />
            <small style={styles.hint}>Mínimo 6 caracteres</small>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Rol*</label>
            <select
              name="rol"
              value={formulario.rol}
              onChange={handleChange}
              style={styles.input}
            >
              <option value="entrenador">Entrenador</option>
              <option value="gerente">Gerente</option>
            </select>
            <small style={styles.hint}>Selecciona tu rol en el centro</small>
          </div>

          <button
            type="submit"
            disabled={cargando}
            style={{...styles.button, opacity: cargando ? 0.7 : 1}}
          >
            {cargando ? 'Creando cuenta...' : 'Registrarse'}
          </button>
        </form>

        <div style={styles.loginLink}>
          ¿Ya tienes cuenta? <a href="/login" style={styles.link}>Inicia sesión aquí</a>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    padding: '20px'
  },
  card: {
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '8px',
    boxShadow: '0 4px 6px -1px rgba(15,23,42,0.07), 0 2px 4px -2px rgba(15,23,42,0.05)',
    width: '100%',
    maxWidth: '420px',
    border: '1px solid #e2e8f0'
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: '8px',
    textAlign: 'center',
    fontFamily: 'Inter, sans-serif'
  },
  subtitle: {
    fontSize: '18px',
    color: '#64748b',
    marginBottom: '30px',
    textAlign: 'center',
    fontFamily: 'Inter, sans-serif',
    fontWeight: '400'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#0f172a',
    fontFamily: 'Inter, sans-serif'
  },
  input: {
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    outline: 'none',
    fontFamily: 'Inter, sans-serif'
  },
  hint: {
    fontSize: '12px',
    color: '#94a3b8'
  },
  button: {
    padding: '12px',
    fontSize: '15px',
    fontWeight: '600',
    color: 'white',
    backgroundColor: '#10b981',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    marginTop: '8px',
    fontFamily: 'Inter, sans-serif'
  },
  error: {
    padding: '10px',
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    borderRadius: '6px',
    marginBottom: '16px',
    fontSize: '14px',
    border: '1px solid #fecaca'
  },
  loginLink: {
    marginTop: '20px',
    textAlign: 'center',
    fontSize: '14px',
    color: '#64748b'
  },
  link: {
    color: '#10b981',
    textDecoration: 'none',
    fontWeight: '500'
  }
};

export default Registro;
