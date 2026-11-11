const calculateAverage = (scores) => {
  if (!scores || scores.length === 0) return 0;
  
  const validScores = scores.filter(score => 
    score !== null && score !== undefined && !isNaN(score)
  );
  
  if (validScores.length === 0) return 0;
  
  const sum = validScores.reduce((acc, score) => acc + Number(score), 0);
  return sum / validScores.length;
};

const roundScore = (value) => {
  if (value === null || value === undefined || isNaN(value)) return 0;
  return Math.round(value);
};

const calculateWeightedScore = (score, weight) => {
  if (!score || !weight) return 0;
  return (Number(score) * Number(weight)) / 100;
};

const calculateFinalScore = (assignmentAvg, catAvg, examAvg, weights, examType) => {
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
    case 'custom':
      finalScore = Number(examAvg) || 0;
      break;
    default:
      finalScore = 0;
  }
  
  return roundScore(finalScore);
};

const calculateGrade = (score) => {
  if (score >= 70) return 'A';
  if (score >= 60) return 'B';
  if (score >= 50) return 'C';
  if (score >= 40) return 'D';
  return 'F';
};

const calculateClassAverage = (finalScores) => {
  return roundScore(calculateAverage(finalScores));
};

const calculatePassRate = (finalScores, passMark = 40) => {
  if (!finalScores || finalScores.length === 0) return 0;
  
  const passed = finalScores.filter(score => score >= passMark).length;
  return Math.round((passed / finalScores.length) * 100);
};

const groupScoresByType = (course, scores) => {
  const assignmentScores = [];
  const catScores = [];
  const examScores = [];
  
  scores.forEach((score) => {
    if (score.assessmentType === 'assignment') assignmentScores.push(score.score);
    else if (score.assessmentType === 'cat') catScores.push(score.score);
    else if (score.assessmentType === 'exam') examScores.push(score.score);
  });
  
  return { assignmentScores, catScores, examScores };
};

const calculateStudentFinalScore = (course, studentScores) => {
  const { assignmentScores, catScores, examScores } = groupScoresByType(course, studentScores);
  
  const assignmentAvg = calculateAverage(assignmentScores);
  const catAvg = calculateAverage(catScores);
  const examAvg = calculateAverage(examScores);
  
  const finalScore = calculateFinalScore(
    assignmentAvg,
    catAvg,
    examAvg,
    course.weights,
    course.examType
  );
  
  return {
    assignmentAvg: roundScore(assignmentAvg),
    catAvg: roundScore(catAvg),
    examAvg: roundScore(examAvg),
    finalScore,
  };
};

module.exports = {
  calculateAverage,
  roundScore,
  calculateWeightedScore,
  calculateFinalScore,
  calculateGrade,
  calculateClassAverage,
  calculatePassRate,
  groupScoresByType,
  calculateStudentFinalScore,
};