import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as classApi from '../api/classApi';
import * as scoreApi from '../api/scoreApi';
import * as settingsApi from '../api/settingsApi';
import { useAuth } from '../context/AuthContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import ExportMenu from '../components/ui/ExportMenu';
import BulkAddModal from '../components/common/BulkAddModal';
import ImportModal from '../components/common/ImportModal';
import { getGradeFromScore, getGradeBadgeVariant } from '../utils/constants';
import toast from 'react-hot-toast';

const MarksUnitPage = () => {
  const { classId, unitId } = useParams();
  const navigate = useNavigate();
  const { isOwner } = useAuth();
  const [cls, setCls] = useState(null);
  const [unit, setUnit] = useState(null);
  const [students, setStudents] = useState([]);
  const [scores, setScores] = useState({});
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showUnlock, setShowUnlock] = useState(false);
  const [showPaste, setShowPaste] = useState(false);
  const [showImport, setShowImport] = useState(false);

  useEffect(() => {
    load();
  }, [classId, unitId]);

  const load = async () => {
    setLoading(true);
    try {
      const [clsData, scoreData, settingsData] = await Promise.all([
        classApi.getClassById(classId),
        scoreApi.getScoresByUnit(unitId),
        settingsApi.getSettings()
      ]);

      const foundUnit = clsData.units.find((u) => u._id === unitId);
      if (!foundUnit) {
        toast.error('Unit not found');
        navigate('/marks');
        return;
      }

      setCls(clsData);
      setUnit(foundUnit);
      setStudents(clsData.students || []);
      setSettings(settingsData);

      const map = {};
      scoreData.forEach((s) => {
        const key = `${s.studentId}_${s.formativeNumber}`;
        map[key] = { score: s.score, locked: s.locked, _id: s._id };
      });
      setScores(map);
    } catch (error) {
      toast.error('Failed to load');
      navigate('/marks');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (studentId, formativeNumber, value) => {
    const cleaned = String(value).replace(/[^0-9]/g, '');
    const key = `${studentId}_${formativeNumber}`;

    if (cleaned === '') {
      setScores((prev) => ({ ...prev, [key]: { ...(prev[key] || {}), score: '' } }));
      return;
    }
    const num = Number(cleaned);
    if (isNaN(num) || num < 0 || num > 100) return;

    setScores((prev) => ({ ...prev, [key]: { ...(prev[key] || {}), score: num } }));
  };

  const getScore = (studentId, formativeNumber) => {
    const val = scores[`${studentId}_${formativeNumber}`]?.score;
    return val === undefined || val === null ? '' : val;
  };

  const isLocked = (studentId, formativeNumber) =>
    scores[`${studentId}_${formativeNumber}`]?.locked === true;

  const getStudentAverage = (studentId) => {
    const values = [];
    for (let i = 1; i <= unit.formativeCount; i++) {
      const v = getScore(studentId, i);
      if (v !== '' && v !== null && v !== undefined && !isNaN(v)) values.push(Number(v));
    }
    if (values.length === 0) return null;
    return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = [];
      for (const student of students) {
        for (let i = 1; i <= unit.formativeCount; i++) {
          const existing = scores[`${student._id}_${i}`];
          if (existing?.locked) continue;
          const raw = existing?.score;
          if (raw === '' || raw === undefined || raw === null) continue;
          const num = Number(raw);
          if (isNaN(num) || num < 0 || num > 100) continue;
          payload.push({ studentId: student._id, formativeNumber: i, score: num });
        }
      }

      if (payload.length === 0) {
        toast.error('No new scores to save');
        setSaving(false);
        return;
      }

      const result = await scoreApi.saveBulkScores({ classId, unitId, scores: payload });
      toast.success(`${result.totalSaved} scores saved`);
      if (result.totalErrors > 0) toast.error(`${result.totalErrors} failed`);
      load();
    } catch (error) {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handlePaste = async (lines) => {
    const rows = lines.map((line) => {
      const parts = line.split(',').map((p) => p.trim());
      const admissionNumber = parts[0];
      const scores = [];
      for (let i = 1; i < parts.length; i++) {
        if (parts[i] !== '') scores.push({ formativeNumber: i, score: Number(parts[i]) });
      }
      return { admissionNumber, scores };
    });

    const result = await scoreApi.pasteScores(classId, unitId, rows);
    toast.success(`${result.totalSaved} scores saved`);
    setShowPaste(false);
    load();
  };

  const handleImport = async (file) => {
    return await scoreApi.importScores(classId, unitId, file);
  };

  const handleExport = async (format) => {
    try {
      await scoreApi.exportScores(classId, unitId, format);
      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error('Export failed');
    }
  };

  const handleUnlock = async () => {
    try {
      const result = await scoreApi.unlockScores(classId, unitId);
      toast.success(`${result.unlocked} unlocked`);
      setShowUnlock(false);
      load();
    } catch (error) {
      toast.error('Failed to unlock');
    }
  };

  if (loading) return <Spinner size="lg" className="py-20" />;
  if (!cls || !unit) return null;

  const grades = settings?.grades || [];
  const passMark = settings?.passMark || 50;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <button
            onClick={() => navigate('/marks')}
            className="text-blue-600 hover:text-blue-800 text-sm mb-2 flex items-center"
          >
            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Marks
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{unit.name} - Marks Entry</h1>
          <div className="flex items-center space-x-2 mt-2">
            <Badge variant="info">{cls.className}</Badge>
            <code className="text-xs bg-gray-100 px-2 py-1 rounded">{unit.code}</code>
            <Badge variant="primary">{unit.formativeCount} Formatives</Badge>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <ExportMenu onExport={handleExport} disabled={students.length === 0} />
          <Button variant="secondary" onClick={() => setShowImport(true)}>Import</Button>
          <Button variant="secondary" onClick={() => setShowPaste(true)}>Paste</Button>
          {isOwner && (
            <Button variant="warning" onClick={() => setShowUnlock(true)}>Unlock All</Button>
          )}
          <Button onClick={handleSave} isLoading={saving}>Save Marks</Button>
        </div>
      </div>

      <Card>
        {students.length === 0 ? (
          <p className="text-gray-400 text-center py-6">No students</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                  {Array.from({ length: unit.formativeCount }, (_, i) => i + 1).map((n) => (
                    <th key={n} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Formative {n}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Average</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.map((student) => {
                  const avg = getStudentAverage(student._id);
                  const grade = avg !== null
                    ? avg < passMark
                      ? 'Not Yet Competent'
                      : getGradeFromScore(avg, grades)
                    : null;

                  return (
                    <tr key={student._id}>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="font-medium text-gray-900">{student.fullName}</p>
                        <p className="text-xs text-gray-500">{student.admissionNumber}</p>
                      </td>
                      {Array.from({ length: unit.formativeCount }, (_, i) => i + 1).map((n) => {
                        const locked = isLocked(student._id, n);
                        return (
                          <td key={n} className="px-4 py-3">
                            <div className="flex items-center space-x-1">
                              <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                autoComplete="off"
                                disabled={locked}
                                placeholder="--"
                                className={`w-16 px-2 py-1 border rounded-md text-sm text-center ${
                                  locked
                                    ? 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed'
                                    : 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500'
                                }`}
                                value={getScore(student._id, n)}
                                onChange={(e) => handleChange(student._id, n, e.target.value)}
                              />
                              {locked && (
                                <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                              )}
                            </div>
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-bold text-gray-900">{avg !== null ? avg : '-'}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {grade ? <Badge variant={getGradeBadgeVariant(grade)}>{grade}</Badge> : <span className="text-gray-400 text-xs">-</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <Button onClick={handleSave} isLoading={saving} size="lg">Save Marks</Button>
        </div>
      </Card>

      <BulkAddModal
        isOpen={showPaste}
        onClose={() => setShowPaste(false)}
        onSubmit={handlePaste}
        title="Paste Marks"
        formatHint={`Format: admissionNumber, F1, F2, F3, F4 (up to ${unit.formativeCount} scores) - one per line`}
        placeholder={`ADM001, 78, 85, 90\nADM002, 66, 72, 80`}
        submitLabel="Save Marks"
      />

      <ImportModal
        isOpen={showImport}
        onClose={() => setShowImport(false)}
        onSubmit={handleImport}
        title="Import Marks"
        formatHint="Columns: admission_number, f1, f2, f3, f4"
        submitLabel="Import"
      />

      <ConfirmDialog
        isOpen={showUnlock}
        onClose={() => setShowUnlock(false)}
        onConfirm={handleUnlock}
        title="Unlock All Scores"
        message={`Unlock all scores for "${unit.name}"?`}
        confirmText="Unlock"
        variant="warning"
      />
    </div>
  );
};

export default MarksUnitPage;