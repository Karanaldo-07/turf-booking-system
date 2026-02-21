import Navbar from '../components/Navbar';

export default function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 dark:bg-gray-950 dark:text-white transition-colors">
      <Navbar />
      <main className="max-w-6xl mx-auto p-4">{children}</main>
    </div>
  );
}
