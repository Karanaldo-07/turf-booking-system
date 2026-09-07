import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const linkClass = ({ isActive }) => `rounded-lg px-3 py-2 text-sm font-medium transition ${isActive ? 'bg-green-600 text-white' : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800'}`;

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const signOut = () => { logout(); close(); navigate('/login'); };

  return <nav className="sticky top-0 z-30 border-b border-gray-200/80 bg-white/95 backdrop-blur dark:border-gray-800 dark:bg-gray-950/95">
    <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
      <Link className="flex items-center gap-2 text-lg font-black tracking-tight text-green-600" to="/" onClick={close}><span className="grid h-9 w-9 place-items-center rounded-xl bg-green-600 text-white">⚽</span>TurfBook</Link>
      <button aria-label="Toggle menu" className="rounded-lg p-2 text-xl md:hidden" onClick={() => setOpen(!open)}>☰</button>
      <div className={`${open ? 'flex' : 'hidden'} absolute left-0 top-full w-full flex-col gap-1 border-b bg-white p-3 shadow-lg dark:border-gray-800 dark:bg-gray-950 md:static md:flex md:w-auto md:flex-row md:items-center md:border-0 md:p-0 md:shadow-none`}>
        <NavLink className={linkClass} to="/" onClick={close}>Home</NavLink>
        {user && <NavLink className={linkClass} to="/bookings" onClick={close}>My Bookings</NavLink>}
        {user?.role === 'admin' && <NavLink className={linkClass} to="/admin" onClick={close}>Admin</NavLink>}
        {user && <NavLink className={linkClass} to="/profile" onClick={close}>Profile</NavLink>}
        {user ? <button onClick={signOut} className="rounded-lg px-3 py-2 text-left text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800">Logout</button> : <><NavLink className={linkClass} to="/login" onClick={close}>Login</NavLink><NavLink className={linkClass} to="/register" onClick={close}>Register</NavLink></>}
        <button onClick={toggleTheme} aria-label="Toggle theme" className="rounded-lg bg-gray-100 px-3 py-2 text-sm dark:bg-gray-800">{theme === 'dark' ? '☀️' : '🌙'}</button>
      </div>
    </div>
  </nav>;
}
