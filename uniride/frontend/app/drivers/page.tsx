"use client";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { io, Socket } from "socket.io-client";

type TripItem = {
  id: string;
  driver: {
    id: string;
    name: string;
    photoUrl?: string | null;
    rating: number | null;
    vehicle: string;
    phoneMasked: string;
  };
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

export default function DriversPage() {
  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState<TripItem[]>([]);
  const [university, setUniversity] = useState("");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [time, setTime] = useState("");

  const api = useMemo(() => axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL }), []);
  const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_URL || "";
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const params: Record<string, string> = {};
    if (university) params.university = university;
    if (origin) params.origin = origin;
    if (destination) params.destination = destination;
    if (time) params.time = time;
    setLoading(true);
    api.get<{ trips: TripItem[] }>("/api/drivers", { params }).then((res) => {
      setTrips(res.data.trips);
    }).finally(() => setLoading(false));
  }, [api, university, origin, destination, time]);

  useEffect(() => {
    if (!socketUrl) return;
    const s = io(socketUrl, { transports: ["websocket"] });
    setSocket(s);
    s.on("trip:update", (payload: { tripId: string; availableSeats: number }) => {
      setTrips((prev) => prev.map((t) => (t.id === payload.tripId ? { ...t, availableSeats: payload.availableSeats } : t)));
    });
    return () => {
      s.disconnect();
    };
  }, [socketUrl]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="text-2xl font-semibold mb-4">Available Drivers</h1>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-6">
        <input className="border rounded px-3 py-2" placeholder="University (e.g., KSU)" value={university} onChange={(e) => setUniversity(e.target.value)} />
        <input className="border rounded px-3 py-2" placeholder="Origin" value={origin} onChange={(e) => setOrigin(e.target.value)} />
        <input className="border rounded px-3 py-2" placeholder="Destination" value={destination} onChange={(e) => setDestination(e.target.value)} />
        <input className="border rounded px-3 py-2" type="datetime-local" value={time} onChange={(e) => setTime(e.target.value)} />
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {trips.map((t) => (
            <div key={t.id} className="bg-white border rounded-lg p-4 flex items-center justify-between">
              <div>
                <div className="font-medium">{t.driver.name} <span className="text-sm text-gray-500">{t.driver.vehicle}</span></div>
                <div className="text-sm text-gray-600">{t.origin} → {t.destination}</div>
                <div className="text-sm text-gray-600">Departs: {new Date(t.departureTime).toLocaleString()}</div>
                <div className="text-sm">Price: SAR {t.pricePerSeat} · Available: {t.availableSeats}/{t.totalSeats}</div>
              </div>
              <div className="flex items-center gap-3">
                <Link href={`/trips/${t.id}`} className="bg-blue-600 text-white px-3 py-2 rounded-md text-sm">View</Link>
              </div>
            </div>
          ))}
          {!trips.length && <div className="text-gray-600">No trips found.</div>}
        </div>
      )}
    </div>
  );
}

