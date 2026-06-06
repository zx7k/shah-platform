import { useEffect, useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const AdminReports = () => {
  const [reports, setReports] = useState < any[] > ([]);
  
  useEffect(() => {
    api.get('/reports').then(res => setReports(res.data)).catch(() => toast.error('Failed'));
  }, []);
  
  const resolve = async (reportId: string, action: string) => {
    await api.put(`/reports/${reportId}/resolve`, { action });
    toast.success(action === 'resolve' ? 'Resolved' : 'Dismissed');
    setReports(prev => prev.filter(r => r.id !== reportId));
  };
  
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Report Queue</h1>
      {reports.map(r => (
        <div key={r.id} className="bg-card-dark p-4 rounded border border-border-dark mb-2">
          <p><strong>{r.category}</strong> - {r.targetType} {r.targetUid && `User: ${r.targetUid}`}</p>
          <p className="text-sm text-text-muted">{r.description}</p>
          <div className="flex gap-2 mt-2">
            <button onClick={() => resolve(r.id, 'resolve')} className="bg-error-red text-white px-3 py-1 rounded text-sm">Resolve</button>
            <button onClick={() => resolve(r.id, 'dismiss')} className="bg-border-dark px-3 py-1 rounded text-sm">Dismiss</button>
          </div>
        </div>
      ))}
      {reports.length === 0 && <p className="text-text-muted">No pending reports.</p>}
    </div>
  );
};

export default AdminReports;