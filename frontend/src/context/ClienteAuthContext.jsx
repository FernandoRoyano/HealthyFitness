import { createContext, useState, useContext, useEffect } from 'react';
import { clienteAuthAPI } from '../services/api';

const ClienteAuthContext = createContext();

export const ClienteAuthProvider = ({ children }) => {
  const [cliente, setCliente] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarCliente = async () => {
      const token = localStorage.getItem('clienteToken');
      if (token) {
        try {
          const { data } = await clienteAuthAPI.obtenerPerfil();
          setCliente(data);
        } catch {
          localStorage.removeItem('clienteToken');
        }
      }
      setCargando(false);
    };
    cargarCliente();
  }, []);

  const login = async (credenciales) => {
    const { data } = await clienteAuthAPI.login(credenciales);
    localStorage.setItem('clienteToken', data.token);
    setCliente(data);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('clienteToken');
    setCliente(null);
  };

  const cambiarPassword = async (passwordActual, passwordNuevo) => {
    await clienteAuthAPI.cambiarPassword({ passwordActual, passwordNuevo });
  };

  const value = {
    cliente,
    login,
    logout,
    cambiarPassword,
    estaAutenticado: !!cliente,
    cargando
  };

  return <ClienteAuthContext.Provider value={value}>{children}</ClienteAuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useClienteAuth = () => {
  const context = useContext(ClienteAuthContext);
  if (!context) {
    throw new Error('useClienteAuth debe ser usado dentro de un ClienteAuthProvider');
  }
  return context;
};
