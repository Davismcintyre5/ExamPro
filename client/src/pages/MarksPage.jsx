import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as classApi from '../api/classApi';
import * as departmentApi from '../api/departmentApi';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import Alert from '../components/ui/Alert';
import toast from 'react-hot-toast';

const MarksPage = () => {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [currentClass, setCurrentClass] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingClass, setLoadingClass] = useState(false);

  useEffect(() => {
    loadDepartments();
  }, []);

  useEffect(() => {
    loadClasses();
    setCurrentClass(null);
    setSelectedClass('');
  }, [selectedDepartment]);

  useEffect(() => {
    if (selectedClass) {
      loadClassDetail(selectedClass);
    } else {
      setCurrentClass(null);
    }
  }, [selectedClass]);

  const loadDepartments = async () => {
    try {
      const data = await departmentApi.getDepartments();
      setDepartments(data);
    } catch (error) {
      toast.error('Failed to load departments');
    }
  };

  const loadClasses = async () => {
    setLoading(true);
    try {
      const params = selectedDepartment ? { departmentId: selectedDepartment } : {};
      const data = await classApi.getClasses(params);
      setClasses(data);
    } catch (error) {
      toast.error('Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  const loadClassDetail = async (classId) => {
    setLoadingClass(true);
    try {
      const data = await classApi.getClassById(classId);
      setCurrentClass(data);
    } catch (error) {
      toast.error('Failed to load class');
      setCurrentClass(null);
    } finally {
      setLoadingClass(false);
    }
  };

  const departmentOptions = departments.map((d) => ({ value: d._id, label: d.name }));
  const classOptions = classes.map((c) => ({ value: c._id, label: c.className }));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Marks Entry</h1>
        <p className="text-gray-600 mt-1">Select a department and class to enter marks</p>
      </div>

      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Department"
            placeholder="All Departments"
            options={departmentOptions}
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
          />
          <Select
            label="Class"
            placeholder="Select a class"
            options={classOptions}
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            disabled={loading}
          />
        </div>
      </Card>

      {loadingClass && <Spinner size="lg" className="py-12" />}

      {!selectedClass && !loadingClass && (
        <Card>
          <div className="text-center py-12 text-gray-400">
            <svg className="mx-auto h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-lg">Select a class to begin</p>
          </div>
        </Card>
      )}

      {currentClass && !loadingClass && (
        <>
          <Card className="mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{currentClass.className}</h2>
                <div className="flex items-center space-x-2 mt-2">
                  <Badge variant="primary">{currentClass.departmentId?.name}</Badge>
                  {currentClass.courseId?.name && <Badge variant="info">{currentClass.courseId.name}</Badge>}
                  {currentClass.level && <Badge variant="info">Level {currentClass.level}</Badge>}
                  <Badge variant="success">{currentClass.units?.length || 0} Units</Badge>
                  <Badge variant="warning">{currentClass.students?.length || 0} Students</Badge>
                </div>
              </div>
              <Button variant="secondary" onClick={() => navigate(`/classes/${currentClass._id}`)}>Manage Class</Button>
            </div>
          </Card>

          {(!currentClass.units || currentClass.units.length === 0) && (
            <Alert type="warning" title="No units" message="This class has no units yet." />
          )}

          {currentClass.units?.length > 0 && (
            <Card title="Units" subtitle="Select a unit to enter marks">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentClass.units.map((unit) => (
                  <button
                    key={unit._id}
                    type="button"
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-blue-400 transition text-left w-full"
                    onClick={() => navigate(`/marks/${currentClass._id}/${unit._id}`)}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-bold text-gray-900">{unit.name}</p>
                        <code className="text-xs text-gray-500 bg-gray-50 px-1 py-0.5 rounded">{unit.code}</code>
                      </div>
                      <Badge variant="info">{unit.formativeCount} Form</Badge>
                    </div>
                    <div className="flex items-center justify-center text-sm font-medium text-blue-600 mt-2">
                      Enter Marks
                      <svg className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default MarksPage;