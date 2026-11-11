import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as classApi from '../api/classApi';
import * as scoreApi from '../api/scoreApi';
import { useAuth } from '../context/AuthContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { getGradeFromScore, getGradeColor, getGradeBadgeVariant } from '../utils/constants';
import toast from 'react-hot-toast';

const MarksEntryPage = () => {
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

  useEffect(() => {
    load();
  }, [classId, unitId]);

  const load = async () => {
    setLoading(true);
    try {
      const [clsData, scoreData] = await Promise.all([
        classApi.getClassById(classId),
        scoreApi.getScoresByUnit(unitId),
      ]);

      const foundUnit = clsData.units.find((u) => u._id === unitId);
      if (!foundUnit) {
        toast.error('Unit not found');
        navigate(`/classes/${classId}`);
        return;
      }

      setCls(clsData);
      setUnit(foundUnit);
      setStudents(clsData.students || []);

      const scoreMap = {};
      scoreData.forEach((s) => {
        const key = `${s.studentId}_${s.formativeNumber}`;
        scoreMap[key] = {
          score: s.score,
          locked: s.locked,
          _id: s._id,
        };
      });
      setScores(scoreMap);

      const gradingData = await import('../api/settingsApi').then((m) => m.getSettings());
      setSettings(gradingData);
    } catch (error) {
      toast.error('Failed to load');
      navigate(`/classes/${classId}`);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (studentId, formativeNumber, value) => {
    const key = `${studentId}_${formativeNumber}`;
    setScores((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] || {}),
        score: value,
      },
    }));
  };

  const getScore = (studentId, formativeNumber) => {
    const key = `${studentId}_${formativeNumber}`;
    return scores[key]?.score ?? '';
  };

  const isLocked = (studentId, formativeNumber) => {
    const key = `${studentId}_${formativeNumber}`;
    return scores[key]?.locked === true;
  };

  const getStudentAverage = (studentId) => {
    const count = unit.formativeCount;
    const values = [];

    for (let i = 1; i <= count; i++) {
      const v = getScore(studentId, i);
      if (v !== '' && v !== null && v !== undefined && !isNaN(v)) {
        values.push(Number(v));
      }
    }

    if (values.length === 0) return null;
    const sum = values.reduce((a, b) => a + b, 0);
    return Math.round(sum / values.length);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = [];

      for (const student of students) {
        for (let i = 1; i <= unit.formativeCount; i++) {
          const key = `${student._id}_${i}`;
          const existing = scores[key];

          if (existing?.locked) continue;

          const raw = existing?.score;
          if (raw === '' || raw === undefined || raw === null) continue;

          const num = Number(raw);
          if (isNaN(num) || num < 0 || num > 100) continue;

          payload.push({
            studentId: student._id,
            formativeNumber: i,
            score: num,
          });
        }
      }

      if (payload.length === 0) {
        toast.error('No new scores to save');
        setSaving(false);
        return;
      }

      const result = await scoreApi.saveBulkScores({
        classId,
        unitId,
        scores: payload,
      });

      toast.success(`${result.totalSaved} scores saved`);
      if (result.totalErrors > 0) {
        toast.error(`${result.totalErrors} scores failed`);
      }
      load();
    } catch (error) {
      toast.error('Failed to save scores');
    } finally {
      setSaving(false);
    }
  };

  const handleUnlock = async () => {
    try {
      const result = await scoreApi.unlockScores(classId, unitId);
      toast.success(`${result.unlocked} scores unlocked`);
      setShowUnlock(false);
      load();
    } catch (error) {
      toast.error('Failed to unlock scores');
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
            onClick={() => navigate(`/classes/${classId}`)}
            className="text-blue-600 hover:text-blue-800 text-sm mb-2 flex items-center"
          >
            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to {cls.className}
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            {unit.name} - Marks Entry
          </h1>
          <div className="flex items-center space-x-2 mt-2">
            <Badge variant="info">{cls.className}</Badge>
            <code className="text-xs bg-gray-100 px-2 py-1 rounded">{unit.code}</code>
            <Badge variant="primary">{unit.formativeCount} Formatives</Badge>
          </div>
        </div>
        <div className="flex space-x-3">
          {isOwner && (
            <Button variant="warning" onClick={() => setShowUnlock(true)}>
              Unlock All
            </Button>
          )}
          <Button onClick={handleSave} isLoading={saving}>
            Save Marks
          </Button>
        </div>
      </div>

      <Card>
        {students.length === 0 ? (
          <p className="text-gray-400 text-center py-6">No students in this class</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Student
                  </th>
                  {Array.from({ length: unit.formativeCount }, (_, i) => i + 1).map((n) => (
                    <th key={n} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Formative {n}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Average
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Grade
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.map((student) => {
                  const avg = getStudentAverage(student._id);
                  const grade =
                    avg !== null
                      ? avg < passMark
                        ? 'Not Yet Competent'
                        : getGradeFromScore(avg, grades)
                      : null;

                  return (
                    <tr key={student._id}>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="font-medium text-gray-900">{student.fullName}</p>
                        <p className="text-xs text-gray-500">{student.admissionNumber || ''}</p>
                      </td>
                      {Array.from({ length: unit.formativeCount }, (_, i) => i + 1).map((n) => {
                        const locked = isLocked(student._id, n);
                        return (
                          <td key={n} className="px-4 py-3">
                            <div className="flex items-center space-x-1">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="1"
                                disabled={locked}
                                className={`w-20 px-2 py-1 border rounded-md text-sm ${
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
                        <span className="font-bold text-gray-900">
                          {avg !== null ? avg : '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {grade ? (
                          <Badge variant={getGradeBadgeVariant(grade)}>{grade}</Badge>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <Button onClick={handleSave} isLoading={saving} size="lg">
            Save Marks
          </Button>
        </div>
      </Card>

      <ConfirmDialog
        isOpen={showUnlock}
        onClose={() => setShowUnlock(false)}
        onConfirm={handleUnlock}
        title="Unlock All Scores"
        message={`Unlock all scores for "${unit.name}"? Staff will be able to edit again.`}
        confirmText="Unlock"
        variant="warning"
      />
    </div>
  );
};

export default MarksEntryPage;
