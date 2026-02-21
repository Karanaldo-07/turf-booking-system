import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const linkClass = ({ isActive }) =>
  `px-3 py-2 rounded-lg text-sm ${isActive ? 'bg-pitch text-white' : 'text-gray-700 dark:text-gray-200'}`;

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <nav className="sticky top-0 z-20 bg-white/95 dark:bg-black/95 border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link className="font-bold text-pitch text-xl" to="/">⚽ TurfBook</Link>
        <div className="flex items-center gap-2">
          <NavLink className={linkClass} to="/">Home</NavLink>
          {user && <NavLink className={linkClass} to="/bookings">My Bookings</NavLink>}
          {user?.role === 'admin' && <NavLink className={linkClass} to="/admin">Admin</NavLink>}
          {user ? (
            <>
              <NavLink className={linkClass} to="/profile">Profile</NavLink>
              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="px-3 py-2 text-sm rounded-lg bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink className={linkClass} to="/login">Login</NavLink>
              <NavLink className={linkClass} to="/register">Register</NavLink>
            </>
          )}
          <button onClick={toggleTheme} className="px-3 py-2 text-sm rounded-lg bg-gray-200 dark:bg-gray-800">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </div>
    </nav>
  );
}
