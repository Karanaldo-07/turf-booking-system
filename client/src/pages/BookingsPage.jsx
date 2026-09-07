import { useEffect, useState } from 'react';
import http from '../api/http';

const formatHour = (hour) => `${hour % 12 || 12}:00 ${hour < 12 ? 'AM' : 'PM'}`;

export default function BookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState('');

  const load = () => http.get('/bookings/me').then((res) => setBookings(res.data)).catch(() => setError('Could not load bookings.')).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const cancel = async (id) => {
    if (!window.confirm('Cancel this booking?')) return;
    setCancelling(id);
    try { await http.delete(`/bookings/${id}`); await load(); } catch (e) { setError(e.response?.data?.message || 'Unable to cancel booking.'); } finally { setCancelling(''); }
  };

  return <div className="mx-auto max-w-3xl space-y-6 pb-8">
    <div><h1 className="text-3xl font-black">My bookings</h1><p className="mt-1 text-gray-500">Manage your upcoming turf sessions.</p></div>
    {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">{error}</div>}
    {loading ? <div className="space-y-3">{[1,2,3].map((x) => <div key={x} className="h-32 animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-800" />)}</div> : bookings.map((b) => <article key={b._id} className="rounded-2xl border bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h2 className="text-lg font-bold">{b.turf?.name || 'Turf'}</h2><p className="mt-1 text-sm text-gray-500">📍 {b.turf?.location}</p><p className="mt-3 font-medium">📅 {b.date} &nbsp; • &nbsp; 🕐 {formatHour(b.startHour)} – {formatHour(b.endHour)}</p></div>
        <div className="sm:text-right"><p className="text-xl font-black">₹{b.totalPrice}</p><div className="mt-1 flex gap-2 sm:justify-end"><span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700 dark:bg-green-950/40 dark:text-green-300">{b.status}</span><span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold dark:bg-gray-800">{b.paymentStatus}</span></div></div>
      </div>
      {b.notes && <p className="mt-4 rounded-lg bg-gray-50 p-3 text-sm text-gray-600 dark:bg-gray-800/60 dark:text-gray-300">Note: {b.notes}</p>}
      {b.status !== 'cancelled' && <button onClick={() => cancel(b._id)} disabled={cancelling === b._id} className="mt-4 rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:hover:bg-red-950/30">{cancelling === b._id ? 'Cancelling…' : 'Cancel booking'}</button>}
    </article>)}
    {!loading && !bookings.length && <div className="rounded-2xl border border-dashed p-10 text-center"><p className="font-semibold">No bookings yet</p><p className="mt-1 text-sm text-gray-500">Choose a turf and time from the home page to get started.</p></div>}
  </div>;
}
