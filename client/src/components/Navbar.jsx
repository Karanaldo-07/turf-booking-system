import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const linkClass = ({ isActive }) => `rounded-xl px-3 py-2 text-sm font-semibold transition duration-200 ${isActive ? 'bg-green-600 text-white shadow-md shadow-green-600/20' : 'text-gray-700 hover:bg-gray-100 hover:text-green-700 dark:text-gray-200 dark:hover:bg-gray-800 dark:hover:text-green-400'}`;

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const signOut = () => { logout(); close(); navigate('/login'); };

  useEffect(() => {
    const onKeyDown = (event) => { if (event.key === 'Escape') close(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return <nav className="sticky top-0 z-40 border-b border-gray-200/70 bg-white/85 shadow-sm backdrop-blur-xl dark:border-gray-800/80 dark:bg-gray-950/80">
    <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
      <Link className="group flex items-center gap-2.5 text-lg font-black tracking-tight text-green-600" to="/" onClick={close}>
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-700 text-lg text-white shadow-lg shadow-green-600/20 transition group-hover:scale-105">⚽</span>
        <span>Turf<span className="text-gray-900 dark:text-white">Book</span></span>
      </Link>
      <button aria-label="Toggle menu" aria-expanded={open} className="rounded-xl border border-gray-200 p-2 text-xl shadow-sm transition hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-gray-800 md:hidden" onClick={() => setOpen(!open)}>☰</button>
      <div className={`${open ? 'flex' : 'hidden'} absolute left-0 top-full w-full flex-col gap-1 border-b border-gray-200 bg-white/95 p-3 shadow-xl backdrop-blur-xl dark:border-gray-800 dark:bg-gray-950/95 md:static md:flex md:w-auto md:flex-row md:items-center md:border-0 md:bg-transparent md:p-0 md:shadow-none dark:md:bg-transparent`}>
        <NavLink className={linkClass} to="/" onClick={close}>Home</NavLink>
        {user && <NavLink className={linkClass} to="/bookings" onClick={close}>My Bookings</NavLink>}
        {user?.role === 'admin' && <NavLink className={linkClass} to="/admin" onClick={close}>Admin</NavLink>}
        {user && <NavLink className={linkClass} to="/profile" onClick={close}>Profile</NavLink>}
        {user ? <button onClick={signOut} className="rounded-xl px-3 py-2 text-left text-sm font-semibold text-gray-700 transition hover:bg-gray-100 hover:text-red-600 dark:text-gray-200 dark:hover:bg-gray-800">Logout</button> : <><NavLink className={linkClass} to="/login" onClick={close}>Login</NavLink><NavLink className="rounded-xl bg-green-600 px-4 py-2 text-sm font-bold text-white shadow-md shadow-green-600/20 transition hover:-translate-y-0.5 hover:bg-green-500" to="/register" onClick={close}>Get Started</NavLink></>}
        <button onClick={toggleTheme} aria-label="Toggle theme" className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm transition hover:-translate-y-0.5 dark:border-gray-800 dark:bg-gray-900">{theme === 'dark' ? '☀️' : '🌙'}</button>
      </div>
    </div>
  </nav>;
}
