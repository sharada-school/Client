import { isPartBMark } from './grading';

export const attendanceOptions = [
  { label: 'Whole day present', value: 'full-day-present', status: 'Present', sessionStatus: 'Full Day' },
  { label: 'Whole day absent', value: 'full-day-absent', status: 'Absent', sessionStatus: 'Full Day' },
  { label: 'Half day: first half present, second half absent', value: 'half-day-am-present-pm-absent', status: 'Half Day', sessionStatus: 'Morning Present / Afternoon Absent' },
  { label: 'Half day: first half absent, second half present', value: 'half-day-am-absent-pm-present', status: 'Half Day', sessionStatus: 'Morning Absent / Afternoon Present' },
  { label: 'Late', value: 'late', status: 'Late', sessionStatus: 'Full Day' }
];

export const getClassLabel = (student) => {
  if (!student) return '';
  if (student.section) return `${student.className || ''} ${student.section}`.trim();
  return student.className || '';
};

export const getStudentName = (student) =>
  `${student ? `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Unknown student' : 'Unknown student'}`;

export const getStudentOptionLabel = (student) => {
  if (!student) return 'Select student';
  const classLabel = getClassLabel(student) || 'Class not set';
  const rollLabel = student.rollNumber ? `Roll ${student.rollNumber}` : 'Roll —';
  return `${getStudentName(student)} · ${classLabel} · ${rollLabel}`;
};

export const getStudentMarks = (student) =>
  Array.isArray(student?.marks) ? student.marks : [];

export const getStudentIdValue = (studentRef) => {
  if (!studentRef) return '';
  if (typeof studentRef === 'object') return studentRef.id || studentRef._id || '';
  return String(studentRef);
};

export const getStudentByRef = (studentRef, students) => {
  if (!studentRef) return null;
  if (typeof studentRef === 'object' && (studentRef.firstName || studentRef.lastName || studentRef.className || studentRef.rollNumber !== undefined)) {
    const directId = getStudentIdValue(studentRef);
    if (directId) {
      return students.find((student) => student.id === directId || student._id === directId) || studentRef;
    }
    return studentRef;
  }

  const directId = getStudentIdValue(studentRef);
  return students.find((student) => student.id === directId || student._id === directId) || null;
};

export const getAttendanceOptionValue = (form) => {
  if (!form) return '';
  const match = attendanceOptions.find((option) => {
    if (!option) return false;
    return option.label === form.attendanceType
      || option.label === form.sessionStatus
      || option.sessionStatus === form.sessionStatus
      || option.status === form.status
      || option.value === form.attendanceType;
  });
  return match?.value || '';
};

export const getStudentAverage = (student) => {
  const marks = getStudentMarks(student).filter((m) => !isPartBMark(m));
  if (!marks.length) return 0;
  const total = marks.reduce((sum, mark) => sum + ((Number(mark.score || 0) / Math.max(Number(mark.maxScore || 100), 1)) * 100), 0);
  return Math.round(total / marks.length);
};

export const getAuditValueText = (values) => Object.entries(values || {})
  .filter(([key, value]) => !['id', 'studentId', 'teacherId', 'classTeacherId', 'subjectTeacherId'].includes(key) && value !== '' && value !== null && value !== undefined)
  .map(([key, value]) => `${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`)
  .join('\n');
