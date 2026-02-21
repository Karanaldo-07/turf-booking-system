import { useEffect, useState } from 'react';
import http from '../api/http';

export default function AdminPage() {
  const [turfs, setTurfs] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [form, setForm] = useState({ name: '', location: '', basePricePerHour: 1000, image: '', description: '' });

  const load = async () => {
    const [turfRes, bookingRes] = await Promise.all([http.get('/turfs/admin/all'), http.get('/bookings/admin/all')]);
    setTurfs(turfRes.data);
    setBookings(bookingRes.data);
  };

  useEffect(() => {
    load();
  }, []);

  const createTurf = async (e) => {
    e.preventDefault();
    await http.post('/turfs', form);
    setForm({ name: '', location: '', basePricePerHour: 1000, image: '', description: '' });
    load();
  };

  const updateStatus = async (id, status) => {
    await http.put(`/bookings/admin/${id}/status`, { status });
    load();
  };

  const updatePrice = async (id, price) => {
    await http.put(`/turfs/${id}`, { basePricePerHour: Number(price) });
    load();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">Admin Dashboard</h1>
      <form onSubmit={createTurf} className="grid md:grid-cols-3 gap-2 bg-white dark:bg-gray-900 p-4 rounded-xl">
        <input required placeholder="Turf name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="p-2 rounded bg-gray-100 dark:bg-gray-800" />
        <input required placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="p-2 rounded bg-gray-100 dark:bg-gray-800" />
        <input type="number" required placeholder="Price/hour" value={form.basePricePerHour} onChange={(e) => setForm({ ...form, basePricePerHour: Number(e.target.value) })} className="p-2 rounded bg-gray-100 dark:bg-gray-800" />
        <input placeholder="Image URL" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} className="p-2 rounded bg-gray-100 dark:bg-gray-800 md:col-span-2" />
        <input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="p-2 rounded bg-gray-100 dark:bg-gray-800" />
        <button className="bg-pitch text-white rounded p-2 md:col-span-3">Add Turf</button>
      </form>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Manage Turfs & Pricing</h2>
        {turfs.map((t) => (
          <div key={t._id} className="bg-white dark:bg-gray-900 p-3 rounded flex items-center justify-between gap-3">
            <div><p className="font-semibold">{t.name}</p><p className="text-sm">{t.location}</p></div>
            <input defaultValue={t.basePricePerHour} type="number" className="p-2 rounded bg-gray-100 dark:bg-gray-800 w-36" onBlur={(e) => updatePrice(t._id, e.target.value)} />
          </div>
        ))}
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">All Bookings</h2>
        {bookings.map((b) => (
          <div key={b._id} className="bg-white dark:bg-gray-900 p-3 rounded flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold">{b.user?.name} - {b.turf?.name}</p>
              <p className="text-sm">{b.date} {b.startHour}:00-{b.endHour}:00 | ₹{b.totalPrice}</p>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1 bg-green-600 text-white rounded" onClick={() => updateStatus(b._id, 'approved')}>Approve</button>
              <button className="px-3 py-1 bg-red-600 text-white rounded" onClick={() => updateStatus(b._id, 'cancelled')}>Cancel</button>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
