import Card from '../ui/Card';
import { formatScore } from '../../utils/formatters';
import { getGradeFromSettings, getGradeColorFromSettings } from '../../utils/calculations';

const CourseFinalTable = ({ course, students, unitResults, settings }) => {
  const getStudentGrade = (studentId) => {
    const studentUnits = unitResults[studentId] || [];
    const courseFinal = studentUnits.reduce((sum, u) => {
      return sum + (u.finalScore * (u.unitWeight || 0) / 100);
    }, 0);
    
    const grade = getGradeFromSettings(courseFinal, settings);
    return { courseFinal: Math.round(courseFinal * 100) / 100, grade };
  };

  const allFinals = students.map(s => getStudentGrade(s._id).courseFinal);
  
  const classAverage = allFinals.length > 0 
    ? allFinals.reduce((a, b) => a + b, 0) / allFinals.length 
    : 0;

  return (
    <Card>
      <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Course Final Results</h3>
          <p className="text-sm text-gray-500">
            Class Average: <strong>{formatScore(classAverage)}</strong>
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
              {course.units?.map((unit) => (
                <th key={unit._id} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  {unit.name}
                  <span className="block text-xs text-gray-400 normal-case">({unit.weight}%)</span>
                </th>
              ))}
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Final</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {students.map((student) => {
              const studentUnits = unitResults[student._id] || [];
              const { courseFinal, grade } = getStudentGrade(student._id);
              const gradeColor = getGradeColorFromSettings(grade, settings);
              
              return (
                <tr key={student._id}>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <p className="font-medium text-gray-900">{student.fullName}</p>
                    <p className="text-xs text-gray-500">{student.admissionNumber || ''}</p>
                  </td>
                  {course.units?.map((unit) => {
                    const unitResult = studentUnits.find(u => u.unitId === unit._id.toString() || u.unitId === unit._id);
                    return (
                      <td key={unit._id} className="px-4 py-3 whitespace-nowrap text-sm">
                        {unitResult ? formatScore(unitResult.finalScore) : '-'}
                      </td>
                    );
                  })}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="font-semibold text-gray-900">{formatScore(courseFinal)}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`font-semibold ${gradeColor}`}>{grade}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default CourseFinalTable;
