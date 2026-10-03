import React from 'react';
import { Search, CalendarCheck2, BookOpen } from 'lucide-react';
import { getStudentByRef, getStudentName, getClassLabel } from '../utils/formatters';
import { getMarkRule, getConvertedMark } from '../utils/grading';
import MarksRegister from '../components/tables/MarksRegister';
import FinalMarksTable from '../components/tables/FinalMarksTable';

export function EntryView({
  type,
  students,
  teachers = [],
  attendanceRecords = [],
  marks = [],
  allMarks = [],
  searchValue = '',
  setSearchValue,
  classFilter = 'all',
  setClassFilter,
  classOptions = [],
  yearFilter = 'all',
  setYearFilter,
  yearOptions = [],
  setModal,
  onDeleteAttendance,
  onDeleteMark
}) {
  const rows = type === 'attendance' ? attendanceRecords : type === 'marks' ? marks : [];
  const fullMarks = allMarks && allMarks.length > 0 ? allMarks : marks;
  const filteredStudents = classFilter === 'all'
    ? students
    : students.filter((s) => getClassLabel(s) === classFilter);

  return (
    <div className="content">
      <div className="page-title">
        <div>
          <span className="eyebrow">RECORDS</span>
          <h1>{type === 'attendance' ? 'Attendance' : 'Marks & Results'}</h1>
          <p>Use the Add button to create a new record.</p>
        </div>
      </div>

      <div className="toolbar" style={{ marginTop: '6px' }}>
        <div className="search" style={{ maxWidth: '480px' }}>
          <Search size={17} />
          <input
            value={searchValue}
            onChange={(e) => setSearchValue?.(e.target.value)}
            placeholder={type === 'attendance' ? 'Search by name, roll, class, admission or date...' : 'Search by name, roll, class, year, subject, teacher or exam...'}
          />
        </div>
        {type === 'marks' && yearOptions.length > 0 && (
          <select value={yearFilter} onChange={(e) => setYearFilter?.(e.target.value)}>
            <option value="all">All Academic Years</option>
            {yearOptions.map((yr) => <option value={yr} key={yr}>{yr}</option>)}
          </select>
        )}
        <select value={classFilter} onChange={(e) => setClassFilter?.(e.target.value)}>
          <option value="all">All classes</option>
          {classOptions.map((option) => <option value={option} key={option}>{option}</option>)}
        </select>
      </div>

      {type === 'attendance' ? (
        rows.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Class</th>
                  <th>Roll no.</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Session</th>
                  <th>Remarks</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((entry) => {
                  const student = getStudentByRef(entry.studentId, students);
                  const sessionLabel = entry.sessionStatus && entry.sessionStatus !== 'Full Day'
                    ? entry.sessionStatus
                    : entry.attendanceType && entry.attendanceType !== 'Full Day'
                      ? entry.attendanceType
                      : entry.status === 'Half Day'
                        ? 'Half Day'
                        : 'Full Day';
                  return (
                    <tr key={entry.id || `${entry.studentId}-${entry.date}`}>
                      <td>{student ? getStudentName(student) : 'Unknown student'}</td>
                      <td>{student ? getClassLabel(student) : '-'}</td>
                      <td>{student?.rollNumber || '-'}</td>
                      <td>{entry.date ? new Date(entry.date).toLocaleDateString() : '-'}</td>
                      <td>{entry.status || 'Present'}</td>
                      <td>{sessionLabel}</td>
                      <td>{entry.remarks || '-'}</td>
                      <td>
                        <div className="action-group">
                          <button type="button" className="text-button" onClick={() => setModal({ type: 'attendance', record: entry })}>Edit</button>
                          <button type="button" className="text-button danger" onClick={() => onDeleteAttendance(entry.id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon"><CalendarCheck2 /></div>
            <h2>No attendance records yet</h2>
            <p>Track attendance for {students.length} enrolled students.</p>
          </div>
        )
      ) : type === 'marks' ? (
        <>
          {rows.length ? (
            <>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Class</th>
                      <th>Year</th>
                      <th>Roll no.</th>
                      <th>Class teacher</th>
                      <th>Subject teacher</th>
                      <th>Subject</th>
                      <th>Part</th>
                      <th>Exam</th>
                      <th>Obtained marks</th>
                      <th>Converted marks</th>
                      <th>Maximum marks</th>
                      <th>Grade</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((entry) => {
                      const student = getStudentByRef(entry.studentId, students);
                      const classTeacher = entry.classTeacherId && typeof entry.classTeacherId === 'object' ? entry.classTeacherId : teachers.find((item) => item.id === entry.classTeacherId) || null;
                      const subjectTeacher = entry.subjectTeacherId && typeof entry.subjectTeacherId === 'object' ? entry.subjectTeacherId : teachers.find((item) => item.id === entry.subjectTeacherId) || null;
                      const rule = getMarkRule(student ? getClassLabel(student) : entry.className, entry.examType, entry.subject);
                      const obtainedScore = Number(entry.score || 0);
                      const convertedScore = getConvertedMark(entry);
                      const maximumScore = Number(entry.maxScore || rule.maxScore);
                      return (
                        <tr key={entry.id || `${entry.studentId}-${entry.subject}-${entry.examType}`}>
                          <td>{student ? getStudentName(student) : 'Unknown student'}</td>
                          <td>{entry.className || (student ? getClassLabel(student) : '-')}</td>
                          <td><span style={{ fontSize: '11px', background: '#eef3f7', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>{entry.academicYear || '2024-2025'}</span></td>
                          <td>{student?.rollNumber || '-'}</td>
                          <td>{classTeacher ? classTeacher.name : 'Unassigned'}</td>
                          <td>{subjectTeacher ? subjectTeacher.name : 'Unassigned'}</td>
                          <td>{entry.subject || '-'}</td>
                          <td>{entry.part || '-'}</td>
                          <td>{entry.examType || '-'}</td>
                          <td>{obtainedScore}</td>
                          <td>{convertedScore}</td>
                          <td>{maximumScore}</td>
                          <td>{entry.grade || '-'}</td>
                          <td>
                            <div className="action-group">
                              <button type="button" className="text-button" onClick={() => setModal({ type: 'mark', record: entry })}>Edit</button>
                              <button type="button" className="text-button danger" onClick={() => onDeleteMark(entry.id)}>Delete</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <div className="empty-icon"><BookOpen /></div>
              <h2>No marks recorded yet</h2>
              <p>Enter marks for the enrolled students to populate the results table.</p>
            </div>
          )}
          <MarksRegister marks={fullMarks} students={filteredStudents} />
          <FinalMarksTable marks={fullMarks} students={filteredStudents} />
        </>
      ) : (
        <div className="empty-state">
          <div className="empty-icon"><BookOpen /></div>
          <h2>Ready for today’s records</h2>
          <p>Record subject marks with the lecture or topic name and assigned teacher.</p>
        </div>
      )}
    </div>
  );
}

export default EntryView;
