import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <div className="font-bold text-xl">UniRide</div>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/drivers" className="hover:underline">Drivers</Link>
            <Link href="/dashboard" className="hover:underline">Dashboard</Link>
            <Link href="/auth/login" className="hover:underline">Login</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-3xl font-semibold mb-2">Trusted rides to your university</h1>
        <p className="text-gray-600 mb-6">Book seats with verified minibus drivers. Real-time availability, ratings, and secure booking.</p>
        <Link href="/drivers" className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md">Find a driver</Link>
      </main>
    </div>
  );
}
