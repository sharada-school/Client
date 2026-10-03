import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { subjectsByPart, getClassBand, getFinalGrade } from '../../utils/grading';
import { getStudentIdValue, getClassLabel, getStudentName } from '../../utils/formatters';

export function FinalMarksTable({ marks, students }) {
  const [sectionSearch, setSectionSearch] = useState({});
  const [sectionDraft, setSectionDraft] = useState({});

  const getRows = (band) => {
    const subjects = band === '1-5' ? subjectsByPart['1-5']['Part A'] : subjectsByPart['6-10']['Part A'];
    return students
      .filter((student) => getClassBand(getClassLabel(student)) === band)
      .map((student) => {
        const classNumber = Number.parseInt(String(getClassLabel(student)).match(/\d+/)?.[0] || '', 10);
        const studentMarks = marks.filter((mark) => {
          if (getStudentIdValue(mark.studentId) !== getStudentIdValue(student)) return false;
          const markNum = String(mark.className || '').match(/\d+/)?.[0];
          const studentNum = String(student.className || '').match(/\d+/)?.[0];
          if (markNum && studentNum && markNum !== studentNum) return false;
          return true;
        });

        const subjectBreakdowns = [];
        const subjectValues = subjects.map((subject) => {
          const subjectMarks = studentMarks.filter((mark) => {
            const mSub = String(mark.subject || '').trim().toLowerCase();
            const targetSub = String(subject).trim().toLowerCase();
            if (mSub === targetSub) return true;
            if (targetSub === 'social' && mSub.includes('social')) return true;
            if (targetSub === 'environmental studies' && (mSub.includes('environ') || mSub === 'evs')) return true;
            return false;
          });

          if (classNumber >= 9 && classNumber <= 10) {
            const sa2 = subjectMarks.find((mark) => mark.examType === 'SA2') || subjectMarks.find((mark) => mark.examType === 'SA1');
            const sa2Score = Number(sa2?.score || 0);
            const isEnglish = subject.toLowerCase() === 'english';
            const rawMax = Number(sa2?.maxScore) || (isEnglish ? 100 : 80);
            const convertedMax = rawMax === 100 || isEnglish ? 125 : 100;
            const convertedScore = sa2
              ? Math.min(Math.round(((sa2Score / (rawMax || (convertedMax === 125 ? 100 : 80))) * convertedMax) * 100) / 100, convertedMax)
              : 0;
            subjectBreakdowns.push(sa2 ? `SA2: ${sa2Score}/${rawMax} (${convertedScore}/${convertedMax})` : 'Pending');
            return convertedScore;
          }

          const sa1 = subjectMarks.find((mark) => mark.examType === 'SA1');
          const sa2 = subjectMarks.find((mark) => mark.examType === 'SA2');
          const sa1Score = Number(sa1?.score || 0);
          const oralSa1 = Number(sa1?.oralScore || 0);
          const sa2Score = Number(sa2?.score || 0);
          const oralSa2 = Number(sa2?.oralScore || 0);
          const total = Math.min(sa1Score + oralSa1 + sa2Score + oralSa2, 100);
          subjectBreakdowns.push(`SA1: ${sa1Score}+${oralSa1} | SA2: ${sa2Score}+${oralSa2}`);
          return total;
        });

        const total = Math.round(subjectValues.reduce((sum, value) => sum + value, 0) * 100) / 100;
        return {
          student,
          subjects,
          subjectValues,
          subjectBreakdowns,
          total,
          maximum: classNumber >= 9 && classNumber <= 10 ? 625 : subjects.length * 100
        };
      });
  };

  const renderBandTable = (label, band) => {
    const query = (sectionSearch[band] || '').toLowerCase();
    const rows = getRows(band).filter(({ student }) =>
      `${getStudentName(student)} ${student.rollNumber || ''} ${student.admissionNo || ''} ${getClassLabel(student)}`
        .toLowerCase()
        .includes(query)
    );
    const bandDescription = band === '1-5'
      ? 'Each subject: SA1 + Oral marks = 50, SA2 + Oral marks = 50 · Total subjects: 5 · Total marks: 500 (Part B excluded)'
      : band === '6-8'
        ? 'Each subject: SA1 + Oral marks = 50, SA2 + Oral marks = 50 · Total subjects: 6 · Total marks: 600 (Part B excluded)'
        : 'English total marks: 125 (converted from 100) · Other subjects: 100 (converted from 80) · Calculation: SA2 · Total subjects: 6 · Total marks: 625 (Part B excluded)';

    return (
      <section className="final-band" key={label}>
        <div className="final-band-heading">
          <div><h3>{label}</h3><p className="final-band-description">{bandDescription}</p></div>
          <div className="search final-band-search">
            <Search size={16} />
            <input
              value={sectionDraft[band] || ''}
              placeholder="Search student..."
              onChange={(event) => setSectionDraft((previous) => ({ ...previous, [band]: event.target.value }))}
            />
            <button
              type="button"
              className="text-button"
              onClick={() => setSectionSearch((previous) => ({ ...previous, [band]: sectionDraft[band] || '' }))}
            >
              Search
            </button>
          </div>
        </div>
        {rows.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Roll no.</th>
                  <th>Register no.</th>
                  <th>Student name</th>
                  {rows[0].subjects.map((subject) => <th key={subject}>{subject}</th>)}
                  <th>Total marks</th>
                  <th>Grade</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ student, subjectValues, subjectBreakdowns, total, maximum, subjects }) => (
                  <tr key={student.id || student._id}>
                    <td>{student.rollNumber || '-'}</td>
                    <td>{student.admissionNo || '-'}</td>
                    <td>{getStudentName(student)}</td>
                    {subjectValues.map((value, index) => (
                      <td key={subjects[index]} style={{ whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: 600, fontSize: '13px', color: '#1e293b' }}>{value}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{subjectBreakdowns[index]}</div>
                      </td>
                    ))}
                    <td><strong>{total}</strong> / {maximum}</td>
                    <td>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        fontSize: '12px',
                        fontWeight: 700,
                        backgroundColor: total / maximum >= 0.8 ? '#dcfce7' : total / maximum >= 0.6 ? '#e0f2fe' : '#fef3c7',
                        color: total / maximum >= 0.8 ? '#15803d' : total / maximum >= 0.6 ? '#0369a1' : '#b45309'
                      }}>
                        {getFinalGrade(total, maximum)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state" style={{ padding: '24px' }}>
            <p>No students enrolled in this section band or matching the search.</p>
          </div>
        )}
      </section>
    );
  };

  return (
    <section className="marks-register final-marks-table">
      <div className="section-heading">
        <div><span className="eyebrow">FINAL SUMMARY</span><h2>Final Marks with Grade</h2></div>
      </div>
      {renderBandTable('Classes 1 to 5', '1-5')}
      {renderBandTable('Classes 6 to 8', '6-8')}
      {renderBandTable('Classes 9 and 10', '9-10')}
    </section>
  );
}

export default FinalMarksTable;
