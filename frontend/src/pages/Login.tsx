import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      toast.success('Logged in');
      navigate('/');
    } catch (err: any) {
      toast.error(err.message || 'Login failed');
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-dark">
      <div className="bg-card-dark p-8 rounded-lg shadow-lg w-full max-w-md border border-border-dark">
        <h1 className="text-2xl font-bold mb-6 text-text-light">Welcome back</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="email" placeholder="Email" className="w-full p-3 rounded bg-dark border border-border-dark text-text-light focus:outline-none focus:border-primary" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input type="password" placeholder="Password" className="w-full p-3 rounded bg-dark border border-border-dark text-text-light focus:outline-none focus:border-primary" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button type="submit" className="w-full bg-primary hover:bg-primary-hover text-white p-3 rounded font-semibold transition">Log In</button>
        </form>
        <p className="mt-4 text-text-muted text-sm text-center">
          Don't have an account? <Link to="/register" className="text-primary hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  );
};
export default Login;