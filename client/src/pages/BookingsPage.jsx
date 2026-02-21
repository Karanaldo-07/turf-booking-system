import { useEffect, useState } from 'react';
import http from '../api/http';

export default function BookingsPage() {
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    http.get('/bookings/me').then((res) => setBookings(res.data));
  }, []);

  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold">My Bookings</h1>
      {bookings.map((b) => (
        <div key={b._id} className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-800">
          <p className="font-semibold">{b.turf?.name}</p>
          <p>{b.date} | {b.startHour}:00 - {b.endHour}:00</p>
          <p>₹{b.totalPrice} • {b.status} • {b.paymentStatus}</p>
        </div>
      ))}
      {!bookings.length && <p>No bookings yet.</p>}
    </div>
  );
}
