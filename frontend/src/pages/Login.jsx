import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Login() {
  const [credenciales, setCredenciales] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setCredenciales({
      ...credenciales,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    try {
      await login(credenciales);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al iniciar sesión');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>HealthyFitness</h1>
        <h2 style={styles.subtitle}>Iniciar Sesión</h2>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              name="email"
              value={credenciales.email}
              onChange={handleChange}
              required
              style={styles.input}
              placeholder="tu@email.com"
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Contraseña</label>
            <input
              type="password"
              name="password"
              value={credenciales.password}
              onChange={handleChange}
              required
              style={styles.input}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={cargando}
            style={{...styles.button, opacity: cargando ? 0.7 : 1}}
          >
            {cargando ? 'Cargando...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div style={styles.helpText}>
          <strong>Nota:</strong> Si eres entrenador y no tienes acceso, contacta con el gerente del centro.
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
    padding: '16px'
  },
  card: {
    backgroundColor: 'white',
    padding: 'clamp(24px, 5vw, 48px) clamp(20px, 5vw, 40px)',
    borderRadius: '8px',
    boxShadow: '0 4px 6px -1px rgba(15,23,42,0.07), 0 2px 4px -2px rgba(15,23,42,0.05)',
    width: '100%',
    maxWidth: '420px',
    border: '1px solid #e2e8f0'
  },
  title: {
    fontSize: 'clamp(24px, 6vw, 32px)',
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: '8px',
    textAlign: 'center',
    fontFamily: 'Inter, sans-serif',
    letterSpacing: '-0.5px'
  },
  subtitle: {
    fontSize: '18px',
    color: '#64748b',
    marginBottom: '36px',
    textAlign: 'center',
    fontFamily: 'Inter, sans-serif',
    fontWeight: '400'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '22px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#0f172a',
    fontFamily: 'Inter, sans-serif'
  },
  input: {
    padding: '12px 14px',
    fontSize: '15px',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    outline: 'none',
    transition: 'all 0.15s ease',
    fontFamily: 'Inter, sans-serif'
  },
  button: {
    padding: '14px',
    fontSize: '16px',
    fontWeight: '600',
    color: 'white',
    backgroundColor: '#10b981',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    marginTop: '8px',
    transition: 'all 0.15s ease',
    fontFamily: 'Inter, sans-serif',
    boxShadow: '0 1px 2px rgba(16, 185, 129, 0.2)'
  },
  error: {
    padding: '12px',
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    borderRadius: '6px',
    marginBottom: '16px',
    fontSize: '14px',
    border: '1px solid #fecaca'
  },
  helpText: {
    marginTop: '24px',
    padding: '14px',
    backgroundColor: '#f0fdf4',
    borderLeft: '3px solid #10b981',
    fontSize: '13px',
    color: '#475569',
    lineHeight: '1.6',
    borderRadius: '4px'
  }
};

export default Login;
