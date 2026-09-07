import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto grid max-w-5xl overflow-hidden rounded-3xl border border-gray-200/80 bg-white shadow-2xl shadow-gray-900/10 dark:border-gray-800 dark:bg-gray-900 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-gray-950 via-emerald-950 to-green-900 p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-green-400/20 blur-3xl" />
        <div className="relative"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10 text-2xl ring-1 ring-white/15">⚽</div><p className="mt-8 text-xs font-black uppercase tracking-[0.25em] text-green-300">TurfBook</p><h2 className="mt-3 text-4xl font-black leading-tight">Your next game is closer than you think.</h2><p className="mt-4 max-w-sm text-sm leading-6 text-white/65">Sign in to book your favourite turf, manage sessions, and keep your game days organised.</p></div>
        <div className="relative flex gap-3 text-xs font-semibold text-white/70"><span className="rounded-full bg-white/10 px-3 py-2">Live availability</span><span className="rounded-full bg-white/10 px-3 py-2">Secure checkout</span></div>
      </div>

      <form onSubmit={submit} className="p-6 sm:p-10">
        <div className="mb-8"><p className="text-xs font-black uppercase tracking-[0.2em] text-green-600 dark:text-green-400">Welcome back</p><h1 className="mt-2 text-3xl font-black tracking-tight">Sign in to TurfBook</h1><p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Get back to the pitch in a few clicks.</p></div>
        <div className="space-y-5">
          <label className="block text-sm font-bold">Email<input value={form.email} placeholder="you@example.com" type="email" required autoComplete="email" className="field mt-2" onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
          <label className="block text-sm font-bold">Password<input value={form.password} placeholder="Enter your password" type="password" required autoComplete="current-password" className="field mt-2" onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
          {error && <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-900/60 dark:bg-red-950/20 dark:text-red-300">{error}</div>}
          <button disabled={loading} className="premium-button w-full justify-center py-3.5">{loading ? 'Signing in…' : 'Sign in →'}</button>
        </div>
        <p className="mt-7 text-center text-sm text-gray-500 dark:text-gray-400">New to TurfBook? <Link className="font-bold text-green-600 hover:text-green-500 dark:text-green-400" to="/register">Create an account</Link></p>
      </form>
    </div>
  );
}
