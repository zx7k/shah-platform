import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

const JoinBroadcast = () => {
  const [code, setCode] = useState('');
  const navigate = useNavigate();
  
  const join = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/broadcasts/join-by-code', { code: code.toUpperCase() });
      toast.success('Joined!');
      navigate(`/broadcast/${res.data.channelId}`);
    } catch (err: any) {
      toast.error('Invalid or expired code');
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-dark">
      <form onSubmit={join} className="bg-card-dark p-6 rounded-lg border border-border-dark space-y-4 w-80">
        <h2 className="text-xl font-bold">Join Channel</h2>
        <input
          value={code}
          onChange={e => setCode(e.target.value)}
          placeholder="Invite code"
          className="w-full p-2 rounded bg-dark border border-border-dark text-text-light text-center uppercase tracking-widest"
          required
        />
        <button type="submit" className="w-full bg-primary text-white p-2 rounded font-semibold">Join</button>
      </form>
    </div>
  );
};

export default JoinBroadcast;