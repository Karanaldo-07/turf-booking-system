import { useEffect, useMemo, useState } from 'react';
import http from '../api/http';
import { useAuth } from '../context/AuthContext';

export default function HomePage() {
  const [turfs, setTurfs] = useState([]);
  const [form, setForm] = useState({ turfId: '', date: '', startHour: 18, endHour: 19 });
  const [message, setMessage] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    http.get('/turfs').then((res) => {
      setTurfs(res.data);
      if (res.data[0]) setForm((prev) => ({ ...prev, turfId: res.data[0]._id }));
    });
  }, []);

  const selectedTurf = useMemo(() => turfs.find((t) => t._id === form.turfId), [turfs, form.turfId]);
  const totalPrice = selectedTurf ? (form.endHour - form.startHour) * selectedTurf.basePricePerHour : 0;

  const handleBooking = async (e) => {
    e.preventDefault();
    setMessage('');
    if (!user) return setMessage('Please login to book a turf');

    try {
      const { data } = await http.post('/bookings', form);
      const payment = await http.post('/bookings/confirm-payment', {
        bookingId: data.booking._id,
        razorpayPaymentId: `simulated_${Date.now()}`
      });
      setMessage(payment.data.message);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Booking failed');
    }
  };

  return (
    <div className="space-y-6">
      <section className="bg-gradient-to-r from-green-700 to-black text-white rounded-2xl p-6">
        <h1 className="text-3xl font-bold">Book Your Next Football Match</h1>
        <p className="opacity-90 mt-2">Find premium turfs, pick slots, and confirm instantly.</p>
      </section>

      <section className="grid md:grid-cols-2 gap-4">
        {turfs.map((turf) => (
          <article key={turf._id} className="bg-white dark:bg-gray-900 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800">
            <img src={turf.image} alt={turf.name} className="h-44 w-full object-cover" />
            <div className="p-4">
              <h3 className="font-semibold text-xl">{turf.name}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">{turf.location}</p>
              <p className="text-sm mt-2">{turf.description}</p>
              <p className="mt-3 text-pitch font-semibold">₹{turf.basePricePerHour} / hour</p>
            </div>
          </article>
        ))}
      </section>

      <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
        <h2 className="text-2xl font-semibold mb-4">Create Booking</h2>
        <form className="grid md:grid-cols-4 gap-3" onSubmit={handleBooking}>
          <select className="p-2 rounded bg-gray-100 dark:bg-gray-800" value={form.turfId} onChange={(e) => setForm({ ...form, turfId: e.target.value })}>
            {turfs.map((t) => (
              <option value={t._id} key={t._id}>{t.name}</option>
            ))}
          </select>
          <input type="date" className="p-2 rounded bg-gray-100 dark:bg-gray-800" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
          <input type="number" min="0" max="23" className="p-2 rounded bg-gray-100 dark:bg-gray-800" value={form.startHour} onChange={(e) => setForm({ ...form, startHour: Number(e.target.value) })} />
          <input type="number" min="1" max="24" className="p-2 rounded bg-gray-100 dark:bg-gray-800" value={form.endHour} onChange={(e) => setForm({ ...form, endHour: Number(e.target.value) })} />
          <div className="md:col-span-4 flex items-center justify-between">
            <p>Estimated Price: <strong>₹{Number.isFinite(totalPrice) ? totalPrice : 0}</strong></p>
            <button className="px-4 py-2 rounded-lg bg-pitch text-white">Pay & Confirm</button>
          </div>
        </form>
        {message && <p className="mt-3 text-sm text-pitch">{message}</p>}
      </section>
    </div>
  );
}
