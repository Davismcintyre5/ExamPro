export const ASSESSMENT_TYPES = [
  { value: 1, label: 'Formative 1' },
  { value: 2, label: 'Formative 2' },
  { value: 3, label: 'Formative 3' },
  { value: 4, label: 'Formative 4' },
];

export const FORMATIVE_COUNTS = [
  { value: 3, label: '3 Formatives' },
  { value: 4, label: '4 Formatives' },
];

export const DEFAULT_GRADES = [
  { name: 'Mastery', minScore: 80, maxScore: 100, remark: 'Mastery' },
  { name: 'Proficient', minScore: 70, maxScore: 79, remark: 'Proficient' },
  { name: 'Competent', minScore: 50, maxScore: 69, remark: 'Competent' },
  { name: 'Not Yet Competent', minScore: 0, maxScore: 49, remark: 'NYC' },
];

export const PASS_MARK = 50;

export const getGradeFromScore = (score, grades) => {
  if (score === null || score === undefined || isNaN(score)) return null;
  const list = grades && grades.length ? grades : DEFAULT_GRADES;
  for (const grade of list) {
    if (score >= grade.minScore && score <= grade.maxScore) {
      return grade.name;
    }
  }
  return 'Not Yet Competent';
};

export const getGradeColor = (gradeName) => {
  const map = {
    'Mastery': 'text-green-600',
    'Proficient': 'text-blue-600',
    'Competent': 'text-yellow-600',
    'Not Yet Competent': 'text-red-600',
  };
  return map[gradeName] || 'text-gray-600';
};

export const getGradeBadgeVariant = (gradeName) => {
  const map = {
    'Mastery': 'success',
    'Proficient': 'primary',
    'Competent': 'warning',
    'Not Yet Competent': 'danger',
  };
  return map[gradeName] || 'default';
};