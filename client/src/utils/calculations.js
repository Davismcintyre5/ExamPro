export const CRNM = 'CRNM';

export const calculateAverage = (scores) => {
  if (!scores || scores.length === 0) return 0;
  
  const validScores = scores.filter(score => 
    score !== null && score !== undefined && !isNaN(score)
  );
  
  if (validScores.length === 0) return 0;
  
  const sum = validScores.reduce((acc, score) => acc + Number(score), 0);
  return sum / validScores.length;
};

export const roundScore = (value) => {
  if (value === null || value === undefined || isNaN(value)) return 0;
  return Math.round(value);
};

export const calculateWeightedScore = (score, weight) => {
  if (!score || !weight) return 0;
  return (Number(score) * Number(weight)) / 100;
};

export const calculateFinalScore = (assignmentAvg, catAvg, examAvg, weights, examType) => {
  let finalScore = 0;
  
  switch (examType) {
    case 'assignment_cat_exam':
      finalScore = calculateWeightedScore(assignmentAvg, weights.assignment) +
                   calculateWeightedScore(catAvg, weights.cat) +
                   calculateWeightedScore(examAvg, weights.exam);
      break;
    case 'cat_exam':
      finalScore = calculateWeightedScore(catAvg, weights.cat) +
                   calculateWeightedScore(examAvg, weights.exam);
      break;
    case 'exam_only':
      finalScore = Number(examAvg) || 0;
      break;
    default:
      finalScore = 0;
  }
  
  return roundScore(finalScore);
};

export const calculateGrade = (score) => {
  if (score >= 70) return 'A';
  if (score >= 60) return 'B';
  if (score >= 50) return 'C';
  if (score >= 40) return 'D';
  return 'F';
};

export const calculateClassAverage = (finalScores) => {
  const numeric = finalScores.filter(s => s !== CRNM);
  if (numeric.length === 0) return 0;
  return roundScore(numeric.reduce((a, b) => a + b, 0) / numeric.length);
};

export const calculatePassRate = (finalScores, passMark = 40) => {
  const numeric = finalScores.filter(s => s !== CRNM);
  if (numeric.length === 0) return 0;
  const passed = numeric.filter(score => score >= passMark).length;
  return Math.round((passed / numeric.length) * 100);
};

export const getRequiredTypes = (examType) => {
  switch (examType) {
    case 'assignment_cat_exam':
      return ['assignment', 'cat', 'exam'];
    case 'cat_exam':
      return ['cat', 'exam'];
    case 'exam_only':
      return ['exam'];
    default:
      return ['assignment', 'cat', 'exam'];
  }
};

export const calculateStudentResults = (course, studentScores) => {
  const requiredTypes = getRequiredTypes(course.examType);
  const unitResults = [];
  let hasCRNM = false;
  
  for (const unit of course.units || []) {
    const unitScores = studentScores.filter(
      s => (s.unitId?._id || s.unitId)?.toString() === unit._id.toString()
    );
    
    let unitTotal = 0;
    let unitHasMissing = false;
    
    for (const type of requiredTypes) {
      const score = unitScores.find(s => s.assessmentType === type);
      
      if (!score) {
        unitHasMissing = true;
        break;
      }
      
      unitTotal += score.score;
    }
    
    if (unitHasMissing) {
      unitResults.push({ 
        unitId: unit._id, 
        unitName: unit.name, 
        unitCode: unit.code,
        total: CRNM 
      });
      hasCRNM = true;
    } else {
      unitResults.push({ 
        unitId: unit._id, 
        unitName: unit.name, 
        unitCode: unit.code,
        total: roundScore(unitTotal) 
      });
    }
  }
  
  let courseFinal = CRNM;
  
  if (!hasCRNM && unitResults.length > 0) {
    const sum = unitResults.reduce((acc, u) => acc + u.total, 0);
    courseFinal = roundScore(sum / unitResults.length);
  }
  
  return {
    unitResults,
    courseFinal
  };
};

export const getGradeFromSettings = (score, settings) => {
  if (score === CRNM) return CRNM;
  
  if (!settings?.grades || settings.grades.length === 0) {
    return calculateGrade(score);
  }
  
  for (const grade of settings.grades) {
    if (score >= grade.minScore && score <= grade.maxScore) {
      return grade.name;
    }
  }
  
  return 'F';
};

export const getGradeColorFromSettings = (grade, settings) => {
  if (grade === CRNM) return 'text-red-600';
  
  const defaultColors = {
    'A': 'text-green-600',
    'B': 'text-blue-600',
    'C': 'text-yellow-600',
    'D': 'text-orange-600',
    'F': 'text-red-600',
  };
  
  if (defaultColors[grade]) return defaultColors[grade];
  
  if (settings?.grades) {
    const foundGrade = settings.grades.find(g => g.name === grade);
    if (foundGrade) {
      if (foundGrade.minScore >= 80) return 'text-green-600';
      if (foundGrade.minScore >= 60) return 'text-blue-600';
      if (foundGrade.minScore >= 40) return 'text-yellow-600';
      return 'text-red-600';
    }
  }
  
  return 'text-gray-600';
};

export const getGradeRemark = (score, settings) => {
  if (score === CRNM) return 'Course Requirements Not Met';
  
  if (!settings?.grades || settings.grades.length === 0) return '';
  
  for (const grade of settings.grades) {
    if (score >= grade.minScore && score <= grade.maxScore) {
      return grade.remark || '';
    }
  }
  
  return '';
};