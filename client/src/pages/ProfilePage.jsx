import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '', password: '' });
  const [msg, setMsg] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    await updateProfile(form);
    setMsg('Profile updated');
  };

  return (
    <form onSubmit={submit} className="max-w-lg bg-white dark:bg-gray-900 p-6 rounded-xl space-y-3">
      <h1 className="text-2xl font-semibold">Profile</h1>
      <input value={form.name} className="w-full p-2 rounded bg-gray-100 dark:bg-gray-800" onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <input value={form.phone} className="w-full p-2 rounded bg-gray-100 dark:bg-gray-800" onChange={(e) => setForm({ ...form, phone: e.target.value })} />
      <input type="password" placeholder="New Password (optional)" className="w-full p-2 rounded bg-gray-100 dark:bg-gray-800" onChange={(e) => setForm({ ...form, password: e.target.value })} />
      <button className="bg-pitch px-4 py-2 rounded text-white">Save</button>
      {msg && <p className="text-pitch text-sm">{msg}</p>}
    </form>
  );
}
