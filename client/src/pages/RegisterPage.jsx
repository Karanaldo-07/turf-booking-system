import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto grid max-w-5xl overflow-hidden rounded-3xl border border-gray-200/80 bg-white shadow-2xl shadow-gray-900/10 dark:border-gray-800 dark:bg-gray-900 lg:grid-cols-[1.1fr_0.9fr]">
      <form onSubmit={submit} className="p-6 sm:p-10 lg:order-1">
        <div className="mb-7"><p className="text-xs font-black uppercase tracking-[0.2em] text-green-600 dark:text-green-400">Join the pitch</p><h1 className="mt-2 text-3xl font-black tracking-tight">Create your TurfBook account</h1><p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Book faster and keep every session in one place.</p></div>
        <div className="space-y-4">
          <label className="block text-sm font-bold">Full name<input value={form.name} placeholder="Your name" required minLength="2" maxLength="80" autoComplete="name" className="field mt-2" onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-bold">Phone <span className="font-normal text-gray-400">(optional)</span><input value={form.phone} placeholder="Phone number" maxLength="20" autoComplete="tel" className="field mt-2" onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
            <label className="block text-sm font-bold">Email<input value={form.email} placeholder="you@example.com" type="email" required autoComplete="email" className="field mt-2" onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
          </div>
          <label className="block text-sm font-bold">Password<input value={form.password} placeholder="At least 6 characters" type="password" required minLength="6" maxLength="100" autoComplete="new-password" className="field mt-2" onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
          {error && <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-900/60 dark:bg-red-950/20 dark:text-red-300">{error}</div>}
          <button disabled={loading} className="premium-button w-full justify-center py-3.5">{loading ? 'Creating account…' : 'Create account →'}</button>
        </div>
        <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">Already have an account? <Link className="font-bold text-green-600 hover:text-green-500 dark:text-green-400" to="/login">Sign in</Link></p>
      </form>

      <div className="relative hidden overflow-hidden bg-gradient-to-br from-gray-950 via-emerald-950 to-green-900 p-10 text-white lg:order-2 lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-green-400/20 blur-3xl" />
        <div className="relative"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10 text-2xl ring-1 ring-white/15">⚽</div><p className="mt-8 text-xs font-black uppercase tracking-[0.25em] text-green-300">Built for players</p><h2 className="mt-3 text-4xl font-black leading-tight">Less planning. More playing.</h2><p className="mt-4 max-w-sm text-sm leading-6 text-white/65">Discover available turf sessions, reserve your slot, and pay securely — all from one clean experience.</p></div>
        <div className="relative space-y-3 text-sm font-semibold text-white/75"><p>✓ Easy online booking</p><p>✓ Real-time slot protection</p><p>✓ Simple cancellation & refunds</p></div>
      </div>
    </div>
  );
}
