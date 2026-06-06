import { useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const AdminUsers = () => {
  const [search, setSearch] = useState('');
  const [user, setUser] = useState < any > (null);
  
  const lookup = async () => {
    try {
      const res = await api.get(`/users/by-jgid/${search.toUpperCase()}`);
      setUser(res.data);
    } catch { toast.error('Not found'); }
  };
  
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">User Management</h1>
      <div className="flex gap-2 mb-4">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="JG ID" className="flex-1 p-2 rounded bg-dark border border-border-dark text-text-light" />
        <button onClick={lookup} className="bg-primary px-4 py-2 rounded text-white">Search</button>
      </div>
      {user && (
        <div className="bg-card-dark p-4 rounded border border-border-dark">
          <p><span className="font-medium">Name:</span> {user.name}</p>
          <p><span className="font-medium">JG ID:</span> {user.jgId}</p>
          <p><span className="font-medium">Email:</span> {user.email}</p>
          <p><span className="font-medium">Role:</span> {user.role || 'user'}</p>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;