import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

const Broadcasts = () => {
  const [channels, setChannels] = useState < any[] > ([]);
  const [showCreate, setShowCreate] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    api.get('/broadcasts').then(res => setChannels(res.data)).catch(() => {});
  }, []);
  
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const name = (form.elements.namedItem('name') as HTMLInputElement).value;
    const desc = (form.elements.namedItem('description') as HTMLInputElement).value;
    const perm = (form.elements.namedItem('postPermission') as HTMLSelectElement).value;
    try {
      const res = await api.post('/broadcasts', { name, description: desc, postPermission: perm });
      toast.success('Channel created');
      setShowCreate(false);
      navigate(`/broadcast/${res.data.channelId}`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed');
    }
  };
  
  return (
    <div className="min-h-screen bg-dark p-4 max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Broadcast Channels</h1>
        <button onClick={() => setShowCreate(!showCreate)} className="bg-primary px-4 py-2 rounded text-white text-sm">
          + New Channel
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="bg-card-dark p-4 rounded-lg mb-4 space-y-3">
          <input name="name" placeholder="Channel name" className="w-full p-2 rounded bg-dark border border-border-dark text-text-light" required />
          <textarea name="description" placeholder="Description" className="w-full p-2 rounded bg-dark border border-border-dark text-text-light" />
          <select name="postPermission" className="w-full p-2 rounded bg-dark border border-border-dark text-text-light">
            <option value="admin">Only admin can post</option>
            <option value="members">Members can post</option>
          </select>
          <button type="submit" className="bg-primary px-4 py-2 rounded text-white">Create</button>
        </form>
      )}

      <div className="space-y-2">
        {channels.map(ch => (
          <Link key={ch.id} to={`/broadcast/${ch.id}`} className="block bg-card-dark p-4 rounded border border-border-dark hover:border-primary">
            <div className="flex items-center gap-3">
              {ch.avatar && <img src={ch.avatar} className="w-10 h-10 rounded-full" alt="" />}
              <div>
                <h2 className="font-semibold">
                  {ch.name} {ch.isOfficial && <span className="text-xs bg-primary px-1 rounded text-white">Official</span>}
                </h2>
                <p className="text-sm text-text-muted">{ch.description}</p>
              </div>
            </div>
          </Link>
        ))}
        {channels.length === 0 && <p className="text-text-muted text-center">No channels yet.</p>}
      </div>
    </div>
  );
};

export default Broadcasts;