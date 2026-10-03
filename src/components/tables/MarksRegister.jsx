import React from 'react';
import { getStudentIdValue, getClassLabel, getStudentName } from '../../utils/formatters';
import { getRegisterExamValue, getRegisterGrade, formatRegisterBreakdown } from '../../utils/grading';

export function MarksRegister({ marks, students }) {
  const registerRows = students
    .flatMap((student) => {
      const studentMarks = marks.filter((mark) => {
        if (getStudentIdValue(mark.studentId) !== getStudentIdValue(student)) return false;
        const markClassNum = String(mark.className || '').match(/\d+/)?.[0];
        const studentClassNum = String(student.className || '').match(/\d+/)?.[0];
        if (markClassNum && studentClassNum && markClassNum !== studentClassNum) return false;
        return true;
      });
      const partBNames = ['computer', 'physical education', 'moral science', 'drawing', 'general knowledge'];
      const partASubjectMarks = studentMarks.filter((mark) => (mark.part || 'Part A') === 'Part A' && !partBNames.includes(String(mark.subject || '').trim().toLowerCase()));
      const subjects = Array.from(new Set(partASubjectMarks.map((mark) => mark.subject).filter(Boolean)));
      return subjects.map((subject) => {
        const subjectMarks = partASubjectMarks.filter((mark) => mark.subject === subject);
        const values = ['FA1', 'FA2', 'SA1', 'FA3', 'FA4', 'SA2'].reduce((result, exam) => {
          result[exam] = getRegisterExamValue(subjectMarks, exam);
          return result;
        }, {});
        const firstTotal = values.FA1 + values.FA2 + values.SA1;
        const secondTotal = values.FA3 + values.FA4 + values.SA2;
        const oralSa1Total = subjectMarks.filter((mark) => mark.examType === 'SA1').reduce((sum, mark) => sum + Number(mark.oralScore || 0), 0);
        const oralSa2Total = subjectMarks.filter((mark) => mark.examType === 'SA2').reduce((sum, mark) => sum + Number(mark.oralScore || 0), 0);
        const total = firstTotal + secondTotal;
        return {
          student,
          subject,
          values,
          firstTotal,
          secondTotal,
          oralSa1Total,
          oralSa2Total,
          total,
          firstGrade: getRegisterGrade(firstTotal, 50, getClassLabel(student)),
          secondGrade: getRegisterGrade(secondTotal, 50, getClassLabel(student)),
          totalGrade: getRegisterGrade(total, 100, getClassLabel(student))
        };
      });
    })
    .flat();

  return (
    <section className="marks-register">
      <div className="section-heading">
        <div><span className="eyebrow">SUMMARY</span><h2>Marks Register</h2></div>
      </div>
      <div className="table-wrap">
        {registerRows.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Roll no.</th>
                <th>Register no.</th>
                <th>Student name</th>
                <th>Subject</th>
                <th>First half year<br />(FA1 + FA2 + SA1 = 50)</th>
                <th>Oral SA1</th>
                <th>Grade</th>
                <th>Second half year<br />(FA3 + FA4 + SA2 = 50)</th>
                <th>Oral SA2</th>
                <th>Grade</th>
                <th>Total<br />(First half year + second half year)</th>
                <th>Grade</th>
              </tr>
            </thead>
            <tbody>
              {registerRows.map(({ student, subject, values, firstTotal, secondTotal, oralSa1Total, oralSa2Total, total, firstGrade, secondGrade, totalGrade }) => (
                <tr key={`${student.id || student._id}-${subject}`}>
                  <td>{student.rollNumber || '-'}</td>
                  <td>{student.admissionNo || '-'}</td>
                  <td>{getStudentName(student)}</td>
                  <td><strong>{subject}</strong></td>
                  <td>{formatRegisterBreakdown(values, ['FA1', 'FA2', 'SA1'], firstTotal)}</td>
                  <td>{oralSa1Total}</td>
                  <td><strong>{firstGrade}</strong></td>
                  <td>{formatRegisterBreakdown(values, ['FA3', 'FA4', 'SA2'], secondTotal)}</td>
                  <td>{oralSa2Total}</td>
                  <td><strong>{secondGrade}</strong></td>
                  <td><strong style={{ fontSize: '14px' }}>{total}</strong></td>
                  <td>
                    <span style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      fontSize: '12px',
                      fontWeight: 700,
                      backgroundColor: total >= 80 ? '#dcfce7' : total >= 60 ? '#e0f2fe' : '#fef3c7',
                      color: total >= 80 ? '#15803d' : total >= 60 ? '#0369a1' : '#b45309'
                    }}>
                      {totalGrade}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state" style={{ padding: '24px' }}>
            <p>No marks registered for the current selection.</p>
          </div>
        )}
      </div>
    </section>
  );
}

export default MarksRegister;
