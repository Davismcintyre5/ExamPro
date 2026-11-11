import { createContext, useContext, useState, useCallback } from 'react';
import * as classApi from '../api/classApi';
import * as studentApi from '../api/studentApi';
import * as departmentApi from '../api/departmentApi';
import * as scoreApi from '../api/scoreApi';
import * as reportApi from '../api/reportApi';
import toast from 'react-hot-toast';

const DataContext = createContext();

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within DataProvider');
  }
  return context;
};

export const DataProvider = ({ children }) => {
  const [departments, setDepartments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [currentClass, setCurrentClass] = useState(null);
  const [currentStudent, setCurrentStudent] = useState(null);
  const [scores, setScores] = useState([]);
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await departmentApi.getDepartments();
      setDepartments(data);
      return data;
    } catch (error) {
      toast.error('Failed to load departments');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchClasses = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const data = await classApi.getClasses(params);
      setClasses(data);
      return data;
    } catch (error) {
      toast.error('Failed to load classes');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchClassById = useCallback(async (classId) => {
    setLoading(true);
    try {
      const data = await classApi.getClassById(classId);
      setCurrentClass(data);
      return data;
    } catch (error) {
      toast.error('Failed to load class');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStudents = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const data = await studentApi.getStudents(params);
      setStudents(data);
      return data;
    } catch (error) {
      toast.error('Failed to load students');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStudentsByClass = useCallback(async (classId) => {
    setLoading(true);
    try {
      const data = await studentApi.getStudentsByClass(classId);
      setStudents(data);
      return data;
    } catch (error) {
      toast.error('Failed to load students');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchScoresByClass = useCallback(async (classId) => {
    setLoading(true);
    try {
      const data = await scoreApi.getScoresByClass(classId);
      setScores(data);
      return data;
    } catch (error) {
      toast.error('Failed to load scores');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchScoresByStudent = useCallback(async (studentId) => {
    setLoading(true);
    try {
      const data = await scoreApi.getScoresByStudent(studentId);
      setScores(data);
      return data;
    } catch (error) {
      toast.error('Failed to load scores');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchClassReport = useCallback(async (classId) => {
    setLoading(true);
    try {
      const data = await reportApi.getClassReport(classId);
      setReports(data);
      return data;
    } catch (error) {
      toast.error('Failed to load class report');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStudentReport = useCallback(async (studentId) => {
    setLoading(true);
    try {
      const data = await reportApi.getStudentReport(studentId);
      setReports(data);
      return data;
    } catch (error) {
      toast.error('Failed to load student report');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMissingMarks = useCallback(async (classId) => {
    setLoading(true);
    try {
      const data = await reportApi.getMissingMarks(classId);
      setReports(data);
      return data;
    } catch (error) {
      toast.error('Failed to load missing marks');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearCurrentClass = useCallback(() => {
    setCurrentClass(null);
  }, []);

  const clearReports = useCallback(() => {
    setReports(null);
  }, []);

  return (
    <DataContext.Provider
      value={{
        departments,
        classes,
        students,
        currentClass,
        currentStudent,
        scores,
        reports,
        loading,
        setCurrentStudent,
        fetchDepartments,
        fetchClasses,
        fetchClassById,
        fetchStudents,
        fetchStudentsByClass,
        fetchScoresByClass,
        fetchScoresByStudent,
        fetchClassReport,
        fetchStudentReport,
        fetchMissingMarks,
        clearCurrentClass,
        clearReports,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};
