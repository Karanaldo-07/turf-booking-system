import { useEffect, useMemo, useState } from 'react';
import http from '../api/http';

const formatHour = (hour) => `${hour % 12 || 12}:00 ${hour < 12 ? 'AM' : 'PM'}`;

const badgeClass = (value) => {
  if (value === 'approved' || value === 'paid') return 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300';
  if (value === 'cancelled') return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300';
  if (value === 'refunded' || value === 'processed' || value === 'pending') return 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200';
  if (value === 'failed') return 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300';
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

  return (
    <div className="mx-auto max-w-5xl space-y-7 pb-10">
      <section className="premium-card relative overflow-hidden p-6 sm:p-8">
        <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-green-500/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-[0.22em] text-green-600 dark:text-green-400">Your game plan</p>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">My bookings</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-gray-500 dark:text-gray-400">Everything you have booked, paid for, or refunded — kept simple and easy to track.</p>
          </div>
          <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-left dark:border-green-900/60 dark:bg-green-950/20 sm:text-right">
            <p className="text-2xl font-black text-green-700 dark:text-green-300">{bookings.length}</p>
            <p className="text-xs font-semibold text-green-700/70 dark:text-green-300/70">total sessions</p>
          </div>
        </div>
      </section>

      {error && <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-900/60 dark:bg-red-950/20 dark:text-red-300">{error}</div>}
      {notice && <div role="status" className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700 dark:border-green-900/60 dark:bg-green-950/20 dark:text-green-300">✓ {notice}</div>}

      {loading ? (
        <div className="space-y-4">{[1, 2, 3].map((x) => <div key={x} className="h-48 animate-pulse rounded-3xl bg-gray-200/80 dark:bg-gray-800/80" />)}</div>
      ) : sortedBookings.map((b, index) => (
        <article key={b._id} className="premium-card animate-fade-up overflow-hidden p-0" style={{ animationDelay: `${index * 50}ms` }}>
          <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex items-start gap-3">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-green-500 to-emerald-700 text-xl text-white shadow-lg shadow-green-600/20">⚽</div>
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wider text-green-600 dark:text-green-400">Turf session</p>
                  <h2 className="truncate text-xl font-black">{b.turf?.name || 'Turf'}</h2>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">📍 {b.turf?.location || 'Location unavailable'}</p>
                </div>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-gray-50 p-4 dark:bg-gray-800/60"><p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Date</p><p className="mt-1 font-bold">📅 {b.date}</p></div>
                <div className="rounded-2xl bg-gray-50 p-4 dark:bg-gray-800/60"><p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Time</p><p className="mt-1 font-bold">🕐 {formatHour(b.startHour)} – {formatHour(b.endHour)}</p></div>
              </div>
            </div>
            <div className="shrink-0 lg:min-w-[210px] lg:text-right">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Total</p>
              <p className="mt-1 text-3xl font-black">₹{b.totalPrice}</p>
              <div className="mt-3 flex flex-wrap gap-2 lg:justify-end">
                <span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${badgeClass(b.status)}`}>{b.status}</span>
                <span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${badgeClass(b.paymentStatus)}`}>{b.paymentStatus}</span>
                {b.refundStatus && b.refundStatus !== 'not_applicable' && <span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${badgeClass(b.refundStatus)}`}>Refund: {b.refundStatus}</span>}
              </div>
            </div>
          </div>

          {(b.paymentStatus === 'refunded' || b.refundStatus === 'failed' || b.notes) && <div className="space-y-3 border-t border-gray-100 px-5 py-4 dark:border-gray-800 sm:px-6">
            {b.paymentStatus === 'refunded' && <p className="rounded-2xl bg-amber-50 p-3 text-sm font-medium text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">Your payment has been refunded. Your bank or card provider may take some time to show the credit.</p>}
            {b.refundStatus === 'failed' && <p className="rounded-2xl bg-red-50 p-3 text-sm font-medium text-red-700 dark:bg-red-950/30 dark:text-red-300">The refund could not be completed automatically. Please contact the turf administrator.</p>}
            {b.notes && <p className="rounded-2xl bg-gray-50 p-3 text-sm text-gray-600 dark:bg-gray-800/60 dark:text-gray-300">Note: {b.notes}</p>}
          </div>}

          {b.status !== 'cancelled' && <div className="border-t border-gray-100 p-5 dark:border-gray-800 sm:px-6">
            <button onClick={() => cancel(b)} disabled={cancelling === b._id} className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-bold text-red-600 transition hover:-translate-y-0.5 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900 dark:hover:bg-red-950/30">{cancelling === b._id ? 'Cancelling…' : b.paymentStatus === 'paid' ? 'Cancel & refund' : 'Cancel booking'}</button>
          </div>}
        </article>
      ))}

      {!loading && !sortedBookings.length && <div className="premium-card border-dashed p-10 text-center"><div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-green-100 text-2xl dark:bg-green-950/40">⚽</div><h2 className="mt-4 text-xl font-black">No bookings yet</h2><p className="mx-auto mt-2 max-w-md text-sm text-gray-500 dark:text-gray-400">Pick a turf, choose your time, and get your next game on the calendar.</p></div>}
    </div>
  );
}
