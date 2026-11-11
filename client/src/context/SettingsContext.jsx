import { createContext, useContext, useState, useCallback } from 'react';
import * as settingsApi from '../api/settingsApi';
import toast from 'react-hot-toast';

const SettingsContext = createContext();

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await settingsApi.getSettings();
      setSettings(data);
      return data;
    } catch (error) {
      toast.error('Failed to load settings');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const saveSettings = useCallback(async (settingsData) => {
    setLoading(true);
    try {
      const data = await settingsApi.updateSettings(settingsData);
      setSettings(data);
      toast.success('Settings saved successfully');
      return data;
    } catch (error) {
      toast.error('Failed to save settings');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const saveGradingSystem = useCallback(async (gradingData) => {
    setLoading(true);
    try {
      const data = await settingsApi.updateGradingSystem(gradingData);
      setSettings(data);
      toast.success('Grading system updated');
      return data;
    } catch (error) {
      toast.error('Failed to update grading system');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const saveGrades = useCallback(async (grades) => {
    setLoading(true);
    try {
      const data = await settingsApi.updateGrades(grades);
      setSettings(data);
      toast.success('Grades updated');
      return data;
    } catch (error) {
      toast.error('Failed to update grades');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const addNewGrade = useCallback(async (gradeData) => {
    setLoading(true);
    try {
      const data = await settingsApi.addGrade(gradeData);
      setSettings(data);
      toast.success('Grade added');
      return data;
    } catch (error) {
      toast.error('Failed to add grade');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const removeGrade = useCallback(async (gradeId) => {
    setLoading(true);
    try {
      const data = await settingsApi.deleteGrade(gradeId);
      setSettings(data);
      toast.success('Grade deleted');
      return data;
    } catch (error) {
      toast.error('Failed to delete grade');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const saveLogo = useCallback(async (logoData) => {
    setLoading(true);
    try {
      const data = await settingsApi.uploadLogo(logoData);
      setSettings(data);
      toast.success('Logo updated');
      return data;
    } catch (error) {
      toast.error('Failed to upload logo');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        loading,
        fetchSettings,
        saveSettings,
        saveGradingSystem,
        saveGrades,
        addNewGrade,
        removeGrade,
        saveLogo,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};
