export const examTypes = ['FA1', 'FA2', 'FA3', 'FA4', 'SA1', 'SA2'];

export const subjectsByPart = {
  '1-5': {
    'Part A': ['English', 'Kannada', 'Hindi', 'Mathematics', 'Environmental Studies'],
    'Part B': ['General Knowledge', 'Moral Science']
  },
  '6-10': {
    'Part A': ['English', 'Kannada', 'Hindi', 'Mathematics', 'Science', 'Social'],
    'Part B': ['Computer', 'Physical Education', 'Moral Science', 'Drawing']
  }
};

export const partBNames = ['computer', 'physical education', 'moral science', 'drawing', 'general knowledge'];

export const isPartBMark = (m) =>
  m && (m.part === 'Part B' || partBNames.includes(String(m.subject || '').trim().toLowerCase()));

export const getSubjectParts = (className) => {
  const classNumber = Number.parseInt(String(className).match(/\d+/)?.[0] || '', 10);
  return classNumber >= 1 && classNumber <= 5 ? subjectsByPart['1-5'] : subjectsByPart['6-10'];
};

export const getClassBand = (className) => {
  const classNumber = Number.parseInt(String(className).match(/\d+/)?.[0] || '', 10);
  if (classNumber >= 1 && classNumber <= 5) return '1-5';
  if (classNumber >= 6 && classNumber <= 8) return '6-8';
  return '9-10';
};

export const getMarkRule = (className, examType, subject = '') => {
  const band = getClassBand(className);
  if (examType?.startsWith('FA')) {
    return { maxScore: 25, convertedMaxScore: band === '6-8' ? 10 : 15 };
  }
  if (examType?.startsWith('SA')) {
    const convertedMaxScore = band === '6-8' ? 30 : 20;
    return {
      maxScore: band === '9-10' && subject.toLowerCase() === 'english' ? 100 : band === '9-10' ? 80 : 40,
      convertedMaxScore
    };
  }
  return { maxScore: 25, convertedMaxScore: 15 };
};

export const getConvertedMark = (mark) => {
  if (mark?.convertedScore !== undefined && mark?.convertedScore !== null) return Number(mark.convertedScore);
  const rule = getMarkRule(mark?.className || mark?.studentId?.className, mark?.examType, mark?.subject);
  return Math.round((Number(mark?.score || 0) / Math.max(Number(mark?.maxScore || rule.maxScore), 1)) * rule.convertedMaxScore * 100) / 100;
};

export const getRegisterConvertedMark = (mark) => {
  if (mark && Object.prototype.hasOwnProperty.call(mark, 'convertedScore')) return Number(mark.convertedScore || 0);
  return getConvertedMark(mark);
};

export const getRegisterExamValue = (marks, examType) =>
  marks
    .filter((mark) => mark.examType === examType)
    .reduce((sum, mark) => sum + getRegisterConvertedMark(mark), 0);

export const formatRegisterBreakdown = (values, exams, total) =>
  `(${exams.map((exam) => values[exam]).join(' + ')} = ${total})`;

export const getRegisterGrade = (total, maximum, className) => {
  const classNumber = Number.parseInt(String(className).match(/\d+/)?.[0] || '', 10);
  if (maximum === 50) {
    if (total >= 45) return 'A+';
    if (total >= 35) return 'A';
    if (total >= 25) return 'B+';
    if (total >= 15) return 'B';
    if (total >= 0) return 'C';
    return '-';
  }
  if (classNumber >= 9 && classNumber <= 10) {
    if (total >= 90) return 'A+';
    if (total >= 80) return 'A';
    if (total >= 70) return 'B+';
    if (total >= 60) return 'B';
    if (total >= 50) return 'C+';
    if (total >= 33) return 'C';
    if (total >= 0) return 'NC';
    return '-';
  }
  if (classNumber < 1 || classNumber > 8) return '-';
  if (total >= 90) return 'A+';
  if (total >= 70) return 'A';
  if (total >= 50) return 'B+';
  if (total >= 30) return 'B';
  if (total >= 0) return 'C';
  return '-';
};

export const getFinalGrade = (total, maximum = 500) => {
  const percentage = (Number(total || 0) / Math.max(Number(maximum || 500), 1)) * 100;
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B+';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C+';
  if (percentage >= 40) return 'C';
  return '-';
};

export const getNextClass = (className) => {
  if (!className) return '';
  const str = String(className).trim();
  if (/graduated|alumni|passed/i.test(str)) {
    return 'Graduated';
  }
  const match = str.match(/\d+/);
  if (!match) return str;
  const currentNum = parseInt(match[0], 10);
  if (currentNum >= 10) {
    return 'Graduated';
  }
  const nextNum = currentNum + 1;

  const hasOrdinal = new RegExp(`\\b${currentNum}(st|nd|rd|th)\\b`, 'i').test(str);
  if (hasOrdinal) {
    const getOrdinal = (n) => {
      if (n === 1) return '1st';
      if (n === 2) return '2nd';
      if (n === 3) return '3rd';
      return `${n}th`;
    };
    return str.replace(new RegExp(`\\b${currentNum}(st|nd|rd|th)\\b`, 'i'), getOrdinal(nextNum));
  }

  return str.replace(new RegExp(`\\b${currentNum}\\b`), String(nextNum));
};

export const getNextAcademicYear = (academicYear) => {
  const currentYearStr = String(academicYear || '').trim();
  const match = currentYearStr.match(/(\d{4})[^\d]+(\d{4})/);
  if (match) {
    const y1 = parseInt(match[1], 10) + 1;
    const y2 = parseInt(match[2], 10) + 1;
    return `${y1}-${y2}`;
  }
  const singleMatch = currentYearStr.match(/\d{4}/);
  if (singleMatch) {
    const y = parseInt(singleMatch[0], 10) + 1;
    return `${y}-${y + 1}`;
  }
  const y = new Date().getFullYear();
  return `${y}-${y + 1}`;
};
