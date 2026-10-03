import React, { useState, useEffect } from 'react';
import { GraduationCap, CalendarCheck2, BarChart3, BookOpen } from 'lucide-react';
import Stat from '../components/common/Stat';
import { getStudentMarks, getClassLabel } from '../utils/formatters';
import { getConvertedMark, getRegisterGrade } from '../utils/grading';

export function StudentDetailView({ student, onBack, onEditStudent, onPromoteStudent, isAdmin }) {
  const allStudentMarks = getStudentMarks(student);
  const currentStudentYear = student.academicYear || '2024-2025';
  const historyYears = (student.academicHistory || []).map((h) => h.academicYear).filter(Boolean);
  const markYears = allStudentMarks.map((m) => m.academicYear).filter(Boolean);
  const availableYears = Array.from(new Set([currentStudentYear, ...historyYears, ...markYears])).filter(Boolean);
  availableYears.sort((a, b) => b.localeCompare(a));

  const [selectedYear, setSelectedYear] = useState(currentStudentYear);

  useEffect(() => {
    setSelectedYear(currentStudentYear);
  }, [student.id, student._id, currentStudentYear]);

  const partBNames = ['computer', 'physical education', 'moral science', 'drawing', 'general knowledge'];
  const isPartB = (m) => m.part === 'Part B' || partBNames.includes(String(m.subject || '').trim().toLowerCase());

  const yearMarks = allStudentMarks.filter((m) => (m.academicYear || '2024-2025') === selectedYear);
  const studentMarks = yearMarks.filter((m) => !isPartB(m));

  const historyEntry = (student.academicHistory || []).find((h) => h.academicYear === selectedYear);
  const effectiveClass = (selectedYear === currentStudentYear)
    ? getClassLabel(student)
    : (historyEntry?.className || yearMarks[0]?.className || getClassLabel(student));

  const average = studentMarks.length
    ? Math.round(studentMarks.reduce((a, m) => a + ((Number(m.score || 0) / Math.max(Number(m.maxScore || 100), 1)) * 100), 0) / studentMarks.length)
    : 0;
  const groupedMarks = studentMarks.reduce((groups, mark) => {
    const exam = mark.examType || 'Other';
    (groups[exam] ||= []).push(mark);
    return groups;
  }, {});
  const subjectRows = Array.from(new Set(studentMarks.map((mark) => mark.subject).filter(Boolean))).map((subject) => {
    const subjectMarks = studentMarks.filter((mark) => mark.subject === subject);
    const findMark = (examType) => subjectMarks.find((mark) => mark.examType === examType);
    const value = (examType) => getConvertedMark(findMark(examType) || { examType, score: 0 });
    const oral = (examType) => Number(findMark(examType)?.oralScore || 0);
    const values = { fa1: value('FA1'), fa2: value('FA2'), sa1: value('SA1'), oralSa1: oral('SA1'), fa3: value('FA3'), fa4: value('FA4'), sa2: value('SA2'), oralSa2: oral('SA2') };
    const finalScore = Object.values(values).reduce((sum, markValue) => sum + markValue, 0);
    const finalGrade = getRegisterGrade(Math.round((finalScore / 100) * 100), 100, effectiveClass);
    return { subject, ...values, finalScore, finalGrade };
  });

  return (
    <div className="content">
      <div className="detail-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '24px' }}>
        <button className="back-button" onClick={onBack} style={{ margin: 0 }}>← Back to students</button>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          <button className="outline-button" onClick={() => onEditStudent(student)}>Edit student</button>
          {isAdmin && student.status !== 'Graduated' && (
            <button className="outline-button" onClick={() => onPromoteStudent?.(student)}>
              <GraduationCap size={15} /> Promote Student
            </button>
          )}
        </div>
      </div>
      <div className="detail-hero">
        <div className="large-avatar">{student.firstName[0]}{student.lastName[0]}</div>
        <div>
          <span className="eyebrow">STUDENT PROFILE</span>
          <h1>{student.firstName} {student.lastName}</h1>
          <p>{student.admissionNo} · Current Class: <strong>{getClassLabel(student)}</strong> · Roll no. {student.rollNumber || '—'}</p>
          {availableYears.length > 1 && (
            <div style={{ marginTop: '9px', fontSize: '11px', color: '#102d77', display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700, color: 'var(--muted)' }}>ACADEMIC JOURNEY:</span>
              {availableYears.slice().reverse().map((yr, idx) => {
                const hist = (student.academicHistory || []).find((h) => h.academicYear === yr);
                const yrMark = allStudentMarks.find((m) => (m.academicYear || '2024-2025') === yr);
                const yrClass = yr === currentStudentYear ? getClassLabel(student) : (hist?.className || yrMark?.className || 'Past Class');
                const isSelected = yr === selectedYear;
                return (
                  <span
                    key={yr}
                    onClick={() => setSelectedYear(yr)}
                    style={{
                      cursor: 'pointer',
                      background: isSelected ? '#1237ac' : '#eef3f7',
                      color: isSelected ? '#fff' : '#102d77',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    title="Click to view this year's exam records"
                  >
                    {yr}: Class {yrClass} {yr === currentStudentYear ? '(Current)' : '✓'}
                    {idx < availableYears.length - 1 && <span style={{ color: 'var(--muted)', marginLeft: '4px' }}>→</span>}
                  </span>
                );
              })}
            </div>
          )}
        </div>
        <span className="status-pill">
          {student.status === 'Graduated' ? 'Graduated' : `Active · ${student.academicYear || '2024-2025'}`}
        </span>
      </div>

      <div className="detail-stats">
        <Stat label="Attendance" value="98%" trend="Excellent" icon={CalendarCheck2} tone="blue" />
        <Stat label="Average mark" value={`${average}%`} trend={studentMarks.length ? 'Calculated' : 'No marks yet'} icon={BarChart3} tone="yellow" />
        <Stat label="Subjects enrolled" value={new Set(studentMarks.map((mark) => mark.subject).filter(Boolean)).size.toString().padStart(2, '0')} trend={selectedYear} icon={BookOpen} tone="coral" />
      </div>

      <div className="section-heading">
        <div>
          <span className="eyebrow">ACADEMIC RECORD ({selectedYear} · Class {effectiveClass})</span>
          <h2>Marks by examination</h2>
        </div>
        {availableYears.length > 1 && (
          <div className="entry-tabs" style={{ margin: 0 }}>
            {availableYears.map((yr) => (
              <button
                key={yr}
                className={selectedYear === yr ? 'active' : ''}
                onClick={() => setSelectedYear(yr)}
              >
                {yr} {yr === currentStudentYear ? '(Current)' : '(Archive)'}
              </button>
            ))}
          </div>
        )}
      </div>

      {subjectRows.length > 0 && (
        <div className="table-wrap student-marks-summary">
          <table>
            <thead><tr><th>Subject</th><th>FA1</th><th>FA2</th><th>SA1</th><th>Oral SA1</th><th>FA3</th><th>FA4</th><th>SA2</th><th>Oral SA2</th><th>Final score</th><th>Grade</th></tr></thead>
            <tbody>{subjectRows.map((row) => (
              <tr key={row.subject}>
                <td><strong>{row.subject}</strong></td><td>{row.fa1}</td><td>{row.fa2}</td><td>{row.sa1}</td><td>{row.oralSa1}</td><td>{row.fa3}</td><td>{row.fa4}</td><td>{row.sa2}</td><td>{row.oralSa2}</td><td>{row.finalScore}</td><td>{row.finalGrade}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {studentMarks.length ? Object.entries(groupedMarks).map(([exam, marks]) => (
        <section className="exam-section" key={exam}>
          <div className="exam-heading">
            <h3>{exam}</h3>
            <span>{marks.length} subject{marks.length === 1 ? '' : 's'}</span>
          </div>
          <div className="marks-grid">
            {marks.map((mark) => (
              <div className="mark-card" key={mark.id || `${exam}-${mark.subject}`}>
                <div className="subject-icon"><BookOpen size={18} /></div>
                <div className="mark-info">
                  <strong>{mark.subject}</strong>
                  <span>{mark.part || 'Part A'}</span>
                  <small>{mark.subjectTeacher?.name || mark.teacher?.name || 'Assigned teacher'}</small>
                </div>
                <div className="mark-score">
                  <strong>{mark.score}</strong>
                  <small>/{mark.maxScore || 100}{mark.examType?.startsWith('SA') ? ` + Oral ${mark.oralScore || 0}/10` : ''}</small>
                  <div className="mini-progress"><span style={{ width: `${((Number(mark.score || 0) / Math.max(Number(mark.maxScore || 100), 1)) * 100)}%` }}></span></div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )) : (
        <div className="empty-state">
          <div className="empty-icon"><BookOpen /></div>
          <h2>No marks recorded for {selectedYear}</h2>
          <p>
            {selectedYear === currentStudentYear
              ? `This student is currently enrolled in Class ${getClassLabel(student)} for session ${selectedYear}. Marks entered for this academic year will appear here.`
              : `No marks found for historical session ${selectedYear}.`}
          </p>
        </div>
      )}
    </div>
  );
}

export default StudentDetailView;
