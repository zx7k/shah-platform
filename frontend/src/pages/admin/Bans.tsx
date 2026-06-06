import { useEffect, useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const AdminBans = () => {
  const [bans, setBans] = useState < any[] > ([]);
  const [appeals, setAppeals] = useState < any[] > ([]);
  const [newBan, setNewBan] = useState({ userId: '', type: 'chat', reason: '', duration: '1day' });
  
  const fetchData = async () => {
    const res = await api.get('/bans');
    setBans(res.data);
    try { setAppeals((await api.get('/bans/appeals')).data); } catch {}
  };
  
  useEffect(() => { fetchData(); }, []);
  
  const banUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/bans', newBan);
      toast.success('User banned');
      setNewBan({ userId: '', type: 'chat', reason: '', duration: '1day' });
      fetchData();
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed'); }
  };
  
  const unban = async (banId: string) => {
    await api.put(`/bans/${banId}/unban`);
    toast.success('Unbanned');
    fetchData();
  };
  
  const resolveAppeal = async (banId: string, status: string) => {
    await api.put(`/bans/${banId}/appeal`, { status });
    toast.success(`Appeal ${status}`);
    fetchData();
  };
  
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Ban Management</h1>

      {/* Ban Form */}
      <form onSubmit={banUser} className="bg-card-dark p-4 rounded mb-6 space-y-3">
        <h2 className="font-semibold">New Ban</h2>
        <input placeholder="User ID" value={newBan.userId} onChange={e => setNewBan(p => ({ ...p, userId: e.target.value }))} className="w-full p-2 rounded bg-dark border border-border-dark text-text-light" required />
        <select value={newBan.type} onChange={e => setNewBan(p => ({ ...p, type: e.target.value }))} className="w-full p-2 rounded bg-dark border border-border-dark text-text-light">
          <option value="chat">Chat Ban</option>
          <option value="full">Full Ban</option>
          <option value="permanent">Permanent</option>
        </select>
        {newBan.type !== 'permanent' && (
          <select value={newBan.duration} onChange={e => setNewBan(p => ({ ...p, duration: e.target.value }))} className="w-full p-2 rounded bg-dark border border-border-dark text-text-light">
            <option value="1day">1 Day</option>
            <option value="7days">7 Days</option>
            <option value="30days">30 Days</option>
          </select>
        )}
        <input placeholder="Reason" value={newBan.reason} onChange={e => setNewBan(p => ({ ...p, reason: e.target.value }))} className="w-full p-2 rounded bg-dark border border-border-dark text-text-light" required />
        <button type="submit" className="bg-error-red text-white px-4 py-2 rounded">Ban User</button>
      </form>

      {/* Active Bans */}
      <h2 className="font-semibold mb-2">Active Bans</h2>
      {bans.map(b => (
        <div key={b.id} className="bg-card-dark p-3 rounded mb-2 flex justify-between items-center">
          <div>
            <p className="font-medium">{b.userId}</p>
            <p className="text-sm text-text-muted">{b.type} - {b.reason}</p>
          </div>
          <button onClick={() => unban(b.id)} className="text-success-green text-sm">Unban</button>
        </div>
      ))}

      {/* Appeals */}
      {appeals.length > 0 && (
        <>
          <h2 className="font-semibold mt-6 mb-2">Pending Appeals</h2>
          {appeals.map(a => (
            <div key={a.id} className="bg-card-dark p-3 rounded mb-2">
              <p className="font-medium">{a.userId}</p>
              <p className="text-sm text-text-muted">{a.appeal?.message}</p>
              <div className="flex gap-2 mt-1">
                <button onClick={() => resolveAppeal(a.id, 'approved')} className="text-success-green text-sm">Approve</button>
                <button onClick={() => resolveAppeal(a.id, 'rejected')} className="text-error-red text-sm">Reject</button>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
};

export default AdminBans;