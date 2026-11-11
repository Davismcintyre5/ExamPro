import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as classApi from '../api/classApi';
import * as studentApi from '../api/studentApi';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Spinner from '../components/ui/Spinner';
import ExportMenu from '../components/ui/ExportMenu';
import BulkAddModal from '../components/common/BulkAddModal';
import ImportModal from '../components/common/ImportModal';
import { FORMATIVE_COUNTS } from '../utils/constants';
import toast from 'react-hot-toast';

const ClassDetailPage = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [cls, setCls] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [showBulkUnits, setShowBulkUnits] = useState(false);
  const [showImportUnits, setShowImportUnits] = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);
  const [deleteUnitTarget, setDeleteUnitTarget] = useState(null);
  const [deleteStudentTarget, setDeleteStudentTarget] = useState(null);
  const [unitForm, setUnitForm] = useState({ name: '', code: '', formativeCount: 3 });
  const [studentForm, setStudentForm] = useState({
    admissionNumber: '',
    fullName: '',
    phone: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load();
  }, [classId]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await classApi.getClassById(classId);
      setCls(data);
    } catch (error) {
      toast.error('Failed to load');
      navigate('/classes');
    } finally {
      setLoading(false);
    }
  };

  const openCreateUnit = () => {
    setEditingUnit(null);
    setUnitForm({ name: '', code: '', formativeCount: 3 });
    setShowUnitModal(true);
  };

  const openEditUnit = (unit) => {
    setEditingUnit(unit);
    setUnitForm({
      name: unit.name,
      code: unit.code,
      formativeCount: unit.formativeCount || 3
    });
    setShowUnitModal(true);
  };

  const handleUnitSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: unitForm.name,
        code: unitForm.code,
        formativeCount: Number(unitForm.formativeCount)
      };
      if (editingUnit) {
        await classApi.updateUnit(classId, editingUnit._id, payload);
        toast.success('Unit updated');
      } else {
        await classApi.addUnit(classId, payload);
        toast.success('Unit added');
      }
      setShowUnitModal(false);
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const handleBulkUnits = async (lines) => {
    const units = lines.map((line) => {
      const parts = line.split(',').map((p) => p.trim());
      return {
        name: parts[0] || '',
        code: parts[1] || '',
        formativeCount: Number(parts[2]) || 3
      };
    });
    const result = await classApi.addBulkUnits(classId, units);
    toast.success(`${result.created} created, ${result.skipped} skipped`);
    setShowBulkUnits(false);
    load();
  };

  const handleImportUnits = async (file) => {
    return await classApi.importUnits(classId, file);
  };

  const handleExportUnits = async (format) => {
    try {
      await classApi.exportUnits(classId, format);
      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error('Export failed');
    }
  };

  const handleDeleteUnit = async () => {
    if (!deleteUnitTarget) return;
    try {
      await classApi.deleteUnit(classId, deleteUnitTarget._id);
      toast.success('Unit deleted');
      setDeleteUnitTarget(null);
      load();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const openCreateStudent = () => {
    setEditingStudent(null);
    setStudentForm({ admissionNumber: '', fullName: '', phone: '' });
    setShowStudentModal(true);
  };

  const openEditStudent = (student) => {
    setEditingStudent(student);
    setStudentForm({
      admissionNumber: student.admissionNumber || '',
      fullName: student.fullName,
      phone: student.phone || ''
    });
    setShowStudentModal(true);
  };

  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...studentForm, classId };
      if (editingStudent) {
        await studentApi.updateStudent(editingStudent._id, payload);
        toast.success('Student updated');
      } else {
        await studentApi.createStudent(payload);
        toast.success('Student added');
      }
      setShowStudentModal(false);
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteStudent = async () => {
    if (!deleteStudentTarget) return;
    try {
      await studentApi.deleteStudent(deleteStudentTarget._id);
      toast.success('Student removed');
      setDeleteStudentTarget(null);
      load();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  if (loading) return <Spinner size="lg" className="py-20" />;
  if (!cls) return null;

  const units = cls.units || [];
  const students = cls.students || [];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <button
            onClick={() => navigate('/classes')}
            className="text-blue-600 hover:text-blue-800 text-sm mb-2 flex items-center"
          >
            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Classes
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{cls.className}</h1>
          <div className="flex items-center space-x-2 mt-2">
            <Badge variant="primary">{cls.departmentId?.name}</Badge>
            {cls.courseId?.name && <Badge variant="info">{cls.courseId.name}</Badge>}
            {cls.level && <Badge variant="info">Level {cls.level}</Badge>}
            <Badge variant="success">{units.length} Units</Badge>
            <Badge variant="warning">{students.length} Students</Badge>
          </div>
        </div>
        <Button variant="secondary" onClick={() => navigate('/marks')}>Marks Entry</Button>
      </div>

      <Card className="mb-6">
        <div className="flex justify-between items-center mb-4 pb-4 border-b">
          <h3 className="text-lg font-bold text-gray-900">Units</h3>
          <div className="flex items-center space-x-2">
            <ExportMenu onExport={handleExportUnits} disabled={units.length === 0} />
            <Button variant="secondary" size="sm" onClick={() => setShowImportUnits(true)}>
              Import
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setShowBulkUnits(true)}>
              Bulk Add
            </Button>
            <Button size="sm" onClick={openCreateUnit}>+ Add Unit</Button>
          </div>
        </div>

        {units.length === 0 ? (
          <p className="text-gray-400 text-center py-4">No units yet</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {units.map((unit) => (
              <div key={unit._id} className="border border-gray-200 rounded-lg p-3">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium text-gray-900">{unit.name}</p>
                    <code className="text-xs text-gray-500">{unit.code}</code>
                  </div>
                  <Badge variant="info">{unit.formativeCount} F</Badge>
                </div>
                <div className="flex space-x-2 text-sm">
                  <button onClick={() => openEditUnit(unit)} className="text-blue-600 hover:underline">Edit</button>
                  <button onClick={() => setDeleteUnitTarget(unit)} className="text-red-600 hover:underline">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <div className="flex justify-between items-center mb-4 pb-4 border-b">
          <h3 className="text-lg font-bold text-gray-900">Students</h3>
          <Button size="sm" onClick={openCreateStudent}>+ Add Student</Button>
        </div>

        {students.length === 0 ? (
          <p className="text-gray-400 text-center py-4">No students yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">No.</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Admission</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.map((student, idx) => (
                  <tr key={student._id}>
                    <td className="px-4 py-3 text-sm text-gray-500">{idx + 1}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{student.admissionNumber}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{student.fullName}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{student.phone || '-'}</td>
                    <td className="px-4 py-3 text-sm space-x-2">
                      <button onClick={() => openEditStudent(student)} className="text-blue-600 hover:underline">Edit</button>
                      <button onClick={() => setDeleteStudentTarget(student)} className="text-red-600 hover:underline">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal isOpen={showUnitModal} onClose={() => setShowUnitModal(false)} title={editingUnit ? 'Edit Unit' : 'Add Unit'}>
        <form onSubmit={handleUnitSubmit} className="space-y-4">
          <Input label="Unit Name" value={unitForm.name} onChange={(e) => setUnitForm({ ...unitForm, name: e.target.value })} required />
          <Input label="Unit Code" value={unitForm.code} onChange={(e) => setUnitForm({ ...unitForm, code: e.target.value })} required />
          <Select
            label="Formatives"
            options={FORMATIVE_COUNTS}
            value={unitForm.formativeCount}
            onChange={(e) => setUnitForm({ ...unitForm, formativeCount: Number(e.target.value) })}
            required
          />
          <div className="flex justify-end space-x-3">
            <Button variant="secondary" onClick={() => setShowUnitModal(false)}>Cancel</Button>
            <Button type="submit" isLoading={saving}>{editingUnit ? 'Update' : 'Add'}</Button>
          </div>
        </form>
      </Modal>

      <BulkAddModal
        isOpen={showBulkUnits}
        onClose={() => setShowBulkUnits(false)}
        onSubmit={handleBulkUnits}
        title="Bulk Add Units"
        formatHint="Format: name, code, formativeCount (3 or 4, optional default 3)"
        placeholder={`PPM, 2920/201, 3\nMIS, 2920/202, 4\nIBP, 2920/203`}
        submitLabel="Add Units"
      />

      <ImportModal
        isOpen={showImportUnits}
        onClose={() => setShowImportUnits(false)}
        onSubmit={handleImportUnits}
        title="Import Units"
        formatHint="Columns: name, code, formative_count"
        submitLabel="Import"
      />

      <Modal isOpen={showStudentModal} onClose={() => setShowStudentModal(false)} title={editingStudent ? 'Edit Student' : 'Add Student'}>
        <form onSubmit={handleStudentSubmit} className="space-y-4">
          <Input
            label="Admission Number"
            value={studentForm.admissionNumber}
            onChange={(e) => setStudentForm({ ...studentForm, admissionNumber: e.target.value })}
            required
          />
          <Input
            label="Full Name"
            value={studentForm.fullName}
            onChange={(e) => setStudentForm({ ...studentForm, fullName: e.target.value })}
            required
          />
          <Input
            label="Phone (optional)"
            value={studentForm.phone}
            onChange={(e) => setStudentForm({ ...studentForm, phone: e.target.value })}
          />
          <div className="flex justify-end space-x-3">
            <Button variant="secondary" onClick={() => setShowStudentModal(false)}>Cancel</Button>
            <Button type="submit" isLoading={saving}>{editingStudent ? 'Update' : 'Add'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteUnitTarget}
        onClose={() => setDeleteUnitTarget(null)}
        onConfirm={handleDeleteUnit}
        title="Delete Unit"
        message={`Delete "${deleteUnitTarget?.name}"?`}
        confirmText="Delete"
        variant="danger"
      />

      <ConfirmDialog
        isOpen={!!deleteStudentTarget}
        onClose={() => setDeleteStudentTarget(null)}
        onConfirm={handleDeleteStudent}
        title="Delete Student"
        message={`Delete "${deleteStudentTarget?.fullName}"?`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};

export default ClassDetailPage;