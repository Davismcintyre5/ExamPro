import { createContext, useContext, useState, useEffect } from 'react';
import { hiddenAdminLogin, verifyAdminHash, loginTeacher } from '../api/authApi';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isHiddenAdmin, setIsHiddenAdmin] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [mustChangePassword, setMustChangePassword] = useState(false);

  useEffect(() => {
    const init = async () => {
      await checkAuth();
      await checkHashAccess();
      setLoading(false);
    };
    init();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('adminToken');
    const adminData = localStorage.getItem('adminData');

    if (!token || !adminData) return;

    try {
      const parsedData = JSON.parse(adminData);
      setAdmin(parsedData);
      setIsAuthenticated(true);
      setIsHiddenAdmin(parsedData.isHiddenAdmin || false);
      setIsOwner(
        parsedData.role === 'admin' && !parsedData.parentAdminId
      );
      setMustChangePassword(parsedData.mustChangePassword || false);
    } catch (error) {
      console.error('Invalid stored admin data');
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminData');
    }
  };

  const checkHashAccess = async () => {
    const params = new URLSearchParams(window.location.search);
    const accessHash = params.get('access');

    if (!accessHash) return;

    try {
      const response = await verifyAdminHash(accessHash);
      if (response.valid) {
        setIsAdminMode(true);
        localStorage.setItem('tempAdminToken', response.tempToken);
        toast.success('Hidden admin access verified');
        window.history.replaceState({}, document.title, '/login');
      } else {
        toast.error('Invalid access hash');
      }
    } catch (error) {
      toast.error('Hash verification failed');
    }
  };

  const finalizeLogin = (data, token) => {
    localStorage.setItem('adminToken', token);
    localStorage.setItem('adminData', JSON.stringify(data));
    setAdmin(data);
    setIsAuthenticated(true);
    setIsHiddenAdmin(data.isHiddenAdmin || false);
    setIsOwner(data.role === 'admin' && !data.parentAdminId);
    setMustChangePassword(data.mustChangePassword || false);
  };

  const login = async (credentials) => {
    try {
      const response = await loginTeacher(credentials);
      finalizeLogin(response.teacher, response.token);
      toast.success('Welcome back, ' + response.teacher.fullName);
      return { success: true };
    } catch (error) {
      const msg = error.response?.data?.message || 'Login failed';
      const code = error.response?.data?.code;
      const reason = error.response?.data?.reason || '';

      if (
        code !== 'PENDING_APPROVAL' &&
        code !== 'REJECTED' &&
        code !== 'SUSPENDED'
      ) {
        if (code === 'INACTIVE') {
          toast.error('Your account is inactive');
        } else {
          toast.error(msg);
        }
      }

      return { success: false, error: msg, code, reason };
    }
  };

  const hiddenLogin = async (credentials) => {
    try {
      const response = await hiddenAdminLogin(credentials);
      finalizeLogin(response.admin, response.token);
      toast.success('Hidden admin logged in');
      return { success: true };
    } catch (error) {
      const msg = error.response?.data?.message || 'Hidden admin login failed';
      toast.error(msg);
      return { success: false, error: msg };
    }
  };

  const completePasswordChange = () => {
    const updated = { ...admin, mustChangePassword: false };
    localStorage.setItem('adminData', JSON.stringify(updated));
    setAdmin(updated);
    setMustChangePassword(false);
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    localStorage.removeItem('tempAdminToken');
    setAdmin(null);
    setIsAuthenticated(false);
    setIsAdminMode(false);
    setIsHiddenAdmin(false);
    setIsOwner(false);
    setMustChangePassword(false);
    toast.success('Logged out successfully');
  };

  return (
    <AuthContext.Provider
      value={{
        admin,
        isAuthenticated,
        loading,
        isAdminMode,
        isHiddenAdmin,
        isOwner,
        mustChangePassword,
        login,
        hiddenLogin,
        logout,
        completePasswordChange,
        setIsAdminMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
