import React, { useState } from 'react';
import { X, GraduationCap } from 'lucide-react';
import { getClassLabel, getStudentName } from '../../utils/formatters';
import { getNextClass, getNextAcademicYear } from '../../utils/grading';

export function PromoteModal({ onClose, onPromote, students, initialScope }) {
  const [mode, setMode] = useState(initialScope?.mode || (initialScope?.student ? 'student' : 'all'));
  const [selectedClass, setSelectedClass] = useState(initialScope?.className || '');
  const [selectedStudentId, setSelectedStudentId] = useState(initialScope?.student?.id || initialScope?.student?._id || '');

  const activeStudents = students.filter((s) => s.status !== 'Graduated');
  const classList = Array.from(new Set(activeStudents.map((s) => getClassLabel(s)).filter(Boolean))).sort((a, b) => a.localeCompare(b));

  const activeYear = students.find((s) => s.academicYear && s.status !== 'Graduated')?.academicYear || '2024-2025';
  const defaultNextYear = getNextAcademicYear(activeYear);
  const [targetYear, setTargetYear] = useState(defaultNextYear);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  let eligibleStudents = [];
  if (mode === 'all') {
    eligibleStudents = activeStudents;
  } else if (mode === 'class') {
    eligibleStudents = activeStudents.filter((s) => !selectedClass || getClassLabel(s) === selectedClass);
  } else if (mode === 'student') {
    eligibleStudents = activeStudents.filter((s) => s.id === selectedStudentId || s._id === selectedStudentId);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!targetYear.trim()) {
      setError('Please provide a target academic year.');
      return;
    }
    if (eligibleStudents.length === 0) {
      setError('No active students selected for promotion.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const payload = {
        targetYear: targetYear.trim(),
        scope: mode === 'all' ? 'all' : mode === 'class' ? 'class' : 'selected',
        className: mode === 'class' ? selectedClass : undefined,
        studentIds: mode === 'student' ? [selectedStudentId] : undefined
      };
      await onPromote(payload);
    } catch (err) {
      setError(err.message || 'Promotion failed.');
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <form className="modal" style={{ width: 'min(640px, 100%)' }} onSubmit={handleSubmit}>
        <div className="modal-head">
          <div>
            <span className="eyebrow" style={{ color: '#1237ac' }}>ACADEMIC YEAR PROGRESSION</span>
            <h2>Promote to Next Academic Year</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose}><X size={19} /></button>
        </div>

        <p className="modal-help">
          Advance students to the next class (e.g. 1st &rarr; 2nd, 9th &rarr; 10th, 10th &rarr; Graduated).
          All student details, roll numbers, and admission numbers stay intact. Historical marks are preserved, and a fresh register begins for the new year.
        </p>

        {error && <div className="error" style={{ marginBottom: '10px' }}>{error}</div>}

        <div className="form-row">
          <label>
            Promotion Scope
            <select value={mode} onChange={(e) => setMode(e.target.value)}>
              <option value="all">All Active Students ({activeStudents.length})</option>
              <option value="class">By Specific Class</option>
              {initialScope?.student && <option value="student">Single Student: {getStudentName(initialScope.student)}</option>}
            </select>
          </label>
          <label>
            Target Academic Year
            <input
              type="text"
              value={targetYear}
              onChange={(e) => setTargetYear(e.target.value)}
              placeholder="e.g. 2025-2026"
              required
            />
          </label>
        </div>

        {mode === 'class' && (
          <label>
            Select Class to Promote
            <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} required>
              <option value="">-- Choose Class --</option>
              {classList.map((cls) => (
                <option value={cls} key={cls}>Class {cls} ({activeStudents.filter((s) => getClassLabel(s) === cls).length} students)</option>
              ))}
            </select>
          </label>
        )}

        <div style={{ marginTop: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              Preview: {eligibleStudents.length} student(s) to be updated
            </span>
          </div>

          <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--line)', borderRadius: '8px', background: '#faf9f4' }}>
            {eligibleStudents.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--muted)', fontSize: '12px' }}>
                No active students match this scope.
              </div>
            ) : (
              <table style={{ margin: 0, fontSize: '11px' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '8px 12px' }}>Student</th>
                    <th style={{ padding: '8px 12px' }}>Current Class</th>
                    <th style={{ padding: '8px 12px' }}>Next Class</th>
                    <th style={{ padding: '8px 12px' }}>Roll / Adm</th>
                  </tr>
                </thead>
                <tbody>
                  {eligibleStudents.slice(0, 15).map((s) => {
                    const currentCls = getClassLabel(s);
                    const nextCls = getNextClass(currentCls);
                    const isGrad = nextCls === 'Graduated';
                    return (
                      <tr key={s.id || s._id}>
                        <td style={{ padding: '6px 12px' }}><strong>{getStudentName(s)}</strong></td>
                        <td style={{ padding: '6px 12px' }}>{currentCls}</td>
                        <td style={{ padding: '6px 12px', color: isGrad ? '#b06350' : '#4b8e2d', fontWeight: 600 }}>
                          {nextCls}
                        </td>
                        <td style={{ padding: '6px 12px' }}>{s.rollNumber ? `Roll ${s.rollNumber}` : s.admissionNo}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
          {eligibleStudents.length > 15 && (
            <small style={{ color: 'var(--muted)', fontSize: '10px', marginTop: '4px', display: 'block' }}>
              Showing first 15 of {eligibleStudents.length} students.
            </small>
          )}
        </div>

        <div className="modal-actions" style={{ marginTop: '20px' }}>
          <button type="button" className="outline-button" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="primary-button" disabled={loading || eligibleStudents.length === 0}>
            <GraduationCap size={16} />
            {loading ? 'Promoting...' : `Promote ${eligibleStudents.length} Student(s)`}
          </button>
        </div>
      </form>
    </div>
  );
}

export default PromoteModal;
