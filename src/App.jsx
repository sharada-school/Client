import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  BookOpen,
  CalendarCheck2,
  ChevronRight,
  ClipboardList,
  GraduationCap,
  LogOut,
  Menu,
  Plus,
  ShieldCheck,
  Users
} from 'lucide-react';
import { readSession, writeSession, clearSession, apiFetch } from './api/client';
import { getClassLabel, getStudentName, getStudentMarks, getStudentByRef } from './utils/formatters';
import { Login } from './components/modals/AuthModals';
import { Modal } from './components/modals/Modal';
import { PromoteModal } from './components/modals/PromoteModal';
import { OverviewView } from './views/OverviewView';
import { StudentsView } from './views/StudentsView';
import { StudentDetailView } from './views/StudentDetailView';
import { EntryView } from './views/EntryView';
import { TeachersView } from './views/TeachersView';
import { AuditLogsView } from './views/AuditLogsView';

export function App() {
  const [user, setUser] = useState(() => {
    const activeSession = readSession();
    return activeSession?.user || null;
  });
  const [view, setView] = useState('overview');
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [marks, setMarks] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [attendanceQuery, setAttendanceQuery] = useState('');
  const [attendanceClassFilter, setAttendanceClassFilter] = useState('all');
  const [marksQuery, setMarksQuery] = useState('');
  const [marksClassFilter, setMarksClassFilter] = useState('all');
  const [marksYearFilter, setMarksYearFilter] = useState('all');
  const [modal, setModal] = useState(null);
  const [notice, setNotice] = useState('');

  const refreshDashboard = async () => {
    try {
      const [dashboardRes, teachersRes, attendanceRes, marksRes, auditLogsRes] = await Promise.all([
        apiFetch('/api/dashboard', {}, user),
        apiFetch('/api/teachers', {}, user),
        apiFetch('/api/attendance', {}, user),
        apiFetch('/api/marks', {}, user),
        apiFetch('/api/audit-logs', {}, user)
      ]);

      const dashboardData = dashboardRes.ok ? await dashboardRes.json() : null;
      const teacherData = teachersRes.ok ? await teachersRes.json() : null;
      const attendanceData = attendanceRes.ok ? await attendanceRes.json() : [];
      const markData = marksRes.ok ? await marksRes.json() : [];
      const auditLogData = auditLogsRes.ok ? await auditLogsRes.json() : [];

      if (dashboardData?.students) setStudents(dashboardData.students);
      if (teacherData) setTeachers(teacherData);
      if (attendanceData) setAttendanceRecords(attendanceData);
      if (markData) setMarks(markData);
      if (auditLogData) setAuditLogs(auditLogData);
    } catch {
      // Ignore refresh failures and keep the current UI state
    }
  };

  useEffect(() => {
    if (user) refreshDashboard();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const checkSession = () => {
      const activeSession = readSession();
      if (!activeSession) {
        setUser(null);
        return;
      }
    };

    const timer = setInterval(checkSession, 60000);
    return () => clearInterval(timer);
  }, [user]);

  const handleLogin = (userData) => {
    writeSession(userData);
    setUser(userData);
  };

  const handleLogout = () => {
    clearSession();
    setUser(null);
  };

  if (!user) return <Login onLogin={handleLogin} />;

  const classOptions = Array.from(new Set(students.map((student) => getClassLabel(student)).filter(Boolean))).sort((a, b) => a.localeCompare(b));

  const filtered = students.filter((student) => {
    const combinedText = `${student.firstName} ${student.lastName} ${student.admissionNo} ${student.rollNumber || ''} ${getClassLabel(student)}`.toLowerCase();
    const matchesQuery = combinedText.includes(query.toLowerCase());
    const matchesClass = classFilter === 'all' || getClassLabel(student) === classFilter;
    return matchesQuery && matchesClass;
  });

  const attendanceRows = (attendanceRecords || []).filter((entry) => {
    const student = getStudentByRef(entry.studentId, students);
    const matchesClass = attendanceClassFilter === 'all' || (student ? getClassLabel(student) === attendanceClassFilter : false);
    const text = `${student ? getStudentName(student) : ''} ${student?.rollNumber || ''} ${student ? getClassLabel(student) : ''} ${student?.admissionNo || ''} ${entry.status || ''} ${entry.date || ''}`.toLowerCase();
    return matchesClass && text.includes(attendanceQuery.toLowerCase());
  });

  const marksYearOptions = Array.from(new Set(marks.map((m) => m.academicYear || '2024-2025'))).filter(Boolean).sort().reverse();

  const markRows = (marks || []).filter((entry) => {
    const student = getStudentByRef(entry.studentId, students);
    const teacher = entry.teacherId && typeof entry.teacherId === 'object' ? entry.teacherId : teachers.find((item) => item.id === entry.teacherId) || null;
    const entryClass = entry.className || (student ? getClassLabel(student) : '');
    const entryYear = entry.academicYear || '2024-2025';
    const matchesClass = marksClassFilter === 'all' || entryClass === marksClassFilter || (student && getClassLabel(student) === marksClassFilter);
    const matchesYear = marksYearFilter === 'all' || entryYear === marksYearFilter;
    const text = `${student ? getStudentName(student) : ''} ${student?.rollNumber || ''} ${entryClass} ${entryYear} ${student?.admissionNo || ''} ${entry.subject || ''} ${entry.examType || ''} ${entry.grade || ''} ${teacher ? teacher.name : ''}`.toLowerCase();
    return matchesClass && matchesYear && text.includes(marksQuery.toLowerCase());
  });

  const openStudent = async (student) => {
    try {
      const response = await apiFetch(`/api/students/${student.id || student._id}`, {}, user);
      if (response.ok) {
        const detail = await response.json();
        setSelected({ ...student, ...detail, marks: detail.marks || getStudentMarks(student) });
        setView('student');
        return;
      }
    } catch {
      // Fall back to the already loaded student data if the detail fetch fails.
    }

    setSelected({ ...student, marks: getStudentMarks(student) });
    setView('student');
  };

  const saveRecord = async (type, payload) => {
    try {
      const mode = payload?.id ? 'PUT' : 'POST';
      const isEditingStudent = type === 'students' && payload?.id;
      const isEditingAttendance = type === 'attendance' && payload?.id;
      const isEditingMark = type === 'marks' && payload?.id;
      const isEditingTeacher = type === 'teachers' && payload?.id;
      const response = await apiFetch(`/api/${type}${isEditingStudent || isEditingAttendance || isEditingMark || isEditingTeacher ? `/${payload.id}` : ''}`, {
        method: mode,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }, user);

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}));
        if (response.status === 401) {
          clearSession();
          setUser(null);
        }
        throw new Error(errorPayload.error || `Save failed (${response.status})`);
      }

      const created = await response.json();

      if (type === 'students') {
        setStudents((prev) => {
          const next = [created, ...prev.filter((student) => student.id !== created.id)];
          return next;
        });
        if (selected && selected.id === created.id) {
          setSelected({ ...selected, ...created, marks: selected.marks || [] });
        }
      }

      if (type === 'teachers') {
        setTeachers((prev) => {
          const next = [created, ...prev.filter((teacher) => teacher.id !== created.id)];
          return next;
        });
      }

      if (type === 'attendance') {
        setAttendanceRecords((prev) => {
          const next = [created, ...prev.filter((item) => item.id !== created.id)];
          return next;
        });
      }

      if (type === 'marks') {
        setMarks((prev) => {
          const next = [created, ...prev.filter((item) => item.id !== created.id)];
          return next;
        });
      }

      await refreshDashboard();
      setNotice(`${type[0].toUpperCase() + type.slice(1)} saved successfully`);
    } catch (error) {
      setNotice(error.message || 'Save failed. Please review the details and try again.');
    }
    setModal(null);
    setTimeout(() => setNotice(''), 2600);
  };

  const deleteAttendance = async (attendanceId) => {
    try {
      const response = await apiFetch(`/api/attendance/${attendanceId}`, { method: 'DELETE' }, user);
      if (!response.ok) throw new Error('Delete failed');

      setAttendanceRecords((prev) => prev.filter((item) => item.id !== attendanceId));
      await refreshDashboard();
      setNotice('Attendance deleted successfully');
    } catch {
      setNotice('Unable to delete attendance');
    }
    setTimeout(() => setNotice(''), 2600);
  };

  const deleteMark = async (markId) => {
    try {
      const response = await apiFetch(`/api/marks/${markId}`, { method: 'DELETE' }, user);
      if (!response.ok) throw new Error('Delete failed');

      setMarks((prev) => prev.filter((item) => item.id !== markId));
      await refreshDashboard();
      setNotice('Marks deleted successfully');
    } catch {
      setNotice('Unable to delete marks');
    }
    setTimeout(() => setNotice(''), 2600);
  };

  const deleteTeacher = async (teacherId) => {
    try {
      const response = await apiFetch(`/api/teachers/${teacherId}`, { method: 'DELETE' }, user);
      if (!response.ok) throw new Error('Delete failed');

      setTeachers((prev) => prev.filter((teacher) => teacher.id !== teacherId));
      await refreshDashboard();
      setNotice('Teacher deleted successfully');
    } catch {
      setNotice('Unable to delete teacher');
    }
    setTimeout(() => setNotice(''), 2600);
  };

  const handlePromoteStudents = async (payload) => {
    try {
      const response = await apiFetch('/api/students/promote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }, user);

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}));
        throw new Error(errorPayload.error || 'Promotion failed');
      }

      const result = await response.json();
      await refreshDashboard();
      if (selected) {
        const updatedRes = await apiFetch(`/api/students/${selected.id || selected._id}`, {}, user);
        if (updatedRes.ok) {
          const updated = await updatedRes.json();
          setSelected(updated);
        }
      }
      setNotice(`Successfully promoted ${result.promotedCount || 0} student(s) to ${result.targetYear}!`);
    } catch (error) {
      setNotice(error.message || 'Promotion failed. Please try again.');
    }
    setModal(null);
    setTimeout(() => setNotice(''), 3200);
  };

  const currentAcademicYear = students.find((s) => s.academicYear && s.status !== 'Graduated')?.academicYear
    || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <img className="brand-logo" src={`${import.meta.env.BASE_URL}logo.svg`} alt="Sharada School logo" />
          <span>Sharada <b>School</b></span>
        </div>
        <div className="school-year">ADMINISTRATION <span>{currentAcademicYear}</span></div>
        <nav>
          {[['overview', 'Overview', BarChart3], ['students', 'Students', Users], ['attendance', 'Attendance', CalendarCheck2], ['marks', 'Marks & Results', BookOpen], ['teachers', 'Teachers', ShieldCheck], ['logs', 'Audit Logs', ClipboardList]].filter(([id]) => user.role === 'admin' || !['students', 'teachers', 'logs'].includes(id)).map(([id, label, Icon]) => (
            <button key={id} className={view === id ? 'active' : ''} onClick={() => { setView(id); setSelected(null); }}>
              <Icon size={18} />
              {label}
              {id === 'students' && <span className="nav-count">{students.length}</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="avatar">{user.name.substring(0, 2)}</div>
          <div>
            <strong>{user.name}</strong>
          </div>
          <button className="icon-button" title="Log out" onClick={handleLogout}><LogOut size={16} /></button>
        </div>
      </aside>

      <main className="main">
        <header>
          <button className="mobile-menu icon-button"><Menu size={20} /></button>
          <div className="breadcrumb">
            Sharada School <ChevronRight size={14} /> <span>{selected ? `${selected.firstName} ${selected.lastName}` : view === 'overview' ? 'Overview' : view[0].toUpperCase() + view.slice(1)}</span>
          </div>
          <div className="header-actions">
            {user.role === 'admin' && (view === 'students' || view === 'overview') && (
              <button className="outline-button" onClick={() => setModal({ type: 'promote', mode: 'all' })}>
                <GraduationCap size={15} /> Promote to Next Year
              </button>
            )}
            {view !== 'logs' && (user.role === 'admin' || !['students', 'teachers'].includes(view)) && <button className="primary-button" onClick={() => setModal(view === 'teachers' ? 'teacher' : view === 'attendance' ? 'attendance' : view === 'marks' ? 'mark' : 'student')}>
              <Plus size={16} /> Add {view === 'teachers' ? 'teacher' : view === 'attendance' ? 'attendance' : view === 'marks' ? 'marks' : 'student'}
            </button>}
          </div>
        </header>

        {notice && <div className="toast">{notice}</div>}

        {selected ? (
          <StudentDetailView
            student={selected}
            onBack={() => { setSelected(null); setView('students'); }}
            onEditStudent={(student) => setModal({ type: 'student', record: student })}
            onPromoteStudent={(student) => setModal({ type: 'promote', mode: 'student', student })}
            isAdmin={user.role === 'admin'}
          />
        ) : view === 'overview' ? (
          <OverviewView students={students} teachers={teachers} onStudent={openStudent} setView={setView} />
        ) : view === 'students' ? (
          <StudentsView
            students={filtered}
            query={query}
            setQuery={setQuery}
            onStudent={openStudent}
            classOptions={classOptions}
            classFilter={classFilter}
            setClassFilter={setClassFilter}
            onPromoteClass={(cls) => setModal({ type: 'promote', mode: 'class', className: cls })}
            isAdmin={user.role === 'admin'}
          />
        ) : view === 'attendance' ? (
          <EntryView
            type="attendance"
            students={students}
            attendanceRecords={attendanceRows}
            searchValue={attendanceQuery}
            setSearchValue={setAttendanceQuery}
            classFilter={attendanceClassFilter}
            setClassFilter={setAttendanceClassFilter}
            classOptions={classOptions}
            setModal={setModal}
            onDeleteAttendance={deleteAttendance}
          />
        ) : view === 'marks' ? (
          <EntryView
            type="marks"
            students={students}
            teachers={teachers}
            marks={markRows}
            allMarks={marks}
            searchValue={marksQuery}
            setSearchValue={setMarksQuery}
            classFilter={marksClassFilter}
            setClassFilter={setMarksClassFilter}
            classOptions={classOptions}
            yearFilter={marksYearFilter}
            setYearFilter={setMarksYearFilter}
            yearOptions={marksYearOptions}
            setModal={setModal}
            onDeleteMark={deleteMark}
          />
        ) : view === 'teachers' ? (
          <TeachersView
            teachers={teachers}
            onEditTeacher={(teacher) => setModal({ type: 'teacher', record: teacher })}
            onDeleteTeacher={deleteTeacher}
          />
        ) : view === 'logs' ? (
          <AuditLogsView logs={auditLogs} />
        ) : null}

        {modal?.type === 'promote' ? (
          <PromoteModal
            onClose={() => setModal(null)}
            onPromote={handlePromoteStudents}
            students={students}
            initialScope={modal}
          />
        ) : modal ? (
          <Modal
            type={modal.type || modal}
            onClose={() => setModal(null)}
            onSave={saveRecord}
            onRefresh={refreshDashboard}
            user={user}
            students={students}
            teachers={teachers}
            attendanceItem={modal?.record || null}
            studentItem={modal?.type === 'student' ? modal.record : null}
            markItem={modal?.type === 'mark' ? modal.record : null}
            teacherItem={modal?.type === 'teacher' ? modal.record : null}
          />
        ) : null}
      </main>
    </div>
  );
}

export default App;
