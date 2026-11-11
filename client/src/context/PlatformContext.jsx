import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as platformApi from '../api/platformSettingsApi';

const PlatformContext = createContext();

export const usePlatform = () => {
  const context = useContext(PlatformContext);
  if (!context) {
    throw new Error('usePlatform must be used within PlatformProvider');
  }
  return context;
};

const DEFAULT_SETTINGS = {
  appName: 'ExamPro',
  appTagline: 'Exam Entry System',
  logo: '',
  favicon: '',
  supportEmail: 'support@exampro.com',
  supportPhone: '',
  supportWhatsapp: '',
  supportUrl: '',
  allowSelfRegistration: false,
  maintenanceMode: false,
  maintenanceMessage: '',
  footerText: '',
  termsUrl: '',
  privacyUrl: '',
};

export const PlatformProvider = ({ children }) => {
  const [platform, setPlatform] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  const fetchPublic = useCallback(async () => {
    try {
      const data = await platformApi.getPublicPlatformSettings();
      setPlatform({ ...DEFAULT_SETTINGS, ...data });
    } catch (error) {
      console.error('Failed to load platform settings');
      setPlatform(DEFAULT_SETTINGS);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await fetchPublic();
  }, [fetchPublic]);

  const setLocal = useCallback((data) => {
    setPlatform({ ...DEFAULT_SETTINGS, ...data });
  }, []);

  useEffect(() => {
    fetchPublic();
  }, [fetchPublic]);

  useEffect(() => {
    if (platform.appName) {
      document.title = platform.appName;
    }
    if (platform.favicon) {
      const link = document.querySelector("link[rel~='icon']");
      if (link) link.href = platform.favicon;
    }
  }, [platform.appName, platform.favicon]);

  return (
    <PlatformContext.Provider
      value={{
        platform,
        loading,
        refresh,
        setLocal,
      }}
    >
      {children}
    </PlatformContext.Provider>
  );
};
