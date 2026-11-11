import { useAuth } from '../context/AuthContext';
import PlatformDashboard from './PlatformDashboard';
import SchoolDashboard from './SchoolDashboard';

const Dashboard = () => {
  const { isHiddenAdmin } = useAuth();

  if (isHiddenAdmin) {
    return <PlatformDashboard />;
  }

  return <SchoolDashboard />;
};

export default Dashboard;
