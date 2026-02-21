import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    try {
      await register(form);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <form onSubmit={submit} className="max-w-md mx-auto bg-white dark:bg-gray-900 p-6 rounded-xl space-y-3">
      <h1 className="text-2xl font-semibold">Register</h1>
      <input placeholder="Name" required className="w-full p-2 rounded bg-gray-100 dark:bg-gray-800" onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <input placeholder="Phone" className="w-full p-2 rounded bg-gray-100 dark:bg-gray-800" onChange={(e) => setForm({ ...form, phone: e.target.value })} />
      <input placeholder="Email" type="email" required className="w-full p-2 rounded bg-gray-100 dark:bg-gray-800" onChange={(e) => setForm({ ...form, email: e.target.value })} />
      <input placeholder="Password" type="password" required className="w-full p-2 rounded bg-gray-100 dark:bg-gray-800" onChange={(e) => setForm({ ...form, password: e.target.value })} />
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <button className="w-full bg-pitch p-2 rounded text-white">Create Account</button>
      <p className="text-sm">Already registered? <Link className="text-pitch" to="/login">Login</Link></p>
    </form>
  );
}
