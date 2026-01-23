import { Navigate } from 'react-router-dom';
import { useClienteAuth } from '../context/ClienteAuthContext';

function ProtectedRouteCliente({ children }) {
  const { estaAutenticado, cargando } = useClienteAuth();

  if (cargando) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner}></div>
        <div>Cargando...</div>
      </div>
    );
  }

  if (!estaAutenticado) {
    return <Navigate to="/cliente/login" replace />;
  }

  return children;
}

const styles = {
  loading: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    fontSize: '18px',
    color: '#666',
    gap: '16px',
    backgroundColor: '#f0f7ed'
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid #e4e4e9',
    borderTop: '3px solid #75b760',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  }
};

export default ProtectedRouteCliente;
