"use client";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";

type Booking = { id: string; seats: number; amountPaid: number; createdAt: string; trip: { origin: string; destination: string; departureTime: string } };

export default function DashboardPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState("");
  const api = useMemo(() => axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL }), []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    api.get<{ bookings: Booking[] }>("/api/me/bookings", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setBookings(res.data.bookings))
      .catch(() => setError("Failed to load bookings"));
  }, [api]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="text-2xl font-semibold mb-4">Your Bookings</h1>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <div className="space-y-3">
        {bookings.map((b) => (
          <div key={b.id} className="bg-white border rounded p-4">
            <div className="font-medium">{b.trip.origin} → {b.trip.destination}</div>
            <div className="text-sm text-gray-600">Depart: {new Date(b.trip.departureTime).toLocaleString()}</div>
            <div className="text-sm">Seats: {b.seats} · Paid: SAR {b.amountPaid}</div>
          </div>
        ))}
        {!bookings.length && <div className="text-gray-600">No bookings yet.</div>}
      </div>
    </div>
  );
}

