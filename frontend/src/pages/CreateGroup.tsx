import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { openUploadWidget } from '../services/cloudinary';
import { useGroupCrypto } from '../hooks/useGroupCrypto';
import toast from 'react-hot-toast';

const CreateGroup = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [avatar, setAvatar] = useState('');
  const [memberJgIds, setMemberJgIds] = useState('');
  const navigate = useNavigate();
  const { createAndDistributeKeys } = useGroupCrypto();
  
  const handleUpload = () => {
    openUploadWidget((url) => setAvatar(url));
  };
  
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Group name required');
    const jgIds = memberJgIds.split(',').map(s => s.trim()).filter(Boolean);
    
    try {
      const res = await api.post('/groups', {
        name,
        description,
        avatar,
        memberJgIds: jgIds,
      });
      const { groupId, members } = res.data;
      const memberUids: string[] = members.map((m: any) => m.uid);
      await createAndDistributeKeys(groupId, memberUids);
      toast.success('Group created');
      navigate(`/group/${groupId}`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Creation failed');
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-dark">
      <div className="bg-card-dark p-6 rounded-lg w-full max-w-md border border-border-dark">
        <h1 className="text-2xl font-bold mb-4">New Group</h1>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="flex items-center gap-4">
            {avatar ? (
              <img src={avatar} className="w-16 h-16 rounded-full border-2 border-primary" alt="" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-dark flex items-center justify-center text-xl">🏷️</div>
            )}
            <button type="button" onClick={handleUpload} className="text-primary text-sm hover:underline">Upload Avatar</button>
          </div>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full p-2 rounded bg-dark border border-border-dark text-text-light"
            placeholder="Group name"
            required
          />
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full p-2 rounded bg-dark border border-border-dark text-text-light"
            placeholder="Description (optional)"
            rows={3}
          />
          <input
            type="text"
            value={memberJgIds}
            onChange={e => setMemberJgIds(e.target.value)}
            className="w-full p-2 rounded bg-dark border border-border-dark text-text-light"
            placeholder="Member JG IDs (comma separated)"
          />
          <button type="submit" className="w-full bg-primary hover:bg-primary-hover text-white p-2 rounded font-semibold">
            Create Group
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateGroup;