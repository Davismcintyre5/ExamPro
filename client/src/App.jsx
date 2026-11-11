import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import DashboardLayout from './components/layout/DashboardLayout';
import Login from './pages/Login';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import PendingApprovalPage from './pages/PendingApprovalPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import Dashboard from './pages/Dashboard';
import DepartmentsPage from './pages/DepartmentsPage';
import DepartmentDetailPage from './pages/DepartmentDetailPage';
import ClassesPage from './pages/ClassesPage';
import ClassDetailPage from './pages/ClassDetailPage';
import MarksPage from './pages/MarksPage';
import MarksUnitPage from './pages/MarksUnitPage';
import StudentsPage from './pages/StudentsPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import StaffPage from './pages/StaffPage';
import SuperAdminPage from './pages/SuperAdminPage';
import PlatformSettingsPage from './pages/PlatformSettingsPage';
import PendingUsersPage from './pages/PendingUsersPage';
import Spinner from './components/ui/Spinner';

const App = () => {
  const { isAuthenticated, isHiddenAdmin, isOwner, mustChangePassword, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/pending-approval" element={<PendingApprovalPage />} />

      <Route
        path="/change-password"
        element={isAuthenticated ? <ChangePasswordPage /> : <Navigate to="/login" />}
      />

      <Route
        path="/"
        element={
          isAuthenticated
            ? mustChangePassword
              ? <Navigate to="/change-password" />
              : <DashboardLayout />
            : <Navigate to="/login" />
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="departments" element={<DepartmentsPage />} />
        <Route path="departments/:id" element={<DepartmentDetailPage />} />
        <Route path="classes" element={<ClassesPage />} />
        <Route path="classes/:classId" element={<ClassDetailPage />} />
        <Route path="marks" element={<MarksPage />} />
        <Route path="marks/:classId/:unitId" element={<MarksUnitPage />} />
        <Route path="students" element={<StudentsPage />} />
        <Route path="reports" element={<ReportsPage />} />

        {isOwner && (
          <>
            <Route path="staff" element={<StaffPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </>
        )}

        {isHiddenAdmin && (
          <>
            <Route path="super-admin" element={<SuperAdminPage />} />
            <Route path="platform-settings" element={<PlatformSettingsPage />} />
            <Route path="pending-users" element={<PendingUsersPage />} />
          </>
        )}
      </Route>

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default App;