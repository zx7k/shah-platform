import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

const Register = () => {
  const [step, setStep] = useState < 'form' | 'verify' > ('form');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const register = useAuthStore((s) => s.register);
  const verifyEmail = useAuthStore((s) => s.verifyEmail);
  const navigate = useNavigate();
  
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register(email, password, name);
      toast.success('Verification code sent');
      setStep('verify');
    } catch (err: any) { toast.error(err.message); }
  };
  
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await verifyEmail(email, code);
      toast.success('Email verified! Please login.');
      navigate('/login');
    } catch { toast.error('Invalid code'); }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-dark">
      <div className="bg-card-dark p-8 rounded-lg shadow-lg w-full max-w-md border border-border-dark">
        {step === 'form' ? (
          <>
            <h1 className="text-2xl font-bold mb-6 text-text-light">Create account</h1>
            <form onSubmit={handleRegister} className="space-y-4">
              <input type="text" placeholder="Full name" className="w-full p-3 rounded bg-dark border border-border-dark text-text-light" value={name} onChange={(e) => setName(e.target.value)} required />
              <input type="email" placeholder="Email" className="w-full p-3 rounded bg-dark border border-border-dark text-text-light" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <input type="password" placeholder="Password (min 8 chars, letter+number)" className="w-full p-3 rounded bg-dark border border-border-dark text-text-light" value={password} onChange={(e) => setPassword(e.target.value)} required />
              <button type="submit" className="w-full bg-primary text-white p-3 rounded">Sign Up</button>
            </form>
            <p className="mt-4 text-center text-sm"><Link to="/login" className="text-primary">Already have an account?</Link></p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold mb-6">Verify email</h1>
            <form onSubmit={handleVerify} className="space-y-4">
              <p className="text-text-muted text-sm">Code sent to {email}</p>
              <input type="text" placeholder="123456" maxLength={6} className="w-full p-3 rounded bg-dark border border-border-dark text-text-light text-center text-2xl tracking-widest" value={code} onChange={(e) => setCode(e.target.value)} required />
              <button type="submit" className="w-full bg-primary text-white p-3 rounded">Verify</button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
export default Register;