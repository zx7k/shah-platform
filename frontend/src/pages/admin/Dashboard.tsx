import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const [stats, setStats] = useState < any > (null);
  
  useEffect(() => {
    api.get('/admin/stats').then(res => setStats(res.data)).catch(() => toast.error('Failed'));
  }, []);
  
  if (!stats) return <div className="p-8 text-center">Loading stats...</div>;
  
  return (
    <div className="min-h-screen bg-dark p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {[
          { label: 'Users', value: stats.totalUsers },
          { label: 'Groups', value: stats.totalGroups },
          { label: 'Messages', value: stats.totalMessages },
          { label: 'Pending Reports', value: stats.pendingReports },
          { label: 'Active Bans', value: stats.activeBans },
        ].map(stat => (
          <div key={stat.label} className="bg-card-dark p-4 rounded-lg border border-border-dark text-center">
            <div className="text-2xl font-bold text-primary">{stat.value}</div>
            <div className="text-sm text-text-muted">{stat.label}</div>
          </div>
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <Link to="/admin/reports" className="bg-card-dark p-4 rounded-lg border border-border-dark hover:border-primary">
          <h2 className="text-xl font-semibold">Report Queue</h2>
        </Link>
        <Link to="/admin/bans" className="bg-card-dark p-4 rounded-lg border border-border-dark hover:border-primary">
          <h2 className="text-xl font-semibold">Ban Management</h2>
        </Link>
        <Link to="/admin/users" className="bg-card-dark p-4 rounded-lg border border-border-dark hover:border-primary">
          <h2 className="text-xl font-semibold">User Management</h2>
        </Link>
        <Link to="/admin/audit-logs" className="bg-card-dark p-4 rounded-lg border border-border-dark hover:border-primary">
          <h2 className="text-xl font-semibold">Audit Logs</h2>
        </Link>
      </div>
    </div>
  );
};

export default AdminDashboard;