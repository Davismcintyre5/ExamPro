import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

const RecordScoreModal = ({
  isOpen,
  onClose,
  onSubmit,
  unit,
  assessmentType,
  maxScore,
  students,
  existingScores,
}) => {
  const [scores, setScores] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const typeLabel = {
    assignment: 'Assignment',
    cat: 'CAT',
    exam: 'Exam',
  }[assessmentType] || 'Score';

  useEffect(() => {
    if (isOpen && unit) {
      const initial = {};
      students.forEach((student) => {
        const existing = existingScores.find(
          (s) =>
            (s.studentId?._id || s.studentId)?.toString() === student._id.toString() &&
            (s.unitId?._id || s.unitId)?.toString() === unit._id.toString() &&
            s.assessmentType === assessmentType
        );
        initial[student._id] = existing ? String(existing.score) : '';
      });
      setScores(initial);
      setError('');
    }
  }, [isOpen, unit, students, existingScores, assessmentType]);

  const handleChange = (studentId, value) => {
    setScores((prev) => ({ ...prev, [studentId]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const payload = [];

    for (const student of students) {
      const rawValue = scores[student._id];

      if (rawValue === '' || rawValue === undefined) continue;

      const num = Number(rawValue);

      if (isNaN(num) || num < 0) {
        setError(`Invalid score for ${student.fullName}`);
        return;
      }

      if (num > maxScore) {
        setError(`Score for ${student.fullName} cannot exceed ${maxScore}`);
        return;
      }

      payload.push({
        studentId: student._id,
        score: num,
      });
    }

    if (payload.length === 0) {
      setError('No scores to save');
      return;
    }

    setSaving(true);
    try {
      await onSubmit(payload);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save scores');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${typeLabel} - ${unit?.name || ''} (Max ${maxScore})`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
            {error}
          </div>
        )}

        {students.length === 0 ? (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
            No students in this class.
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[60vh]">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Student
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {typeLabel} (Max {maxScore})
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.map((student) => (
                  <tr key={student._id}>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="font-medium text-gray-900 text-sm">{student.fullName}</p>
                      <p className="text-xs text-gray-500">{student.admissionNumber || ''}</p>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="0"
                        max={maxScore}
                        step="1"
                        className="w-24 px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        value={scores[student._id] || ''}
                        onChange={(e) => handleChange(student._id, e.target.value)}
                        placeholder="0"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-2 border-t">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={saving}
            disabled={students.length === 0}
          >
            Save {typeLabel}s
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default RecordScoreModal;
