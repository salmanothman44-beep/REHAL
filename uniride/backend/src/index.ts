import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { Server } from 'socket.io';
import http from 'http';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_ORIGIN || '*',
    credentials: true,
  },
});

const prisma = new PrismaClient();

app.use(helmet());
app.use(express.json());
app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || '*',
    credentials: true,
  })
);

type AuthUser = { userId: string; role: string };

function authMiddleware(req: Request & { user?: AuthUser }, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return next();
  const token = authHeader.replace('Bearer ', '');
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as AuthUser;
    req.user = payload;
  } catch (e) {}
  next();
}

app.use(authMiddleware);

app.get('/health', (_req, res) => res.json({ ok: true }));

// Auth routes (minimal)
app.post('/api/auth/register', async (req, res) => {
  const { email, password, fullName, phone, university } = req.body;
  if (!email || !password || !fullName || !phone)
    return res.status(400).json({ error: 'Missing fields' });
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(400).json({ error: 'Email already registered' });
  const bcrypt = await import('bcryptjs');
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, passwordHash, fullName, phone, university, role: 'STUDENT' },
  });
  const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET as string, {
    expiresIn: '7d',
  });
  res.json({ token, user: { id: user.id, email: user.email, fullName: user.fullName } });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing fields' });
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const bcrypt = await import('bcryptjs');
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET as string, {
    expiresIn: '7d',
  });
  res.json({ token, user: { id: user.id, email: user.email, fullName: user.fullName } });
});

// Drivers listing
app.get('/api/drivers', async (req, res) => {
  const { university, origin, destination, time } = req.query as Record<string, string | undefined>;
  const where: any = {};
  if (university) where.university = university;
  if (origin) where.origin = { contains: origin, mode: 'insensitive' };
  if (destination) where.destination = { contains: destination, mode: 'insensitive' };
  if (time) {
    const date = new Date(time);
    if (!isNaN(date.getTime())) {
      where.departureTime = { gte: date };
    }
  }

  const trips = await prisma.trip.findMany({
    where,
    include: {
      driver: {
        include: {
          user: true,
        },
      },
    },
    orderBy: { departureTime: 'asc' },
    take: 50,
  });

  const result = trips.map((t) => ({
    id: t.id,
    driver: {
      id: t.driver.id,
      name: t.driver.user.fullName,
      photoUrl: t.driver.photoUrl,
      rating: null as number | null,
      vehicle: `${t.driver.vehicleMake} ${t.driver.vehicleModel} (${t.driver.vehiclePlate})`,
      phoneMasked: t.driver.user.phone.replace(/.(?=.{4})/g, '*'),
    },
    university: t.university,
    origin: t.origin,
    destination: t.destination,
    routeStops: t.routeStops,
    departureTime: t.departureTime,
    arrivalTime: t.arrivalTime,
    pricePerSeat: t.pricePerSeat,
    totalSeats: t.totalSeats,
    availableSeats: t.totalSeats - t.bookedSeats,
  }));

  res.json({ trips: result });
});

// Trip details
app.get('/api/trips/:id', async (req, res) => {
  const { id } = req.params;
  const trip = await prisma.trip.findUnique({
    where: { id },
    include: {
      driver: {
        include: { user: true },
      },
    },
  });
  if (!trip) return res.status(404).json({ error: 'Trip not found' });
  const result = {
    id: trip.id,
    driver: {
      id: trip.driver.id,
      name: trip.driver.user.fullName,
      photoUrl: trip.driver.photoUrl,
      vehicle: `${trip.driver.vehicleMake} ${trip.driver.vehicleModel} (${trip.driver.vehiclePlate})`,
      phoneMasked: trip.driver.user.phone.replace(/.(?=.{4})/g, '*'),
    },
    university: trip.university,
    origin: trip.origin,
    destination: trip.destination,
    routeStops: trip.routeStops,
    departureTime: trip.departureTime,
    arrivalTime: trip.arrivalTime,
    pricePerSeat: trip.pricePerSeat,
    totalSeats: trip.totalSeats,
    availableSeats: trip.totalSeats - trip.bookedSeats,
  };
  res.json({ trip: result });
});

// Create booking
app.post('/api/bookings', async (req: Request & { user?: AuthUser }, res) => {
  const { tripId, seats } = req.body as { tripId: string; seats: number };
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  if (!tripId || !seats || seats < 1) return res.status(400).json({ error: 'Invalid input' });

  const trip = await prisma.trip.findUnique({ where: { id: tripId } });
  if (!trip) return res.status(404).json({ error: 'Trip not found' });
  const available = trip.totalSeats - trip.bookedSeats;
  if (available < seats) return res.status(400).json({ error: 'Not enough seats' });

  const amountPaid = seats * trip.pricePerSeat; // placeholder, payment integration later
  const booking = await prisma.$transaction(async (tx) => {
    const updated = await tx.trip.update({
      where: { id: tripId },
      data: { bookedSeats: { increment: seats } },
    });
    const created = await tx.booking.create({
      data: {
        tripId,
        userId: req.user!.userId,
        seats,
        amountPaid,
        status: 'CONFIRMED',
      },
    });
    return { created, updated };
  });

  io.emit('trip:update', { tripId, availableSeats: trip.totalSeats - (trip.bookedSeats + seats) });
  res.status(201).json({ bookingId: booking.created.id });
});

// Current user bookings
app.get('/api/me/bookings', async (req: Request & { user?: AuthUser }, res) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const bookings = await prisma.booking.findMany({
    where: { userId: req.user.userId },
    include: { trip: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ bookings });
});

io.on('connection', (socket) => {
  socket.on('join:trip', (tripId: string) => {
    socket.join(`trip:${tripId}`);
  });
});

const port = Number(process.env.PORT || 4000);
server.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${port}`);
});

