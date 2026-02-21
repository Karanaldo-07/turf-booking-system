import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    try {
      await login(form);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <form onSubmit={submit} className="max-w-md mx-auto bg-white dark:bg-gray-900 p-6 rounded-xl space-y-3">
      <h1 className="text-2xl font-semibold">Login</h1>
      <input placeholder="Email" type="email" required className="w-full p-2 rounded bg-gray-100 dark:bg-gray-800" onChange={(e) => setForm({ ...form, email: e.target.value })} />
      <input placeholder="Password" type="password" required className="w-full p-2 rounded bg-gray-100 dark:bg-gray-800" onChange={(e) => setForm({ ...form, password: e.target.value })} />
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <button className="w-full bg-pitch p-2 rounded text-white">Sign In</button>
      <p className="text-sm">No account? <Link className="text-pitch" to="/register">Register</Link></p>
    </form>
  );
}
