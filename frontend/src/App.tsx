import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Chats from './pages/Chats';
import ChatWindow from './pages/ChatWindow';
import CreateGroup from './pages/CreateGroup';
import GroupChatWindow from './pages/GroupChatWindow';
import Broadcasts from './pages/Broadcasts';
import BroadcastChannel from './pages/BroadcastChannel';
import JoinBroadcast from './pages/JoinBroadcast';
import Banned from './pages/Banned';
import AdminDashboard from './pages/admin/Dashboard';
import AdminReports from './pages/admin/Reports';
import AdminBans from './pages/admin/Bans';
import AdminUsers from './pages/admin/Users';
import AdminAuditLogs from './pages/admin/AuditLogs';
import ProtectedRoute from './components/ProtectedRoute';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/chats" element={<ProtectedRoute><Chats /></ProtectedRoute>} />
        <Route path="/chat/:id" element={<ProtectedRoute><ChatWindow /></ProtectedRoute>} />
        <Route path="/create-group" element={<ProtectedRoute><CreateGroup /></ProtectedRoute>} />
        <Route path="/group/:id" element={<ProtectedRoute><GroupChatWindow /></ProtectedRoute>} />
        <Route path="/broadcasts" element={<ProtectedRoute><Broadcasts /></ProtectedRoute>} />
        <Route path="/broadcast/:id" element={<ProtectedRoute><BroadcastChannel /></ProtectedRoute>} />
        <Route path="/join-broadcast" element={<ProtectedRoute><JoinBroadcast /></ProtectedRoute>} />
        <Route path="/banned" element={<Banned />} />
        <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/reports" element={<ProtectedRoute requiredRole="moderator"><AdminReports /></ProtectedRoute>} />
        <Route path="/admin/bans" element={<ProtectedRoute requiredRole="admin"><AdminBans /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute requiredRole="admin"><AdminUsers /></ProtectedRoute>} />
        <Route path="/admin/audit-logs" element={<ProtectedRoute requiredRole="admin"><AdminAuditLogs /></ProtectedRoute>} />
        <Route path="/" element={<ProtectedRoute><Chats /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;