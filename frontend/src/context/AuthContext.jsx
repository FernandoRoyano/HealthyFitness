import { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarUsuario = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const { data } = await authAPI.obtenerPerfil();
          setUsuario(data);
        } catch {
          localStorage.removeItem('token');
        }
      }
      setCargando(false);
    };
    cargarUsuario();
  }, []);

  const login = async (credenciales) => {
    const { data } = await authAPI.login(credenciales);
    localStorage.setItem('token', data.token);
    setUsuario(data);
    return data;
  };

  const registro = async (datos) => {
    const { data } = await authAPI.registro(datos);
    localStorage.setItem('token', data.token);
    setUsuario(data);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUsuario(null);
  };

  const value = {
    usuario,
    login,
    registro,
    logout,
    estaAutenticado: !!usuario,
    cargando
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};
