import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '', password: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      await updateProfile(form);
      setForm((prev) => ({ ...prev, password: '' }));
      setMessage({ type: 'success', text: 'Profile updated successfully.' });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || error.message || 'Unable to update profile.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg pb-8">
      <div className="mb-5">
        <h1 className="text-3xl font-black">Your profile</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Keep your details up to date for faster booking and payment checkout.</p>
      </div>
      <form onSubmit={submit} className="space-y-4 rounded-2xl border bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-7">
        <label className="block text-sm font-semibold">Name
          <input required minLength="2" maxLength="80" value={form.name} className="field mt-1" onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </label>
        <label className="block text-sm font-semibold">Email
          <input value={user?.email || ''} disabled className="field mt-1 cursor-not-allowed opacity-60" />
          <span className="mt-1 block text-xs font-normal text-gray-500">Email is your account identifier and cannot be changed here.</span>
        </label>
        <label className="block text-sm font-semibold">Phone
          <input type="tel" maxLength="20" placeholder="Optional" value={form.phone} className="field mt-1" onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </label>
        <label className="block text-sm font-semibold">New password
          <input type="password" minLength="6" maxLength="100" placeholder="Leave blank to keep current password" value={form.password} className="field mt-1" onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </label>
        <button disabled={loading} className="w-full rounded-xl bg-green-600 px-4 py-3 font-bold text-white transition hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-50">{loading ? 'Saving…' : 'Save changes'}</button>
        {message.text && <div role="status" className={`rounded-xl px-4 py-3 text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-300' : 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300'}`}>{message.text}</div>}
      </form>
    </div>
  );
}
