import { useEffect, useMemo, useState } from 'react';
import http from '../api/http';

const formatHour = (hour) => `${hour % 12 || 12}:00 ${hour < 12 ? 'AM' : 'PM'}`;

const badgeClass = (value) => {
  if (value === 'approved') return 'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300';
  if (value === 'cancelled') return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
  if (value === 'refunded') return 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200';
  if (value === 'paid') return 'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300';
  if (value === 'pending') return 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200';
  if (value === 'failed') return 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300';
  return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [cancelling, setCancelling] = useState('');

  const load = async () => {
    setError('');
    try {
      const { data } = await http.get('/bookings/me');
      setBookings(data);
    } catch (e) {
      setError(e.response?.data?.message || 'Could not load bookings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const sortedBookings = useMemo(() => [...bookings].sort((a, b) => {
    const first = `${a.date}T${String(a.startHour).padStart(2, '0')}:00`;
    const second = `${b.date}T${String(b.startHour).padStart(2, '0')}:00`;
    return second.localeCompare(first);
  }), [bookings]);

  const cancel = async (booking) => {
    const hasRefund = booking.paymentStatus === 'paid';
    const confirmation = hasRefund
      ? 'Cancel this paid booking? A full refund will be initiated automatically.'
      : 'Cancel this booking?';
    if (!window.confirm(confirmation)) return;

    setError('');
    setNotice('');
    setCancelling(booking._id);
    try {
      const { data } = await http.delete(`/bookings/${booking._id}`);
      setNotice(data.message || (hasRefund ? 'Booking cancelled and refund initiated.' : 'Booking cancelled successfully.'));
      await load();
    } catch (e) {
      setError(e.response?.data?.message || 'Unable to cancel booking.');
    } finally {
      setCancelling('');
    }
  };

  return <div className="mx-auto max-w-3xl space-y-6 pb-8">
    <div>
      <h1 className="text-3xl font-black">My bookings</h1>
      <p className="mt-1 text-gray-500">View your sessions, payment status, and refunds in one place.</p>
    </div>

    {error && <div role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:bg-red-950/30 dark:text-red-300">{error}</div>}
    {notice && <div role="status" className="rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700 dark:bg-green-950/30 dark:text-green-300">{notice}</div>}

    {loading ? <div className="space-y-3">{[1, 2, 3].map((x) => <div key={x} className="h-36 animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-800" />)}</div> : sortedBookings.map((b) => <article key={b._id} className="rounded-2xl border bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-bold">{b.turf?.name || 'Turf'}</h2>
          <p className="mt-1 text-sm text-gray-500">📍 {b.turf?.location || 'Location unavailable'}</p>
          <p className="mt-3 text-sm font-medium">📅 {b.date} <span className="mx-1 text-gray-400">•</span> 🕐 {formatHour(b.startHour)} – {formatHour(b.endHour)}</p>
        </div>
        <div className="shrink-0 sm:text-right">
          <p className="text-xl font-black">₹{b.totalPrice}</p>
          <div className="mt-2 flex flex-wrap gap-2 sm:justify-end">
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${badgeClass(b.status)}`}>{b.status}</span>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${badgeClass(b.paymentStatus)}`}>{b.paymentStatus}</span>
            {b.refundStatus && b.refundStatus !== 'not_applicable' && <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClass(b.refundStatus)}`}>refund: {b.refundStatus}</span>}
          </div>
        </div>
      </div>

      {b.paymentStatus === 'refunded' && <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">Your payment has been refunded. Your bank or card provider may take some time to show the credit.</p>}
      {b.refundStatus === 'failed' && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">The refund could not be completed automatically. Please contact the turf administrator.</p>}
      {b.notes && <p className="mt-4 rounded-lg bg-gray-50 p-3 text-sm text-gray-600 dark:bg-gray-800/60 dark:text-gray-300">Note: {b.notes}</p>}

      {b.status !== 'cancelled' && <button onClick={() => cancel(b)} disabled={cancelling === b._id} className="mt-4 w-full rounded-lg border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto dark:border-red-900 dark:hover:bg-red-950/30">{cancelling === b._id ? 'Cancelling…' : b.paymentStatus === 'paid' ? 'Cancel & refund' : 'Cancel booking'}</button>}
    </article>)}

    {!loading && !sortedBookings.length && <div className="rounded-2xl border border-dashed p-10 text-center"><p className="font-semibold">No bookings yet</p><p className="mt-1 text-sm text-gray-500">Choose a turf and time from the home page to get started.</p></div>}
  </div>;
}
