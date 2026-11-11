export const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateTime = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatScore = (score) => {
  if (score === null || score === undefined || isNaN(score)) return '-';
  return Number(score).toFixed(2);
};

export const formatPercentage = (value) => {
  if (value === null || value === undefined || isNaN(value)) return '-';
  return `${Number(value).toFixed(1)}%`;
};

export const formatGrade = (grade) => {
  const grades = {
    'A': 'text-green-600',
    'B': 'text-blue-600',
    'C': 'text-yellow-600',
    'D': 'text-orange-600',
    'F': 'text-red-600',
  };
  return grades[grade] || 'text-gray-600';
};

export const formatClassName = (className) => {
  return className.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

export const formatExamType = (examType) => {
  const types = {
    'assignment_cat_exam': 'Assignment + CAT + Exam',
    'cat_exam': 'CAT + Exam',
    'exam_only': 'Exam Only',
    'custom': 'Custom',
  };
  return types[examType] || examType;
};