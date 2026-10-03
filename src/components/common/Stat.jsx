import React from 'react';

export function Stat({ label, value, trend, icon: Icon, tone }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${tone}`}><Icon size={19} /></div>
      <span className="stat-label">{label}</span>
      <strong className="stat-value">{value}</strong>
      <span className="stat-trend">{trend} <small>this month</small></span>
    </div>
  );
}

export default Stat;
