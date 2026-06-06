import { useEffect, useState } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const Chats = () => {
  const [chats, setChats] = useState < any[] > ([]);
  const [requests, setRequests] = useState < any > ({ sent: [], received: [] });
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  
  const fetchData = async () => {
    try { setChats((await api.get('/chats')).data); } catch {}
    try { setRequests((await api.get('/friends/requests')).data); } catch {}
  };
  useEffect(() => { fetchData(); }, []);
  
  const sendRequest = async () => {
    if (!search) return;
    try {
      await api.post('/friends/request', { jgId: search.toUpperCase() });
      toast.success('Request sent');
      setSearch('');
    } catch (e: any) { toast.error(e.response?.data?.error); }
  };
  
  const respond = async (id: string, action: string) => {
    await api.post('/friends/respond', { requestId: id, action });
    fetchData();
  };
  
  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Chats</h1>
      <div className="flex gap-2 mb-4">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="JG ID" className="flex-1 p-2 rounded bg-card-dark border border-border-dark" />
        <button onClick={sendRequest} className="bg-primary px-4 py-2 rounded text-white">Add</button>
      </div>
      {requests.received.length > 0 && (
        <div className="mb-4">
          {requests.received.map((r: any) => (
            <div key={r.id} className="flex justify-between bg-card-dark p-2 rounded mb-1">
              <span>From: {r.from}</span>
              <div className="flex gap-2">
                <button onClick={() => respond(r.id, 'accept')} className="text-green-500">Accept</button>
                <button onClick={() => respond(r.id, 'decline')} className="text-red-500">Decline</button>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="space-y-2">
        {chats.map((c: any) => (
          <button key={c.id} onClick={() => navigate(`/chat/${c.id}`)} className="w-full bg-card-dark p-4 rounded border border-border-dark hover:border-primary">
            {c.participants?.length === 2 ? 'Private Chat' : 'Group Chat'}
          </button>
        ))}
      </div>
    </div>
  );
};
export default Chats;