import React from 'react';

export function TeachersView({ teachers, onEditTeacher, onDeleteTeacher }) {
  return (
    <div className="content">
      <div className="page-title">
        <div>
          <span className="eyebrow">FACULTY DIRECTORY</span>
          <h1>Teachers</h1>
          <p>Keep teacher contact information current.</p>
        </div>
      </div>
      <div className="teacher-grid">
        {teachers.map((teacher, i) => (
          <div className="teacher-card" key={teacher.id}>
            <div className={`teacher-avatar t${i}`}>{teacher.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}</div>
            <h3>{teacher.name}</h3>
            <div className="teacher-meta"><span>Email</span><strong>{teacher.email || 'Not provided'}</strong></div>
            <div className="action-group" style={{ marginTop: '16px' }}>
              <button type="button" className="text-button" onClick={() => onEditTeacher(teacher)}>Edit</button>
              <button type="button" className="text-button danger" onClick={() => onDeleteTeacher(teacher.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TeachersView;
