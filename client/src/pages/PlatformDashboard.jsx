import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPlatformDashboard } from '../api/platformSettingsApi';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import toast from 'react-hot-toast';

const PlatformDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await getPlatformDashboard();
      setStats(data);
    } catch (error) {
      toast.error('Failed to load platform stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return <Spinner size="lg" className="py-20" />;
  }

  const statCards = [
    {
      title: 'Total Admins',
      value: stats.totalAdmins,
      icon: (
        <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      color: 'bg-blue-50',
      path: '/super-admin',
    },
    {
      title: 'Pending Users',
      value: stats.pendingUsers,
      icon: (
        <svg className="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'bg-yellow-50',
      path: '/pending-users',
    },
 {
  title: 'Super Admins',
  value: stats.hiddenAdmins,
  icon: (
    <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  ),
  color: 'bg-red-50',
  path: '/super-admin',
},
    {
      title: 'Suspended Users',
      value: stats.suspendedUsers,
      icon: (
        <svg className="h-8 w-8 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
      ),
      color: 'bg-orange-50',
      path: '/super-admin',
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Platform Dashboard</h1>
        <p className="text-gray-600 mt-1">Overview of the entire platform</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => (
          <button
            key={stat.title}
            onClick={() => navigate(stat.path)}
            className="text-left"
          >
            <Card className="hover:shadow-lg transition-shadow duration-200">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${stat.color}`}>{stat.icon}</div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </Card>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card
          title="Recent Pending Users"
          subtitle="Latest registrations awaiting approval"
          footer={
            stats.pendingUsers > 0 && (
              <Button variant="secondary" size="sm" onClick={() => navigate('/pending-users')}>
                View All
              </Button>
            )
          }
        >
          {stats.recentPending.length === 0 ? (
            <p className="text-gray-400 text-center py-4 text-sm">No pending users</p>
          ) : (
            stats.recentPending.map((user) => (
              <div
                key={user._id}
                className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
              >
                <div>
                  <p className="font-medium text-gray-900 text-sm">{user.fullName}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                  {user.schoolName && (
                    <p className="text-xs text-gray-400">{user.schoolName}</p>
                  )}
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))
          )}
        </Card>

        <Card
          title="Recent Admins"
          subtitle="Latest admin accounts created"
          footer={
            <Button variant="secondary" size="sm" onClick={() => navigate('/super-admin')}>
              View All
            </Button>
          }
        >
          {stats.recentAdmins.length === 0 ? (
            <p className="text-gray-400 text-center py-4 text-sm">No admins yet</p>
          ) : (
            stats.recentAdmins.map((admin) => (
              <div
                key={admin._id}
                className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
              >
                <div>
                  <p className="font-medium text-gray-900 text-sm">{admin.fullName}</p>
                  <p className="text-xs text-gray-500">{admin.email}</p>
                </div>
                <span className="text-xs text-gray-400">
                  {admin.lastLogin
                    ? `Last: ${new Date(admin.lastLogin).toLocaleDateString()}`
                    : 'Never logged in'}
                </span>
              </div>
            ))
          )}
        </Card>
      </div>

      <Card title="Platform Status" subtitle="Current platform configuration">
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-sm text-gray-700">Self Registration</span>
            <Badge variant={stats.platformStatus.allowSelfRegistration ? 'success' : 'default'}>
              {stats.platformStatus.allowSelfRegistration ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-sm text-gray-700">Maintenance Mode</span>
            <Badge variant={stats.platformStatus.maintenanceMode ? 'danger' : 'success'}>
              {stats.platformStatus.maintenanceMode ? 'On' : 'Off'}
            </Badge>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-sm text-gray-700">Allow New Admins</span>
            <Badge variant={stats.platformStatus.allowNewAdmins ? 'success' : 'warning'}>
              {stats.platformStatus.allowNewAdmins ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-700">Support Email</span>
            <span className="text-sm text-gray-500">
              {stats.platformStatus.supportEmail || 'Not set'}
            </span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t">
          <Button variant="secondary" size="sm" onClick={() => navigate('/platform-settings')}>
            Manage Platform Settings
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default PlatformDashboard;
