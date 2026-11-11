import { useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import ConfirmDialog from '../ui/ConfirmDialog';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Modal from '../ui/Modal';
import { formatScore } from '../../utils/formatters';
import { ASSESSMENT_TYPES } from '../../utils/constants';
import { calculateUnitAverages, calculateUnitFinal, getGradeFromSettings, getGradeColorFromSettings } from '../../utils/calculations';

const UnitCard = ({
  unit,
  students,
  scores,
  settings,
  examType,
  weights,
  onAddAssessment,
  onDeleteAssessment,
  onScoreChange,
  onUpdateUnit,
  onDeleteUnit,
}) => {
  const [showAddAssessment, setShowAddAssessment] = useState(false);
  const [showEditUnit, setShowEditUnit] = useState(false);
  const [deleteAssessmentTarget, setDeleteAssessmentTarget] = useState(null);
  const [showDeleteUnit, setShowDeleteUnit] = useState(false);
  const [assessmentForm, setAssessmentForm] = useState({
    type: 'assignment',
    number: 1,
    title: '',
    maxScore: 100,
  });
  const [editForm, setEditForm] = useState({
    name: unit.name,
    code: unit.code || '',
    weight: unit.weight,
  });

  const assessmentsWithIndex = (unit.assessments || []).map((a, index) => ({
    ...a,
    originalIndex: index,
  }));

  const assignmentAssessments = assessmentsWithIndex.filter(a => a.type === 'assignment');
  const catAssessments = assessmentsWithIndex.filter(a => a.type === 'cat');
  const examAssessments = assessmentsWithIndex.filter(a => a.type === 'exam');

  const hasAssignments = assignmentAssessments.length > 0;
  const hasCats = catAssessments.length > 0;
  const hasExams = examAssessments.length > 0;

  const showAssignmentAvg = assignmentAssessments.length > 1;
  const showCatAvg = catAssessments.length > 1;
  const showExamAvg = examAssessments.length > 1;

  const getStudentScore = (studentId, assessmentIndex) => {
    const key = `${studentId}_${assessmentIndex}`;
    return scores[key] || '';
  };

  const getAverageForStudent = (studentId, assessmentType) => {
    const typeAssessments = assessmentsWithIndex.filter(a => a.type === assessmentType);
    if (typeAssessments.length === 0) return '';
    
    const validScores = typeAssessments
      .map(a => getStudentScore(studentId, a.originalIndex))
      .filter(s => s !== '' && !isNaN(s))
      .map(Number);
    
    if (validScores.length === 0) return '';
    
    const sum = validScores.reduce((acc, s) => acc + s, 0);
    return sum / validScores.length;
  };

  const calculateStudentUnitFinal = (studentId) => {
    const studentScores = assessmentsWithIndex.map((a) => ({
      assessmentIndex: a.originalIndex,
      score: getStudentScore(studentId, a.originalIndex),
    })).filter(s => s.score !== '' && !isNaN(s.score));

    const averages = calculateUnitAverages(unit, studentScores);
    return calculateUnitFinal(averages, weights, examType);
  };

  const handleAddAssessment = async (e) => {
    e.preventDefault();
    const title = assessmentForm.title || `${assessmentForm.type.toUpperCase()} ${assessmentForm.number}`;
    await onAddAssessment(unit._id, { ...assessmentForm, title });
    setShowAddAssessment(false);
    setAssessmentForm({ type: 'assignment', number: 1, title: '', maxScore: 100 });
  };

  const handleDeleteAssessment = async () => {
    if (deleteAssessmentTarget === null) return;
    await onDeleteAssessment(unit._id, deleteAssessmentTarget);
    setDeleteAssessmentTarget(null);
  };

  const handleUpdateUnit = async (e) => {
    e.preventDefault();
    await onUpdateUnit(unit._id, editForm);
    setShowEditUnit(false);
  };

  const handleDeleteUnit = async () => {
    await onDeleteUnit(unit._id);
    setShowDeleteUnit(false);
  };

  const unitAverage = students.length > 0
    ? students.reduce((sum, s) => sum + calculateStudentUnitFinal(s._id), 0) / students.length
    : 0;

  const unitGrade = getGradeFromSettings(unitAverage, settings);
  const unitGradeColor = getGradeColorFromSettings(unitGrade, settings);

  return (
    <Card>
      <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{unit.name}</h3>
            {unit.code && <p className="text-xs text-gray-500">{unit.code}</p>}
          </div>
          <Badge variant="primary">{unit.weight}%</Badge>
          <Badge variant="info">
            Unit Avg: {formatScore(unitAverage)} <span className={unitGradeColor}>{unitGrade}</span>
          </Badge>
        </div>
        <div className="flex space-x-2">
          <Button variant="secondary" size="sm" onClick={() => setShowEditUnit(true)}>
            Edit
          </Button>
          <Button variant="danger" size="sm" onClick={() => setShowDeleteUnit(true)}>
            Delete
          </Button>
        </div>
      </div>

      <div className="flex space-x-2 mb-4">
        <Button size="sm" variant="outline" onClick={() => {
          setAssessmentForm({ type: 'assignment', number: 1, title: '', maxScore: 100 });
          setShowAddAssessment(true);
        }}>
          + Assignment
        </Button>
        <Button size="sm" variant="outline" onClick={() => {
          setAssessmentForm({ type: 'cat', number: 1, title: '', maxScore: 100 });
          setShowAddAssessment(true);
        }}>
          + CAT
        </Button>
        <Button size="sm" variant="outline" onClick={() => {
          setAssessmentForm({ type: 'exam', number: 1, title: '', maxScore: 100 });
          setShowAddAssessment(true);
        }}>
          + Exam
        </Button>
      </div>

      {assessmentsWithIndex.length === 0 ? (
        <p className="text-center text-gray-400 py-6 text-sm">
          No assessments yet. Click + Assignment, + CAT, or + Exam to add.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                
                {hasAssignments && (
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase bg-blue-50" colSpan={showAssignmentAvg ? assignmentAssessments.length + 1 : assignmentAssessments.length}>
                    Assignments
                  </th>
                )}
                {hasCats && (
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase bg-yellow-50" colSpan={showCatAvg ? catAssessments.length + 1 : catAssessments.length}>
                    CATs
                  </th>
                )}
                {hasExams && (
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase bg-green-50" colSpan={showExamAvg ? examAssessments.length + 1 : examAssessments.length}>
                    Exams
                  </th>
                )}
                
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unit Score</th>
              </tr>
              <tr>
                <th className="px-3 py-2"></th>
                
                {assignmentAssessments.map((a) => (
                  <th key={`a-${a.originalIndex}`} className="px-2 py-2 text-left text-xs font-medium text-gray-400">
                    <div className="flex items-center space-x-1">
                      <span>{a.title}</span>
                      <button onClick={() => setDeleteAssessmentTarget(a.originalIndex)} className="text-red-400 hover:text-red-600">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </th>
                ))}
                {showAssignmentAvg && <th className="px-2 py-2 text-xs font-bold text-blue-600 uppercase">Avg</th>}
                
                {catAssessments.map((a) => (
                  <th key={`c-${a.originalIndex}`} className="px-2 py-2 text-left text-xs font-medium text-gray-400">
                    <div className="flex items-center space-x-1">
                      <span>{a.title}</span>
                      <button onClick={() => setDeleteAssessmentTarget(a.originalIndex)} className="text-red-400 hover:text-red-600">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </th>
                ))}
                {showCatAvg && <th className="px-2 py-2 text-xs font-bold text-yellow-600 uppercase">Avg</th>}
                
                {examAssessments.map((a) => (
                  <th key={`e-${a.originalIndex}`} className="px-2 py-2 text-left text-xs font-medium text-gray-400">
                    <div className="flex items-center space-x-1">
                      <span>{a.title}</span>
                      <button onClick={() => setDeleteAssessmentTarget(a.originalIndex)} className="text-red-400 hover:text-red-600">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </th>
                ))}
                {showExamAvg && <th className="px-2 py-2 text-xs font-bold text-green-600 uppercase">Avg</th>}
                
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {students.map((student) => {
                const unitFinal = calculateStudentUnitFinal(student._id);
                const grade = getGradeFromSettings(unitFinal, settings);
                const gradeColor = getGradeColorFromSettings(grade, settings);
                
                return (
                  <tr key={student._id}>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <p className="font-medium text-gray-900 text-sm">{student.fullName}</p>
                      <p className="text-xs text-gray-500">{student.admissionNumber || ''}</p>
                    </td>
                    
                    {assignmentAssessments.map((a) => (
                      <td key={`a-${a.originalIndex}`} className="px-2 py-2">
                        <input
                          type="number"
                          min="0"
                          max={a.maxScore}
                          className="w-16 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          value={getStudentScore(student._id, a.originalIndex)}
                          onChange={(e) => onScoreChange(student._id, unit._id, a.originalIndex, e.target.value)}
                        />
                      </td>
                    ))}
                    {showAssignmentAvg && (
                      <td className="px-2 py-2 bg-blue-50">
                        <span className="font-bold text-blue-700 text-sm">{formatScore(getAverageForStudent(student._id, 'assignment'))}</span>
                      </td>
                    )}
                    
                    {catAssessments.map((a) => (
                      <td key={`c-${a.originalIndex}`} className="px-2 py-2">
                        <input
                          type="number"
                          min="0"
                          max={a.maxScore}
                          className="w-16 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          value={getStudentScore(student._id, a.originalIndex)}
                          onChange={(e) => onScoreChange(student._id, unit._id, a.originalIndex, e.target.value)}
                        />
                      </td>
                    ))}
                    {showCatAvg && (
                      <td className="px-2 py-2 bg-yellow-50">
                        <span className="font-bold text-yellow-700 text-sm">{formatScore(getAverageForStudent(student._id, 'cat'))}</span>
                      </td>
                    )}
                    
                    {examAssessments.map((a) => (
                      <td key={`e-${a.originalIndex}`} className="px-2 py-2">
                        <input
                          type="number"
                          min="0"
                          max={a.maxScore}
                          className="w-16 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          value={getStudentScore(student._id, a.originalIndex)}
                          onChange={(e) => onScoreChange(student._id, unit._id, a.originalIndex, e.target.value)}
                        />
                      </td>
                    ))}
                    {showExamAvg && (
                      <td className="px-2 py-2 bg-green-50">
                        <span className="font-bold text-green-700 text-sm">{formatScore(getAverageForStudent(student._id, 'exam'))}</span>
                      </td>
                    )}
                    
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className="font-semibold text-gray-900 text-sm">{formatScore(unitFinal)}</span>
                      <span className={`ml-2 text-xs font-semibold ${gradeColor}`}>{grade}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={showAddAssessment}
        onClose={() => setShowAddAssessment(false)}
        title="Add Assessment"
      >
        <form onSubmit={handleAddAssessment} className="space-y-4">
          <Select
            label="Type"
            options={ASSESSMENT_TYPES}
            value={assessmentForm.type}
            onChange={(e) => setAssessmentForm({ ...assessmentForm, type: e.target.value })}
            required
          />
          <Input
            label="Number"
            type="number"
            min="1"
            value={assessmentForm.number}
            onChange={(e) => setAssessmentForm({ ...assessmentForm, number: Number(e.target.value) })}
            required
          />
          <Input
            label="Title (optional)"
            placeholder="e.g., CAT 1"
            value={assessmentForm.title}
            onChange={(e) => setAssessmentForm({ ...assessmentForm, title: e.target.value })}
          />
          <Input
            label="Max Score"
            type="number"
            min="1"
            value={assessmentForm.maxScore}
            onChange={(e) => setAssessmentForm({ ...assessmentForm, maxScore: Number(e.target.value) })}
            required
          />
          <div className="flex justify-end space-x-3">
            <Button variant="secondary" onClick={() => setShowAddAssessment(false)}>Cancel</Button>
            <Button type="submit">Add</Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showEditUnit}
        onClose={() => setShowEditUnit(false)}
        title="Edit Unit"
      >
        <form onSubmit={handleUpdateUnit} className="space-y-4">
          <Input
            label="Unit Name"
            value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            required
          />
          <Input
            label="Unit Code"
            value={editForm.code}
            onChange={(e) => setEditForm({ ...editForm, code: e.target.value })}
          />
          <Input
            label="Weight (%)"
            type="number"
            min="1"
            max="100"
            value={editForm.weight}
            onChange={(e) => setEditForm({ ...editForm, weight: Number(e.target.value) })}
            required
          />
          <div className="flex justify-end space-x-3">
            <Button variant="secondary" onClick={() => setShowEditUnit(false)}>Cancel</Button>
            <Button type="submit">Update</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deleteAssessmentTarget !== null}
        onClose={() => setDeleteAssessmentTarget(null)}
        onConfirm={handleDeleteAssessment}
        title="Delete Assessment"
        message="Delete this assessment and all its scores?"
        confirmText="Delete"
        variant="danger"
      />

      <ConfirmDialog
        isOpen={showDeleteUnit}
        onClose={() => setShowDeleteUnit(false)}
        onConfirm={handleDeleteUnit}
        title="Delete Unit"
        message={`Delete "${unit.name}" and all its assessments and scores?`}
        confirmText="Delete"
        variant="danger"
      />
    </Card>
  );
};

export default UnitCard;
