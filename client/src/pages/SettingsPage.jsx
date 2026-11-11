import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Spinner from '../components/ui/Spinner';
import Alert from '../components/ui/Alert';
import ImageUpload from '../components/ui/ImageUpload';

const GRADING_SYSTEMS = [
  { value: 'af', label: 'A-F Grading' },
  { value: 'cbc', label: 'CBC Based' },
  { value: 'mastery', label: 'Mastery / Proficient / Competent / NYC' },
  { value: 'custom', label: 'Custom' },
];

const PAPER_SIZES = [
  { value: 'A4', label: 'A4 (210 Ã- 297 mm)' },
  { value: 'A5', label: 'A5 (148 Ã- 210 mm)' },
  { value: 'Letter', label: 'Letter (216 Ã- 279 mm)' },
];

const ORIENTATIONS = [
  { value: 'portrait', label: 'Portrait' },
  { value: 'landscape', label: 'Landscape' },
];

const SettingsPage = () => {
  const { isOwner } = useAuth();
  const {
    settings,
    loading,
    fetchSettings,
    saveSettings,
    saveGradingSystem,
    addNewGrade,
    removeGrade,
  } = useSettings();

  const [schoolForm, setSchoolForm] = useState({
    schoolName: '',
    schoolCode: '',
    motto: '',
    academicYear: '',
    term: '',
  });

  const [contactForm, setContactForm] = useState({
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    phone: '',
    email: '',
    website: '',
  });

  const [reportForm, setReportForm] = useState({
    reportFooter: '',
    passMark: 50,
  });

  const [printForm, setPrintForm] = useState({
    letterhead: '',
    letterheadHeight: 120,
    printMarginTop: 20,
    printMarginBottom: 20,
    paperSize: 'A4',
    orientation: 'portrait',
  });

  const [gradingSystem, setGradingSystem] = useState('mastery');
  const [grades, setGrades] = useState([]);
  const [showAddGrade, setShowAddGrade] = useState(false);
  const [deleteGradeTarget, setDeleteGradeTarget] = useState(null);
  const [gradeForm, setGradeForm] = useState({
    name: '',
    minScore: 0,
    maxScore: 100,
    remark: '',
  });
  const [saving, setSaving] = useState(false);
  const [logo, setLogo] = useState('');

  const readOnly = !isOwner;

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await fetchSettings();
      populateForms(data);
    } catch (error) {
      console.error('Failed to load settings');
    }
  };

  const populateForms = (data) => {
    if (!data) return;

    setSchoolForm({
      schoolName: data.schoolName || '',
      schoolCode: data.schoolCode || '',
      motto: data.motto || '',
      academicYear: data.academicYear || '',
      term: data.term || '',
    });

    setContactForm({
      address: data.address || '',
      city: data.city || '',
      state: data.state || '',
      postalCode: data.postalCode || '',
      country: data.country || '',
      phone: data.phone || '',
      email: data.email || '',
      website: data.website || '',
    });

    setReportForm({
      reportFooter: data.reportFooter || '',
      passMark: data.passMark || 50,
    });

    setPrintForm({
      letterhead: data.letterhead || '',
      letterheadHeight: data.letterheadHeight || 120,
      printMarginTop: data.printMarginTop || 20,
      printMarginBottom: data.printMarginBottom || 20,
      paperSize: data.paperSize || 'A4',
      orientation: data.orientation || 'portrait',
    });

    setGradingSystem(data.gradingSystem || 'mastery');
    setGrades(data.grades || []);
    setLogo(data.logo || '');
  };

  const handleSaveSchool = async () => {
    setSaving(true);
    try {
      await saveSettings({ ...schoolForm, logo });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveContact = async () => {
    setSaving(true);
    try {
      await saveSettings(contactForm);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveReport = async () => {
    setSaving(true);
    try {
      await saveSettings(reportForm);
    } finally {
      setSaving(false);
    }
  };

  const handleSavePrint = async () => {
    setSaving(true);
    try {
      await saveSettings(printForm);
    } finally {
      setSaving(false);
    }
  };

  const handleGradingSystemChange = async (system) => {
    if (readOnly) return;
    setGradingSystem(system);
    setSaving(true);
    try {
      const data = await saveGradingSystem({
        gradingSystem: system,
        passMark: reportForm.passMark,
      });
      setGrades(data.grades || []);
    } finally {
      setSaving(false);
    }
  };

  const handleAddGrade = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = await addNewGrade(gradeForm);
      setGrades(data.grades || []);
      setShowAddGrade(false);
      setGradeForm({ name: '', minScore: 0, maxScore: 100, remark: '' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGrade = async () => {
    if (!deleteGradeTarget) return;
    setSaving(true);
    try {
      const data = await removeGrade(deleteGradeTarget._id);
      setGrades(data.grades || []);
      setDeleteGradeTarget(null);
    } finally {
      setSaving(false);
    }
  };

  if (loading && !settings) {
    return <Spinner size="lg" className="py-20" />;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">
          {readOnly ? 'View school information' : 'Manage your school information'}
        </p>
      </div>

      {readOnly && (
        <div className="mb-6">
          <Alert
            type="info"
            message="You can view settings but only the account owner can make changes."
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="School Information" subtitle="Basic school details">
          <div className="space-y-4">
            <ImageUpload
              label="School Logo"
              value={logo}
              onChange={setLogo}
              type="logo"
              previewHeight="h-24"
              recommended="PNG, JPG, WebP, or SVG - max 5MB"
              disabled={readOnly}
            />

            <Input
              label="School Name"
              value={schoolForm.schoolName}
              onChange={(e) => setSchoolForm({ ...schoolForm, schoolName: e.target.value })}
              disabled={readOnly}
            />
            <Input
              label="School Code"
              value={schoolForm.schoolCode}
              onChange={(e) => setSchoolForm({ ...schoolForm, schoolCode: e.target.value })}
              disabled={readOnly}
            />
            <Input
              label="Motto"
              value={schoolForm.motto}
              onChange={(e) => setSchoolForm({ ...schoolForm, motto: e.target.value })}
              disabled={readOnly}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Academic Year"
                value={schoolForm.academicYear}
                onChange={(e) => setSchoolForm({ ...schoolForm, academicYear: e.target.value })}
                disabled={readOnly}
              />
              <Input
                label="Term"
                value={schoolForm.term}
                onChange={(e) => setSchoolForm({ ...schoolForm, term: e.target.value })}
                disabled={readOnly}
              />
            </div>
            {!readOnly && (
              <Button onClick={handleSaveSchool} isLoading={saving}>
                Save School Info
              </Button>
            )}
          </div>
        </Card>

        <Card title="Contact Details" subtitle="School contact information">
          <div className="space-y-4">
            <Input
              label="Address"
              value={contactForm.address}
              onChange={(e) => setContactForm({ ...contactForm, address: e.target.value })}
              disabled={readOnly}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="City"
                value={contactForm.city}
                onChange={(e) => setContactForm({ ...contactForm, city: e.target.value })}
                disabled={readOnly}
              />
              <Input
                label="State/Region"
                value={contactForm.state}
                onChange={(e) => setContactForm({ ...contactForm, state: e.target.value })}
                disabled={readOnly}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Postal Code"
                value={contactForm.postalCode}
                onChange={(e) => setContactForm({ ...contactForm, postalCode: e.target.value })}
                disabled={readOnly}
              />
              <Input
                label="Country"
                value={contactForm.country}
                onChange={(e) => setContactForm({ ...contactForm, country: e.target.value })}
                disabled={readOnly}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Phone"
                value={contactForm.phone}
                onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                disabled={readOnly}
              />
              <Input
                label="Email"
                type="email"
                value={contactForm.email}
                onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                disabled={readOnly}
              />
            </div>
            <Input
              label="Website"
              value={contactForm.website}
              onChange={(e) => setContactForm({ ...contactForm, website: e.target.value })}
              disabled={readOnly}
            />
            {!readOnly && (
              <Button onClick={handleSaveContact} isLoading={saving}>
                Save Contact Info
              </Button>
            )}
          </div>
        </Card>

        <Card
          title="Grading System"
          subtitle="Configure how grades are calculated"
          className="lg:col-span-2"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Grading System"
                options={GRADING_SYSTEMS}
                value={gradingSystem}
                onChange={(e) => handleGradingSystemChange(e.target.value)}
                disabled={readOnly}
              />
              <Input
                label="Pass Mark"
                type="number"
                min="0"
                max="100"
                value={reportForm.passMark}
                onChange={(e) =>
                  setReportForm({ ...reportForm, passMark: Number(e.target.value) })
                }
                disabled={readOnly}
              />
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Min</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Max</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Remark</th>
                    {!readOnly && gradingSystem === 'custom' && <th className="px-3 py-2"></th>}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {grades.map((grade) => (
                    <tr key={grade._id}>
                      <td className="px-3 py-2 text-sm font-medium text-gray-900">{grade.name}</td>
                      <td className="px-3 py-2 text-sm text-gray-500">{grade.minScore}</td>
                      <td className="px-3 py-2 text-sm text-gray-500">{grade.maxScore}</td>
                      <td className="px-3 py-2 text-sm text-gray-500">{grade.remark}</td>
                      {!readOnly && gradingSystem === 'custom' && (
                        <td className="px-3 py-2">
                          <button
                            onClick={() => setDeleteGradeTarget(grade)}
                            className="text-red-400 hover:text-red-600"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {!readOnly && gradingSystem === 'custom' && (
              <Button variant="secondary" onClick={() => setShowAddGrade(true)}>
                + Add Grade
              </Button>
            )}

            {!readOnly && (
              <div className="pt-2 border-t">
                <Button onClick={handleSaveReport} isLoading={saving}>
                  Save Grading Settings
                </Button>
              </div>
            )}
          </div>
        </Card>

        <Card
          title="Letterhead & Print"
          subtitle="Configure printed documents"
          className="lg:col-span-2"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ImageUpload
              label="Letterhead Image"
              value={printForm.letterhead}
              onChange={(val) => setPrintForm({ ...printForm, letterhead: val })}
              type="letterhead"
              previewHeight="h-40"
              recommended="A4 scan recommended (210mm wide) - max 5MB"
              disabled={readOnly}
            />

            <div className="space-y-4">
              <Input
                label="Letterhead Height (mm)"
                type="number"
                min="0"
                value={printForm.letterheadHeight}
                onChange={(e) =>
                  setPrintForm({ ...printForm, letterheadHeight: Number(e.target.value) })
                }
                disabled={readOnly}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Top Margin (mm)"
                  type="number"
                  min="0"
                  value={printForm.printMarginTop}
                  onChange={(e) =>
                    setPrintForm({ ...printForm, printMarginTop: Number(e.target.value) })
                  }
                  disabled={readOnly}
                />
                <Input
                  label="Bottom Margin (mm)"
                  type="number"
                  min="0"
                  value={printForm.printMarginBottom}
                  onChange={(e) =>
                    setPrintForm({ ...printForm, printMarginBottom: Number(e.target.value) })
                  }
                  disabled={readOnly}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Paper Size"
                  options={PAPER_SIZES}
                  value={printForm.paperSize}
                  onChange={(e) => setPrintForm({ ...printForm, paperSize: e.target.value })}
                  disabled={readOnly}
                />
                <Select
                  label="Orientation"
                  options={ORIENTATIONS}
                  value={printForm.orientation}
                  onChange={(e) => setPrintForm({ ...printForm, orientation: e.target.value })}
                  disabled={readOnly}
                />
              </div>
              {!readOnly && (
                <Button onClick={handleSavePrint} isLoading={saving}>
                  Save Print Settings
                </Button>
              )}
            </div>
          </div>
        </Card>

        <Card title="Report Settings" subtitle="Configure report output" className="lg:col-span-2">
          <div className="space-y-4">
            <Input
              label="Report Footer Text"
              placeholder="Â© 2026 My School"
              value={reportForm.reportFooter}
              onChange={(e) => setReportForm({ ...reportForm, reportFooter: e.target.value })}
              disabled={readOnly}
            />
            {!readOnly && (
              <Button onClick={handleSaveReport} isLoading={saving}>
                Save Report Settings
              </Button>
            )}
          </div>
        </Card>
      </div>

      <Modal isOpen={showAddGrade} onClose={() => setShowAddGrade(false)} title="Add Custom Grade">
        <form onSubmit={handleAddGrade} className="space-y-4">
          <Input
            label="Grade Name"
            value={gradeForm.name}
            onChange={(e) => setGradeForm({ ...gradeForm, name: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Min Score"
              type="number"
              min="0"
              max="100"
              value={gradeForm.minScore}
              onChange={(e) => setGradeForm({ ...gradeForm, minScore: Number(e.target.value) })}
              required
            />
            <Input
              label="Max Score"
              type="number"
              min="0"
              max="100"
              value={gradeForm.maxScore}
              onChange={(e) => setGradeForm({ ...gradeForm, maxScore: Number(e.target.value) })}
              required
            />
          </div>
          <Input
            label="Remark (optional)"
            value={gradeForm.remark}
            onChange={(e) => setGradeForm({ ...gradeForm, remark: e.target.value })}
          />
          <div className="flex justify-end space-x-3">
            <Button variant="secondary" onClick={() => setShowAddGrade(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={saving}>
              Add
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteGradeTarget}
        onClose={() => setDeleteGradeTarget(null)}
        onConfirm={handleDeleteGrade}
        title="Delete Grade"
        message={`Delete "${deleteGradeTarget?.name}"?`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};

export default SettingsPage;
