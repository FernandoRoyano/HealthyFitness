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
    backgroundColor: '#fafafa',
    padding: '20px'
  },
  card: {
    backgroundColor: 'white',
    padding: '50px 40px',
    borderRadius: '12px',
    boxShadow: '0px 0px 50px -10px rgba(0,0,0,0.15)',
    width: '100%',
    maxWidth: '420px',
    border: '1px solid #e4e4e9'
  },
  title: {
    fontSize: '42px',
    fontWeight: '700',
    color: '#75b760',
    marginBottom: '8px',
    textAlign: 'center',
    fontFamily: 'Niramit, sans-serif',
    letterSpacing: '-0.5px'
  },
  subtitle: {
    fontSize: '20px',
    color: '#666666',
    marginBottom: '40px',
    textAlign: 'center',
    fontFamily: 'Niramit, sans-serif',
    fontWeight: '400'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  label: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#000000',
    fontFamily: 'Niramit, sans-serif'
  },
  input: {
    padding: '14px 16px',
    fontSize: '16px',
    border: '1px solid #e4e4e9',
    borderRadius: '8px',
    outline: 'none',
    transition: 'all 0.2s ease',
    fontFamily: 'Lora, serif'
  },
  button: {
    padding: '16px',
    fontSize: '18px',
    fontWeight: '700',
    color: 'white',
    backgroundColor: '#75b760',
    border: 'none',
    borderRadius: '9999px',
    cursor: 'pointer',
    marginTop: '12px',
    transition: 'all 0.3s ease',
    fontFamily: 'Niramit, sans-serif',
    boxShadow: '0 4px 12px rgba(117, 183, 96, 0.3)'
  },
  error: {
    padding: '14px',
    backgroundColor: '#fee',
    color: '#c00',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '14px',
    border: '1px solid #fcc'
  },
  helpText: {
    marginTop: '24px',
    padding: '16px',
    backgroundColor: '#f8fdf6',
    borderLeft: '4px solid #75b760',
    fontSize: '14px',
    color: '#555',
    lineHeight: '1.6',
    borderRadius: '6px'
  }
};

export default Login;
