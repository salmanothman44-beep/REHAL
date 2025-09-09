"use client";
import { useState, useMemo } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [university, setUniversity] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const api = useMemo(() => axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL }), []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const res = await api.post("/api/auth/register", { fullName, email, phone, university, password });
      localStorage.setItem("token", res.data.token);
      router.push("/drivers");
    } catch (e: any) {
      setError(e?.response?.data?.error || "Registration failed");
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-2xl font-semibold mb-4">Create account</h1>
      <form onSubmit={submit} className="space-y-3">
        <input className="border rounded w-full px-3 py-2" placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        <input className="border rounded w-full px-3 py-2" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="border rounded w-full px-3 py-2" placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <input className="border rounded w-full px-3 py-2" placeholder="University (optional)" value={university} onChange={(e) => setUniversity(e.target.value)} />
        <input className="border rounded w-full px-3 py-2" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-md">Register</button>
      </form>
    </div>
  );
}

