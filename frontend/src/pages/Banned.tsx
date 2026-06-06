import { useAuthStore } from '../store/authStore';

const Banned = () => {
  const logout = useAuthStore(s => s.logout);
  return (
    <div className="min-h-screen flex items-center justify-center bg-dark">
      <div className="bg-card-dark p-8 rounded-lg border border-border-dark text-center max-w-sm">
        <h1 className="text-2xl font-bold text-error-red mb-4">Account Suspended</h1>
        <p className="text-text-muted mb-4">You have been banned from Shah. If you believe this is a mistake, you can submit an appeal.</p>
        <button onClick={logout} className="bg-primary px-4 py-2 rounded text-white">Log out</button>
      </div>
    </div>
  );
};

export default Banned;