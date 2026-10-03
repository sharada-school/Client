import React from 'react';
import { Users, ShieldCheck, CalendarCheck2, BarChart3 } from 'lucide-react';
import Stat from '../components/common/Stat';
import { getStudentMarks } from '../utils/formatters';
import { isPartBMark } from '../utils/grading';

export function OverviewView({ students, teachers }) {
  const allMarks = students.flatMap((s) => getStudentMarks(s)).filter((m) => !isPartBMark(m));
  const average = allMarks.length
    ? Math.round(allMarks.reduce((a, m) => a + ((Number(m.score || 0) / Math.max(Number(m.maxScore || 100), 1)) * 100), 0) / allMarks.length)
    : 0;

  return (
    <div className="content">
      <div className="page-title">
        <div>
          <span className="eyebrow">DASHBOARD</span>
          <h1>Overview</h1>
          <p>Key metrics and performance summary for Sharada School.</p>
        </div>
      </div>

      <div className="stat-grid">
        <Stat label="Total students" value={students.length.toString().padStart(2, '0')} trend="+8.4%" icon={Users} tone="coral" />
        <Stat label="Teaching staff" value={teachers.length.toString().padStart(2, '0')} trend="+2 new" icon={ShieldCheck} tone="sage" />
        <Stat label="Today's attendance" value="96%" trend="+1.2%" icon={CalendarCheck2} tone="blue" />
        <Stat label="Average performance" value={`${average}%`} trend="+4.6%" icon={BarChart3} tone="yellow" />
      </div>
    </div>
  );
}

export default OverviewView;
