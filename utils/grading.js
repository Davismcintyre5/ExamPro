const DEFAULT_GRADES = [
  { name: 'Mastery', minScore: 80, maxScore: 100, remark: 'Mastery' },
  { name: 'Proficient', minScore: 70, maxScore: 79, remark: 'Proficient' },
  { name: 'Competent', minScore: 50, maxScore: 69, remark: 'Competent' },
  { name: 'Not Yet Competent', minScore: 0, maxScore: 49, remark: 'NYC' }
];

const getGradeFromScore = (score, grades) => {
  if (score === null || score === undefined || isNaN(score)) {
    return null;
  }

  const list = grades && grades.length ? grades : DEFAULT_GRADES;

  for (const grade of list) {
    if (score >= grade.minScore && score <= grade.maxScore) {
      return grade.name;
    }
  }

  return 'Not Yet Competent';
};

const getRemarkFromScore = (score, grades) => {
  if (score === null || score === undefined || isNaN(score)) {
    return '';
  }

  const list = grades && grades.length ? grades : DEFAULT_GRADES;

  for (const grade of list) {
    if (score >= grade.minScore && score <= grade.maxScore) {
      return grade.remark || grade.name;
    }
  }

  return '';
};

const getGradeColor = (gradeName) => {
  const map = {
    'Mastery': 'text-green-600',
    'Proficient': 'text-blue-600',
    'Competent': 'text-yellow-600',
    'Not Yet Competent': 'text-red-600'
  };
  return map[gradeName] || 'text-gray-600';
};

module.exports = {
  DEFAULT_GRADES,
  getGradeFromScore,
  getRemarkFromScore,
  getGradeColor
};