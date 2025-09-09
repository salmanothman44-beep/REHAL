UniRide – Trusted Minibus Rides for Female University Students (KSA)

Overview

UniRide connects female university students in Saudi Arabia with verified minibus drivers. This monorepo contains the frontend (Next.js + Tailwind) and backend (Express + Prisma + PostgreSQL) services. Real-time seat availability is powered by Socket.IO. Payments can be integrated later with Stripe or a local gateway (Moyasar/Tamara).

Tech Stack

- Frontend: Next.js (React + TypeScript), TailwindCSS, shadcn-style UI components
- Backend: Node.js, Express, TypeScript
- Database: PostgreSQL via Prisma ORM
- Auth: Email/password with JWT (OTP endpoints scaffolded)
- Realtime: Socket.IO
- Deployment: Vercel (frontend), Render/Fly.io (backend)

Monorepo Structure

```
uniride/
  backend/
  frontend/
  README.md
```

Getting Started

1) Prerequisites

- Node.js 18+
- pnpm or npm
- PostgreSQL 13+

2) Environment Variables

Copy `.env.example` files to `.env` and fill values as needed.

- Backend: `uniride/backend/.env.example` → `.env`
- Frontend: `uniride/frontend/.env.example` → `.env.local`

3) Install Dependencies

Using pnpm (recommended):

```bash
cd backend && pnpm install && cd ../frontend && pnpm install
```

4) Database Setup

```bash
cd backend
pnpm prisma migrate dev --name init
pnpm prisma db seed
```

5) Run Services

- Backend (dev):
```bash
cd backend
pnpm dev
```

- Frontend (dev):
```bash
cd frontend
pnpm dev
```

Open the app at `http://localhost:3000` (frontend). The backend runs at `http://localhost:4000` by default.

Seed Accounts

- Student user: `student1@example.com` / `Password123!`
- Another student: `student2@example.com` / `Password123!`

Core Feature Implemented (E2E)

- Driver Listings + Booking Seats
  - Browse drivers and upcoming trips
  - Filter by university, route (origin/destination), and time
  - Real-time seat updates via Socket.IO when bookings are made
  - Book seats (with simple auth + JWT). Payments are stubbed (no gateway call).

Notes on OTP

Endpoints for sending and verifying OTP are scaffolded on the backend. For demo, bookings do not strictly require OTP, but you can enforce it via an environment variable later.

Deployment Notes

- Frontend (Vercel): Set `NEXT_PUBLIC_API_URL` to the deployed backend URL.
- Backend (Render/Fly.io): Set environment variables from `.env.example`. Provision a managed Postgres instance.

Security & Hardening

- Validates input via zod schemas on backend routes
- Uses JWT with HTTP-only cookies optional (currently Bearer token in demo)
- CORS configured to allow the frontend origin

Scripts Cheatsheet

Backend:
```bash
pnpm dev           # start in watch mode
pnpm build         # tsc build
pnpm start         # run built server
pnpm prisma:studio # open Prisma Studio
```

Frontend:
```bash
pnpm dev           # start Next.js dev server
pnpm build         # build
pnpm start         # start production server
```

License

For demo purposes only.

