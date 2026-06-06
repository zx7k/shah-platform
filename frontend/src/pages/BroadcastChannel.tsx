import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { useSocket } from '../hooks/useSocket';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

const BroadcastChannel = () => {
  const { channelId } = useParams < { channelId: string } > ();
  const [channel, setChannel] = useState < any > (null);
  const [messages, setMessages] = useState < any[] > ([]);
  const [newMsg, setNewMsg] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const socket = useSocket();
  const user = useAuthStore(s => s.user);
  const messagesEndRef = useRef < HTMLDivElement > (null);
  
  useEffect(() => {
    if (!channelId) return;
    api.get(`/broadcasts/${channelId}`).then(res => {
      setChannel(res.data);
      setIsFollowing(res.data.members.includes(user.uid));
    });
    api.get(`/broadcasts/${channelId}/messages`).then(res => setMessages(res.data));
    socket?.emit('broadcast:join', { channelId });
    
    const handleNew = (msg: any) => setMessages(prev => [...prev, msg]);
    socket?.on('broadcast:new_message', handleNew);
    return () => {
      socket?.off('broadcast:new_message', handleNew);
      socket?.emit('broadcast:leave', { channelId });
    };
  }, [channelId, user.uid]);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleFollow = async () => {
    await api.post(`/broadcasts/${channelId}/follow`);
    setIsFollowing(true);
    toast.success('Following');
  };
  
  const handleUnfollow = async () => {
    await api.post(`/broadcasts/${channelId}/unfollow`);
    setIsFollowing(false);
  };
  
  const handlePost = async () => {
    if (!newMsg.trim()) return;
    try {
      await api.post(`/broadcasts/${channelId}/messages`, { text: newMsg });
      setNewMsg('');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Cannot post');
    }
  };
  
  const generateInvite = async () => {
    try {
      const res = await api.post(`/broadcasts/${channelId}/invite-codes`, {});
      setInviteCode(res.data.code);
    } catch {
      toast.error('Failed to generate invite code');
    }
  };
  
  const canPost = channel && (
    channel.postPermission === 'members' ||
    (channel.postPermission === 'admin' && channel.createdBy === user.uid)
  );
  
  if (!channel) return <div className="p-4 text-center">Loading...</div>;
  
  return (
    <div className="flex flex-col h-screen bg-dark">
      {/* Header */}
      <div className="p-4 border-b border-border-dark flex items-center gap-3">
        {channel.avatar && <img src={channel.avatar} className="w-10 h-10 rounded-full" alt="" />}
        <div className="flex-1">
          <h1 className="font-bold text-lg">{channel.name}</h1>
          <p className="text-sm text-text-muted">{channel.description}</p>
        </div>
        {!isFollowing ? (
          <button onClick={handleFollow} className="bg-primary px-3 py-1 rounded text-white text-sm">Follow</button>
        ) : (
          <button onClick={handleUnfollow} className="bg-border-dark px-3 py-1 rounded text-sm">Following</button>
        )}
        {channel.createdBy === user.uid && (
          <button onClick={generateInvite} className="text-sm text-primary hover:underline">Invite</button>
        )}
      </div>
      {inviteCode && (
        <div className="bg-card-dark p-2 text-center text-sm">
          Invite Code: <strong className="tracking-wider">{inviteCode}</strong>
        </div>
      )}

      {/* Pinned */}
      {channel.pinnedMessages?.length > 0 && (
        <div className="bg-card-dark p-3 border-b border-border-dark">
          <h3 className="text-sm font-semibold mb-1">📌 Pinned</h3>
          {channel.pinnedMessages.map((id: string) => {
            const msg = messages.find(m => m.id === id);
            return msg ? <p key={id} className="text-sm text-text-muted">— {msg.text}</p> : null;
          })}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map(msg => (
          <div key={msg.id} className="flex gap-2 text-sm">
            <span className="font-medium text-primary">{msg.senderName || msg.sender}</span>
            <span>{msg.text}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {canPost && (
        <div className="p-4 border-t border-border-dark flex gap-2">
          <input
            value={newMsg}
            onChange={e => setNewMsg(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handlePost()}
            placeholder="Broadcast..."
            className="flex-1 p-2 rounded bg-dark border border-border-dark text-text-light"
          />
          <button onClick={handlePost} className="bg-primary px-4 py-2 rounded text-white">Post</button>
        </div>
      )}
    </div>
  );
};

export default BroadcastChannel;