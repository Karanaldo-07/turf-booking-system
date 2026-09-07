import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import http from '../api/http';
import { useAuth } from '../context/AuthContext';

const formatHour = (hour) => {
  const h = hour % 12 || 12;
  return `${h}:00 ${hour < 12 ? 'AM' : 'PM'}`;
};

const getLocalDate = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60 * 1000).toISOString().slice(0, 10);
};

const loadRazorpay = () => new Promise((resolve, reject) => {
  if (window.Razorpay) return resolve(true);
  const script = document.createElement('script');
  script.src = 'https://checkout.razorpay.com/v1/checkout.js';
  script.onload = () => resolve(true);
  script.onerror = () => reject(new Error('Unable to load payment checkout.'));
  document.body.appendChild(script);
});

export default function HomePage() {
  const [turfs, setTurfs] = useState([]);
  const [availability, setAvailability] = useState(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [form, setForm] = useState({ turfId: '', date: getLocalDate(), startHour: 18, endHour: 19, notes: '' });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    http.get('/turfs')
      .then(({ data }) => {
        setTurfs(data);
        if (data[0]) {
          const first = data[0];
          const startHour = Math.min(Math.max(18, first.availableHours?.start ?? 6), (first.availableHours?.end ?? 23) - 1);
          setForm((prev) => ({ ...prev, turfId: first._id, startHour, endHour: startHour + 1 }));
        }
      })
      .catch(() => setMessage({ type: 'error', text: 'Unable to load turfs. Please refresh.' }))
      .finally(() => setLoading(false));
  }, []);

  const selectedTurf = useMemo(() => turfs.find((t) => t._id === form.turfId), [turfs, form.turfId]);
  const start = Number(form.startHour);
  const end = Number(form.endHour);
  const totalPrice = selectedTurf && end > start ? (end - start) * selectedTurf.basePricePerHour : 0;
  const minDate = getLocalDate();

  useEffect(() => {
    if (!form.turfId || !form.date) {
      setAvailability(null);
      return;
    }

    setAvailabilityLoading(true);
    http.get('/bookings/availability', { params: { turfId: form.turfId, date: form.date } })
      .then(({ data }) => {
        setAvailability(data);
        const available = data.availableHours || [];
        const currentStartAvailable = available.includes(Number(form.startHour));
        const nextStart = currentStartAvailable ? Number(form.startHour) : available[0];
        if (nextStart !== undefined) {
          const possibleEnd = available.includes(nextStart + 1) ? nextStart + 1 : nextStart + 1;
          setForm((prev) => ({ ...prev, startHour: nextStart, endHour: possibleEnd }));
        }
      })
      .catch(() => setAvailability(null))
      .finally(() => setAvailabilityLoading(false));
  }, [form.turfId, form.date]);

  const isHourAvailable = (hour) => !availability || availability.availableHours?.includes(hour);
  const isRangeAvailable = (rangeStart, rangeEnd) => {
    if (!availability) return true;
    for (let hour = rangeStart; hour < rangeEnd; hour += 1) {
      if (!availability.availableHours?.includes(hour)) return false;
    }
    return true;
  };

  const startOptions = selectedTurf
    ? Array.from({ length: Math.max(0, selectedTurf.availableHours.end - selectedTurf.availableHours.start - 1) }, (_, index) => selectedTurf.availableHours.start + index)
      .filter(isHourAvailable)
    : [];

  const endOptions = selectedTurf
    ? Array.from({ length: Math.max(0, selectedTurf.availableHours.end - start) }, (_, index) => start + 1 + index)
      .filter((hour) => isRangeAvailable(start, hour))
    : [];

  const confirmMockBooking = async (bookingData) => {
    const payment = await http.post('/bookings/confirm-payment', {
      bookingId: bookingData.booking._id,
      razorpayOrderId: bookingData.order.id,
      razorpayPaymentId: `mock_payment_${Date.now()}`
    });
    setMessage({ type: 'success', text: payment.data.message });
  };

  const openRazorpay = async (bookingData) => {
    await loadRazorpay();
    if (!bookingData.razorpayKeyId) throw new Error('Payment configuration is missing.');

    await new Promise((resolve, reject) => {
      const checkout = new window.Razorpay({
        key: bookingData.razorpayKeyId,
        amount: bookingData.order.amount,
        currency: bookingData.order.currency,
        name: 'Turf Booking',
        description: `${selectedTurf.name} • ${bookingData.booking.duration} hour(s)`,
        order_id: bookingData.order.id,
        prefill: { name: user?.name || '', email: user?.email || '', contact: user?.phone || '' },
        theme: { color: '#16a34a' },
        handler: async (response) => {
          try {
            const payment = await http.post('/bookings/confirm-payment', {
              bookingId: bookingData.booking._id,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature
            });
            setMessage({ type: 'success', text: payment.data.message });
            resolve();
          } catch (error) {
            reject(new Error(error.response?.data?.message || 'Payment verification failed.'));
          }
        },
        modal: { ondismiss: () => reject(new Error('Payment was cancelled. Your slot is held temporarily and will expire automatically.')) }
      });
      checkout.on('payment.failed', (response) => reject(new Error(response.error?.description || 'Payment failed.')));
      checkout.open();
    });
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    if (!user) return setMessage({ type: 'error', text: 'Please login or register before booking.' });
    if (!selectedTurf || end <= start) return setMessage({ type: 'error', text: 'Please choose a valid time range.' });
    if (!isRangeAvailable(start, end)) return setMessage({ type: 'error', text: 'One or more selected hours are no longer available. Please refresh the slot list.' });

    setBooking(true);
    try {
      const { data } = await http.post('/bookings', form);
      if (data.mockPayment) await confirmMockBooking(data);
      else await openRazorpay(data);
      setForm((prev) => ({ ...prev, notes: '' }));
      const refreshed = await http.get('/bookings/availability', { params: { turfId: form.turfId, date: form.date } });
      setAvailability(refreshed.data);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || error.message || 'Booking failed. Please try again.' });
    } finally {
      setBooking(false);
    }
  };

  const setTurf = (turfId) => {
    const turf = turfs.find((t) => t._id === turfId);
    const startHour = Math.min(Math.max(18, turf?.availableHours?.start ?? 6), (turf?.availableHours?.end ?? 23) - 1);
    setAvailability(null);
    setForm((prev) => ({ ...prev, turfId, startHour, endHour: startHour + 1 }));
  };

  return (
    <div className="space-y-8 pb-8">
      <section className="relative overflow-hidden rounded-3xl bg-gray-950 px-6 py-12 text-white sm:px-10">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-green-500/20 blur-3xl" />
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-green-400">Turf Booking</p>
        <h1 className="max-w-2xl text-4xl font-black tracking-tight sm:text-5xl">Your game. Your slot. Your turf.</h1>
        <p className="mt-4 max-w-xl text-gray-300">Find a pitch, choose a time, and get your match booked in minutes.</p>
        {!user && <Link to="/register" className="mt-7 inline-flex rounded-xl bg-green-600 px-5 py-3 font-semibold hover:bg-green-500">Create free account</Link>}
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between">
          <div><h2 className="text-2xl font-bold">Available turfs</h2><p className="text-sm text-gray-500 dark:text-gray-400">Choose the pitch that fits your game.</p></div>
        </div>
        {loading ? <div className="grid gap-4 sm:grid-cols-2"><div className="h-72 animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-800" /><div className="h-72 animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-800" /></div> : turfs.length === 0 ? <div className="rounded-2xl border border-dashed p-8 text-center text-gray-500">No active turfs are available right now.</div> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {turfs.map((turf) => <article key={turf._id} className="overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
            <img src={turf.image || 'https://images.unsplash.com/photo-1526232761682-d26e03ac148e?auto=format&fit=crop&w=900&q=80'} alt={turf.name} className="h-48 w-full object-cover" />
            <div className="p-5"><div className="flex items-start justify-between gap-3"><h3 className="text-xl font-bold">{turf.name}</h3><span className="whitespace-nowrap rounded-full bg-green-50 px-2.5 py-1 text-sm font-bold text-green-700 dark:bg-green-950/40 dark:text-green-400">₹{turf.basePricePerHour}/hr</span></div>
              <p className="mt-1 text-sm text-gray-500">📍 {turf.location}</p><p className="mt-3 text-sm text-gray-600 dark:text-gray-300">{turf.description || 'Quality football turf for your next match.'}</p>
              <p className="mt-3 text-xs font-medium text-gray-500">Open {formatHour(turf.availableHours?.start ?? 6)} – {formatHour(turf.availableHours?.end ?? 23)}</p>
            </div></article>)}
        </div>}
      </section>

      <section className="rounded-2xl border bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-7">
        <div className="mb-6"><h2 className="text-2xl font-bold">Book a slot</h2><p className="text-sm text-gray-500 dark:text-gray-400">Live availability is checked before payment. A selected slot is held for 15 minutes during checkout.</p></div>
        <form className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" onSubmit={handleBooking}>
          <label className="text-sm font-medium">Turf<select className="field mt-1" value={form.turfId} onChange={(e) => setTurf(e.target.value)} required>{turfs.map((t) => <option value={t._id} key={t._id}>{t.name}</option>)}</select></label>
          <label className="text-sm font-medium">Date<input type="date" min={minDate} className="field mt-1" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required /></label>
          <label className="text-sm font-medium">Start time<select className="field mt-1" value={start} onChange={(e) => { const value = Number(e.target.value); const nextEnd = end > value && isRangeAvailable(value, end) ? end : value + 1; setForm({ ...form, startHour: value, endHour: nextEnd }); }} disabled={availabilityLoading || !startOptions.length} required>{startOptions.map((hour) => <option key={hour} value={hour}>{formatHour(hour)}</option>)}</select></label>
          <label className="text-sm font-medium">End time<select className="field mt-1" value={end} onChange={(e) => setForm({ ...form, endHour: Number(e.target.value) })} disabled={availabilityLoading || !endOptions.length} required>{endOptions.map((hour) => <option key={hour} value={hour}>{formatHour(hour)}</option>)}</select></label>
          <label className="text-sm font-medium sm:col-span-2 lg:col-span-3">Notes (optional)<input className="field mt-1" placeholder="e.g. 10 players, league match" maxLength="200" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
          <div className="flex items-end"><button disabled={booking || availabilityLoading || !turfs.length || !startOptions.length || !endOptions.length} className="w-full rounded-xl bg-green-600 px-5 py-3 font-bold text-white transition hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-50">{booking ? 'Booking…' : `Continue • ₹${totalPrice}`}</button></div>
        </form>
        {!availabilityLoading && availability && !startOptions.length && <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">No hourly slots are available for this date. Please choose another date.</p>}
        {message.text && <div className={`mt-4 rounded-xl px-4 py-3 text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-300' : 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300'}`}>{message.text}</div>}
      </section>
    </div>
  );
}
