"use client";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import { io } from "socket.io-client";

type Trip = {
  id: string;
  driver: { id: string; name: string; photoUrl?: string | null; vehicle: string; phoneMasked: string };
  university: string;
  origin: string;
  destination: string;
  routeStops: string[];
  departureTime: string;
  arrivalTime: string;
  pricePerSeat: number;
  totalSeats: number;
  availableSeats: number;
};

export default function TripDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [seats, setSeats] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const api = useMemo(() => axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL }), []);
  const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_URL || "";

  useEffect(() => {
    setLoading(true);
    api.get<{ trip: Trip }>(`/api/trips/${params.id}`).then((res) => setTrip(res.data.trip)).catch(() => setError("Failed to load trip")).finally(() => setLoading(false));
  }, [api, params.id]);

  useEffect(() => {
    if (!socketUrl || !params.id) return;
    const s = io(socketUrl, { transports: ["websocket"] });
    s.on("trip:update", (payload: { tripId: string; availableSeats: number }) => {
      if (payload.tripId === params.id) {
        setTrip((t) => (t ? { ...t, availableSeats: payload.availableSeats } : t));
      }
    });
    return () => {
      s.disconnect();
    };
  }, [socketUrl, params.id]);

  async function book() {
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await api.post(
        "/api/bookings",
        { tripId: params.id, seats: Number(seats) },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      router.push("/dashboard?booked=1");
    } catch (e: any) {
      setError(e?.response?.data?.error || "Booking failed");
    }
  }

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!trip) return <div className="p-6">Not found</div>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="text-2xl font-semibold mb-2">{trip.origin} → {trip.destination}</h1>
      <div className="text-gray-600 mb-4">Driver: {trip.driver.name} · {trip.driver.vehicle}</div>
      <div className="bg-white border rounded p-4 mb-4">
        <div>University: {trip.university}</div>
        <div>Departure: {new Date(trip.departureTime).toLocaleString()}</div>
        <div>Arrival: {new Date(trip.arrivalTime).toLocaleString()}</div>
        <div>Price/seat: SAR {trip.pricePerSeat}</div>
        <div>Available: {trip.availableSeats}/{trip.totalSeats}</div>
      </div>
      <div className="flex items-center gap-3">
        <input type="number" min={1} max={trip.availableSeats} value={seats} onChange={(e) => setSeats(Number(e.target.value))} className="border rounded px-3 py-2 w-24" />
        <button onClick={book} className="bg-blue-600 text-white px-4 py-2 rounded-md">Book</button>
      </div>
    </div>
  );
}

