import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '', password: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const submit = async (e) => { e.preventDefault(); setLoading(true); setMessage({ type: '', text: '' }); try { await updateProfile(form); setForm((prev) => ({ ...prev, password: '' })); setMessage({ type: 'success', text: 'Profile updated successfully.' }); } catch (error) { setMessage({ type: 'error', text: error.response?.data?.message || error.message || 'Unable to update profile.' }); } finally { setLoading(false); } };

  return <div className="mx-auto max-w-3xl pb-10"><section className="premium-card relative mb-5 overflow-hidden p-6 sm:p-8"><div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-green-500/10 blur-3xl" /><div className="relative flex items-center gap-4"><div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-green-500 to-emerald-700 text-2xl font-black text-white shadow-lg shadow-green-600/20">{(user?.name || 'U').charAt(0).toUpperCase()}</div><div><p className="text-xs font-black uppercase tracking-[0.2em] text-green-600 dark:text-green-400">Account</p><h1 className="mt-1 text-3xl font-black tracking-tight">Your profile</h1><p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Keep your details ready for faster booking and checkout.</p></div></div></section>
    <form onSubmit={submit} className="premium-card space-y-5 p-6 sm:p-8"><div><p className="text-xs font-black uppercase tracking-wider text-gray-400">Personal details</p><p className="mt-1 text-sm text-gray-500">Update the information linked to your TurfBook account.</p></div>
      <label className="block text-sm font-bold">Name<input required minLength="2" maxLength="80" value={form.name} className="field mt-2" onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
      <label className="block text-sm font-bold">Email<input value={user?.email || ''} disabled className="field mt-2 cursor-not-allowed opacity-60" /><span className="mt-1 block text-xs font-normal text-gray-500">Email is your account identifier and cannot be changed here.</span></label>
      <label className="block text-sm font-bold">Phone <span className="font-normal text-gray-400">(optional)</span><input type="tel" maxLength="20" placeholder="Your phone number" value={form.phone} className="field mt-2" onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
      <div className="border-t border-gray-100 pt-5 dark:border-gray-800"><p className="text-sm font-black">Security</p><p className="mt-1 text-xs text-gray-500">Leave the password blank if you do not want to change it.</p><label className="mt-4 block text-sm font-bold">New password<input type="password" minLength="6" maxLength="100" placeholder="Leave blank to keep current password" value={form.password} className="field mt-2" onChange={(e) => setForm({ ...form, password: e.target.value })} /></label></div>
      <button disabled={loading} className="premium-button w-full justify-center py-3.5">{loading ? 'Saving changes…' : 'Save changes →'}</button>
      {message.text && <div role="status" className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${message.type === 'success' ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-900/60 dark:bg-green-950/20 dark:text-green-300' : 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/20 dark:text-red-300'}`}>{message.type === 'success' ? '✓ ' : '⚠ '}{message.text}</div>}
    </form>
  </div>;
}
