import { useEffect, useMemo, useState } from 'react';
import http from '../api/http';

const initialForm = {
  name: '',
  location: '',
  basePricePerHour: 1000,
  image: '',
  description: '',
  start: 6,
  end: 23
};

const formatHour = (hour) => `${hour % 12 || 12}:00 ${hour < 12 ? 'AM' : 'PM'}`;

export default function AdminPage() {
  const [turfs, setTurfs] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const load = async () => {
    setLoading(true);
    try {
      const [turfRes, bookingRes] = await Promise.all([http.get('/turfs/admin/all'), http.get('/bookings/admin/all')]);
      setTurfs(turfRes.data);
      setBookings(bookingRes.data);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Unable to load admin data.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const stats = useMemo(() => ({
    activeTurfs: turfs.filter((t) => t.isActive).length,
    totalBookings: bookings.length,
    paidBookings: bookings.filter((b) => b.paymentStatus === 'paid').length,
    revenue: bookings.filter((b) => b.paymentStatus === 'paid').reduce((sum, b) => sum + Number(b.totalPrice || 0), 0)
  }), [turfs, bookings]);

  const createTurf = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      await http.post('/turfs', {
        name: form.name,
        location: form.location,
        basePricePerHour: Number(form.basePricePerHour),
        image: form.image,
        description: form.description,
        availableHours: { start: Number(form.start), end: Number(form.end) }
      });
      setForm(initialForm);
      setMessage({ type: 'success', text: 'Turf added successfully.' });
      await load();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Unable to add turf.' });
    } finally {
      setSaving(false);
    }
  };

  const updateTurf = async (id, payload) => {
    try {
      await http.put(`/turfs/${id}`, payload);
      setMessage({ type: 'success', text: 'Turf updated.' });
      await load();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Unable to update turf.' });
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await http.put(`/bookings/admin/${id}/status`, { status });
      await load();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Unable to update booking.' });
    }
  };

  const deactivate = async (turf) => {
    try {
      if (turf.isActive) await http.delete(`/turfs/${turf._id}`);
      else await http.put(`/turfs/${turf._id}`, { isActive: true });
      await load();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Unable to change turf status.' });
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <div><h1 className="text-3xl font-black">Admin Dashboard</h1><p className="mt-1 text-sm text-gray-500">Manage turfs, pricing, availability and bookings.</p></div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['Active turfs', stats.activeTurfs],
          ['Bookings', stats.totalBookings],
          ['Paid bookings', stats.paidBookings],
          ['Net revenue', `₹${stats.revenue}`]
        ].map(([label, value]) => <div key={label} className="rounded-2xl border bg-white p-5 dark:border-gray-800 dark:bg-gray-900"><p className="text-sm text-gray-500">{label}</p><p className="mt-2 text-2xl font-black">{value}</p></div>)}
      </div>

      {message.text && <div className={`rounded-xl px-4 py-3 text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-300' : 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300'}`}>{message.text}</div>}

      <form onSubmit={createTurf} className="grid gap-3 rounded-2xl border bg-white p-5 dark:border-gray-800 dark:bg-gray-900 sm:grid-cols-2 lg:grid-cols-3">
        <h2 className="sm:col-span-2 lg:col-span-3 text-xl font-bold">Add turf</h2>
        <input required placeholder="Turf name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="field" />
        <input required placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="field" />
        <input type="number" min="1" required placeholder="Price/hour" value={form.basePricePerHour} onChange={(e) => setForm({ ...form, basePricePerHour: e.target.value })} className="field" />
        <input placeholder="Image URL" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} className="field" />
        <input placeholder="Description" maxLength="1000" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="field" />
        <div className="grid grid-cols-2 gap-3"><input type="number" min="0" max="23" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} className="field" aria-label="Opening hour" /><input type="number" min="1" max="24" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} className="field" aria-label="Closing hour" /></div>
        <button disabled={saving} className="rounded-xl bg-pitch px-4 py-3 font-bold text-white disabled:opacity-50 sm:col-span-2 lg:col-span-3">{saving ? 'Adding…' : 'Add Turf'}</button>
      </form>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">Manage turfs</h2>
        {loading ? <div className="h-32 animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-800" /> : turfs.map((t) => (
          <div key={t._id} className="rounded-2xl border bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div><p className="font-bold">{t.name}</p><p className="text-sm text-gray-500">{t.location} • {formatHour(t.availableHours.start)}–{formatHour(t.availableHours.end)}</p></div>
              <div className="flex flex-wrap items-center gap-2">
                <input defaultValue={t.basePricePerHour} type="number" min="1" className="field w-32" aria-label={`Price for ${t.name}`} onBlur={(e) => updateTurf(t._id, { basePricePerHour: Number(e.target.value) })} />
                <button onClick={() => deactivate(t)} className={`rounded-lg px-3 py-2 text-sm font-semibold ${t.isActive ? 'border border-red-200 text-red-600 dark:border-red-900' : 'bg-green-600 text-white'}`}>{t.isActive ? 'Deactivate' : 'Activate'}</button>
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <div><h2 className="text-xl font-bold">All bookings</h2><p className="text-sm text-gray-500">Payment and refund status are separate from booking status.</p></div>
        {!loading && !bookings.length && <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-gray-500">No bookings yet.</div>}
        {bookings.map((b) => (
          <div key={b._id} className="rounded-2xl border bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div><p className="font-bold">{b.user?.name || 'User'} · {b.turf?.name || 'Turf'}</p><p className="text-sm text-gray-500">{b.date} • {formatHour(b.startHour)}–{formatHour(b.endHour)} • ₹{b.totalPrice}</p><div className="mt-2 flex flex-wrap gap-2"><span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold dark:bg-gray-800">{b.status}</span><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${b.paymentStatus === 'refunded' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' : b.paymentStatus === 'paid' ? 'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300' : 'bg-gray-100 dark:bg-gray-800'}`}>{b.paymentStatus}</span>{b.refundStatus && b.refundStatus !== 'not_applicable' && <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">refund: {b.refundStatus}</span>}</div></div>
              <div className="flex gap-2">
                {b.status !== 'approved' && b.status !== 'cancelled' && <button onClick={() => updateStatus(b._id, 'approved')} className="rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white">Approve</button>}
                {b.status !== 'cancelled' && <button onClick={() => updateStatus(b._id, 'cancelled')} className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 dark:border-red-900">Cancel</button>}
              </div>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
