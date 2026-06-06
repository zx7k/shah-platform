import { useEffect, useState } from 'react';
import api from '../../services/api';

const AuditLogs = () => {
  const [logs, setLogs] = useState < any[] > ([]);
  
  useEffect(() => {
    api.get('/admin/audit-logs').then(res => setLogs(res.data)).catch(() => {});
  }, []);
  
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Audit Logs</h1>
      <div className="space-y-2">
        {logs.map(log => (
          <div key={log.id} className="bg-card-dark p-3 rounded text-sm">
            <span className="font-mono text-text-muted">{log.timestamp?.seconds ? new Date(log.timestamp.seconds * 1000).toLocaleString() : ''}</span>
            {' '} <span className="font-semibold">{log.action}</span> by {log.adminId} on {log.target}
            {log.details && <span className="text-text-muted ml-2">{JSON.stringify(log.details)}</span>}
          </div>
        ))}
        {logs.length === 0 && <p className="text-text-muted">No logs yet.</p>}
      </div>
    </div>
  );
};

export default AuditLogs;