import React from 'react';
import { ClipboardList } from 'lucide-react';
import { getAuditValueText } from '../utils/formatters';

export function AuditLogsView({ logs }) {
  return (
    <div className="content">
      <div className="page-title">
        <div>
          <span className="eyebrow">HISTORY</span>
          <h1>Audit Logs</h1>
          <p>Every create and update captured across the administration tabs.</p>
        </div>
      </div>
      {logs.length ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Action</th><th>Tab</th><th>Who updated it</th><th>Record ID</th><th>Values</th><th>Date and time</th></tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td><span className="status-pill">{log.action}</span></td>
                  <td>{log.entity}</td>
                  <td>{log.actorName ? `${log.actorName} · ${log.actorEmail} (${log.actorRole})` : 'Not available for older log'}</td>
                  <td>{log.recordId}</td>
                  <td><pre className="audit-values">{getAuditValueText(log.values) || 'No values recorded'}</pre></td>
                  <td>{log.createdAt ? new Date(log.createdAt).toLocaleString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon"><ClipboardList /></div>
          <h2>No audit logs yet</h2>
          <p>Create or update a record to capture its values here.</p>
        </div>
      )}
    </div>
  );
}

export default AuditLogsView;
