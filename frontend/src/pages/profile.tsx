import { useEffect, useState } from 'react';
import api from '../services/api';
import { openUploadWidget } from '../services/cloudinary';
import toast from 'react-hot-toast';

const Profile = () => {
  const [profile, setProfile] = useState < any > (null);
  const [name, setName] = useState('');
  const [status, setStatus] = useState('');
  const [avatar, setAvatar] = useState('');
  
  useEffect(() => {
    api.get('/users/me').then((res) => {
      setProfile(res.data);
      setName(res.data.name || '');
      setStatus(res.data.status || '');
      setAvatar(res.data.avatar || '');
    }).catch(() => toast.error('Failed'));
  }, []);
  
  const handleUpload = () => openUploadWidget((url) => {
    setAvatar(url);
    handleSave(url);
  });
  
  const handleSave = async (avatarUrl ? : string) => {
    const payload: any = { name, status };
    if (avatarUrl) payload.avatar = avatarUrl;
    try {
      const res = await api.put('/users/me', payload);
      setProfile(res.data);
      toast.success('Updated');
    } catch { toast.error('Failed'); }
  };
  
  return (
    <div className="min-h-screen p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Profile</h1>
      <div className="bg-card-dark p-6 rounded space-y-4">
        <div className="flex items-center gap-4">
          {avatar ? <img src={avatar} className="w-20 h-20 rounded-full border-2 border-primary" /> : <div className="w-20 h-20 rounded-full bg-dark flex items-center justify-center text-2xl">?</div>}
          <button onClick={handleUpload} className="bg-primary text-white px-3 py-1 rounded">Upload</button>
        </div>
        <input value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2 rounded bg-dark border border-border-dark" placeholder="Name" />
        <input value={status} onChange={(e) => setStatus(e.target.value)} className="w-full p-2 rounded bg-dark border border-border-dark" placeholder="Status" />
        <button onClick={() => handleSave()} className="bg-primary px-4 py-2 rounded text-white">Save</button>
        {profile?.jgId && <p className="text-text-muted">JG ID: {profile.jgId}</p>}
      </div>
    </div>
  );
};
export default Profile;