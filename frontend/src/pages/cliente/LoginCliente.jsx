import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useClienteAuth } from '../../context/ClienteAuthContext';

function LoginCliente() {
  const [credenciales, setCredenciales] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const { login } = useClienteAuth();
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
      navigate('/cliente/dashboard');
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al iniciar sesión');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logoSection}>
          <img src="/logo.png" alt="HealthyFitness" style={styles.logo} />
          <h1 style={styles.title}>HealthyFitness</h1>
          <span style={styles.portalTag}>Portal del Cliente</span>
        </div>
        <h2 style={styles.subtitle}>Accede a tu cuenta</h2>

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
            {cargando ? 'Accediendo...' : 'Entrar'}
          </button>
        </form>

        <div style={styles.helpText}>
          <strong>¿No tienes acceso?</strong> Contacta con tu entrenador o el centro para solicitar credenciales de acceso al portal.
        </div>

        <div style={styles.staffLink}>
          <Link to="/login" style={styles.link}>
            ¿Eres entrenador? Accede aquí
          </Link>
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
    backgroundColor: '#f0f7ed',
    padding: '16px'
  },
  card: {
    backgroundColor: 'white',
    padding: 'clamp(24px, 5vw, 50px) clamp(20px, 5vw, 40px)',
    borderRadius: '16px',
    boxShadow: '0px 10px 60px -10px rgba(117, 183, 96, 0.25)',
    width: '100%',
    maxWidth: '420px',
    border: '1px solid #e4e4e9'
  },
  logoSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '8px'
  },
  logo: {
    width: '60px',
    height: '60px',
    objectFit: 'contain',
    marginBottom: '12px'
  },
  title: {
    fontSize: 'clamp(26px, 6vw, 36px)',
    fontWeight: '700',
    color: '#10b981',
    marginBottom: '8px',
    textAlign: 'center',
    fontFamily: 'Inter, sans-serif',
    letterSpacing: '-0.5px'
  },
  portalTag: {
    fontSize: '14px',
    color: 'white',
    backgroundColor: '#1a1a2e',
    padding: '4px 16px',
    borderRadius: '20px',
    fontFamily: 'Inter, sans-serif',
    fontWeight: '500'
  },
  subtitle: {
    fontSize: '18px',
    color: '#666666',
    marginBottom: '32px',
    textAlign: 'center',
    fontFamily: 'Inter, sans-serif',
    fontWeight: '400',
    marginTop: '24px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#333',
    fontFamily: 'Inter, sans-serif'
  },
  input: {
    padding: '14px 16px',
    fontSize: '16px',
    border: '2px solid #e4e4e9',
    borderRadius: '10px',
    outline: 'none',
    transition: 'all 0.2s ease',
    fontFamily: 'Lora, serif'
  },
  button: {
    padding: '16px',
    fontSize: '18px',
    fontWeight: '700',
    color: 'white',
    backgroundColor: '#10b981',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    marginTop: '8px',
    transition: 'all 0.3s ease',
    fontFamily: 'Inter, sans-serif',
    boxShadow: '0 4px 12px rgba(117, 183, 96, 0.3)'
  },
  error: {
    padding: '14px',
    backgroundColor: '#fee',
    color: '#c00',
    borderRadius: '10px',
    marginBottom: '16px',
    fontSize: '14px',
    border: '1px solid #fcc'
  },
  helpText: {
    marginTop: '24px',
    padding: '16px',
    backgroundColor: '#f8fdf6',
    borderLeft: '4px solid #10b981',
    fontSize: '14px',
    color: '#555',
    lineHeight: '1.6',
    borderRadius: '6px'
  },
  staffLink: {
    marginTop: '20px',
    textAlign: 'center'
  },
  link: {
    color: '#1a1a2e',
    fontSize: '14px',
    fontFamily: 'Inter, sans-serif',
    textDecoration: 'none'
  }
};

export default LoginCliente;
