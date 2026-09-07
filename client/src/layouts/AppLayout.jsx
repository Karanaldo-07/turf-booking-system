import Navbar from '../components/Navbar';

export default function AppLayout({ children }) {
  return (
    <div className="min-h-screen text-gray-900 transition-colors dark:text-white">
      <Navbar />
      <main className="mx-auto min-h-[calc(100vh-73px)] max-w-6xl px-4 py-6 sm:py-8">{children}</main>
      <footer className="border-t border-gray-200/70 bg-white/60 dark:border-gray-800 dark:bg-gray-950/60">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-center text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <p>© {new Date().getFullYear()} TurfBook. Built for the beautiful game.</p>
          <p className="font-medium text-gray-400">Book smarter • Play harder • Enjoy the game</p>
        </div>
      </footer>
    </div>
  );
}
