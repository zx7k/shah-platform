import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket';
import { useGroupCrypto } from '../hooks/useGroupCrypto';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import { arrayBufferToBase64, uint8ArrayToBase64, base64ToArrayBuffer, base64ToUint8Array } from '../utils/convert';
import { encryptMessage, decryptMessage } from '../utils/crypto';
import toast from 'react-hot-toast';

interface GroupMessage {
  id: string;
  sender: string;
  senderName ? : string;
  ciphertext: string;
  iv: string;
  createdAt: any;
  decrypted ? : string;
}

const GroupChatWindow = () => {
  const { id: groupId } = useParams < { id: string } > ();
  const [group, setGroup] = useState < any > (null);
  const [messages, setMessages] = useState < GroupMessage[] > ([]);
  const [input, setInput] = useState('');
  const [groupKey, setGroupKey] = useState < CryptoKey | null > (null);
  const socket = useSocket();
  const { getGroupKey } = useGroupCrypto();
  const user = useAuthStore(s => s.user);
  const messagesEndRef = useRef < HTMLDivElement > (null);
  
  useEffect(() => {
    if (!groupId) return;
    
    const init = async () => {
      try {
        const res = await api.get(`/groups/${groupId}`);
        setGroup(res.data);
        
        const key = await getGroupKey(groupId);
        setGroupKey(key);
        
        const msgs: GroupMessage[] = res.data.messages || [];
        if (key) {
          const decryptedMsgs = await Promise.all(msgs.map(async (msg) => {
            try {
              const ct = base64ToArrayBuffer(msg.ciphertext);
              const iv = base64ToUint8Array(msg.iv);
              const plain = await decryptMessage(key, ct, iv);
              return { ...msg, decrypted: plain };
            } catch {
              return { ...msg, decrypted: '🔐 Cannot decrypt' };
            }
          }));
          setMessages(decryptedMsgs);
        } else {
          setMessages(msgs.map(m => ({ ...m, decrypted: 'Decrypting...' })));
        }
        
        socket?.emit('group:join', { groupId });
      } catch (err) {
        console.error(err);
      }
    };
    
    init();
    
    const handleNewMessage = async (msg: any) => {
      if (!groupKey) return;
      try {
        const ct = base64ToArrayBuffer(msg.ciphertext);
        const iv = base64ToUint8Array(msg.iv);
        const plain = await decryptMessage(groupKey, ct, iv);
        setMessages(prev => [...prev, { ...msg, decrypted: plain }]);
      } catch { /* ignore */ }
    };
    
    socket?.on('group:new_message', handleNewMessage);
    return () => {
      socket?.off('group:new_message', handleNewMessage);
      socket?.emit('group:leave', { groupId });
    };
  }, [groupId, groupKey, socket, user.uid, getGroupKey]);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const sendMessage = async () => {
    if (!input.trim() || !groupKey || !groupId) return;
    try {
      const { ciphertext, iv } = await encryptMessage(groupKey, input);
      socket?.emit('group:message', {
        groupId,
        ciphertext: arrayBufferToBase64(ciphertext),
        iv: uint8ArrayToBase64(iv),
      });
      setInput('');
    } catch (err) {
      console.error(err);
    }
  };
  
  if (!group) return <div className="p-4 text-center">Loading group...</div>;
  
  return (
    <div className="flex flex-col h-screen bg-dark">
      {/* Header */}
      <div className="p-4 border-b border-border-dark flex items-center gap-3">
        <img src={group.avatar || ''} className="w-10 h-10 rounded-full" alt="" />
        <div>
          <h2 className="font-semibold">{group.name}</h2>
          <p className="text-sm text-text-muted">{group.members?.length} members</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.sender === user.uid ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] p-3 rounded-lg ${msg.sender === user.uid ? 'bg-primary text-white' : 'bg-card-dark border border-border-dark'}`}>
              {msg.sender !== user.uid && (
                <p className="text-xs text-primary font-medium mb-1">{msg.senderName || msg.sender}</p>
              )}
              <p>{msg.decrypted || '...'}</p>
              <span className="text-xs opacity-60 mt-1 block">
                {msg.createdAt?.seconds ? new Date(msg.createdAt.seconds * 1000).toLocaleTimeString() : ''}
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border-dark flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder="Type a message..."
          className="flex-1 p-2 rounded bg-dark border border-border-dark text-text-light focus:outline-none focus:border-primary"
        />
        <button onClick={sendMessage} className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded font-semibold">
          Send
        </button>
      </div>
    </div>
  );
};

export default GroupChatWindow;