import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import Card from '../components/ui/Card';
import Spinner from '../components/ui/Spinner';

const SchoolDashboard = () => {
  const { departments, classes, students, fetchDepartments, fetchClasses, fetchStudents, loading } = useData();
  const { settings } = useSettings();
  const { isOwner } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [departmentsData, classesData, studentsData] = await Promise.all([
        fetchDepartments(),
        fetchClasses(),
        fetchStudents(),
      ]);
      setStats({
        totalDepartments: departmentsData.length,
        totalClasses: classesData.length,
        totalStudents: studentsData.length,
      });
    } catch (error) {
      console.error('Failed to load dashboard data');
    }
  };

  if (loading && !stats) {
    return <Spinner size="lg" className="py-20" />;
  }

  const statCards = [
    {
      title: 'Departments',
      value: stats?.totalDepartments || 0,
      icon: (
        <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      path: '/departments',
      color: 'bg-blue-50',
    },
    {
      title: 'Classes',
      value: stats?.totalClasses || 0,
      icon: (
        <svg className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
      path: '/classes',
      color: 'bg-purple-50',
    },
    {
      title: 'Students',
      value: stats?.totalStudents || 0,
      icon: (
        <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      path: '/students',
      color: 'bg-green-50',
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {settings?.schoolName || 'Dashboard'}
        </h1>
        <p className="text-gray-600 mt-1">
          {settings?.academicYear || ''} {settings?.term || ''} - Overview
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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

      {settings?.motto && (
        <div className="mb-8 text-center">
          <p className="text-lg italic text-gray-500">"{settings.motto}"</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Recent Classes" subtitle="Latest classes added">
          {classes.length === 0 ? (
            <p className="text-gray-400 text-center py-4 text-sm">No classes yet</p>
          ) : (
            classes.slice(0, 5).map((cls) => (
              <div
                key={cls._id}
                className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
              >
                <div>
                  <p className="font-medium text-gray-900 text-sm">{cls.className}</p>
                  <p className="text-xs text-gray-500">{cls.departmentId?.name || ''}</p>
                </div>
                <span className="text-xs text-gray-400">
                  {cls.studentCount || 0} students
                </span>
              </div>
            ))
          )}
        </Card>

        <Card title="Departments" subtitle="All departments">
          {departments.length === 0 ? (
            <p className="text-gray-400 text-center py-4 text-sm">No departments yet</p>
          ) : (
            departments.slice(0, 5).map((dept) => (
              <div
                key={dept._id}
                className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
              >
                <div>
                  <p className="font-medium text-gray-900 text-sm">{dept.name}</p>
                  <p className="text-xs text-gray-500">Code: {dept.code}</p>
                </div>
              </div>
            ))
          )}
        </Card>
      </div>
    </div>
  );
};

export default SchoolDashboard;
