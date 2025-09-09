import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create students
  const student1 = await prisma.user.upsert({
    where: { email: 'student1@example.com' },
    update: {},
    create: {
      email: 'student1@example.com',
      passwordHash: await bcrypt.hash('Password123!', 10),
      fullName: 'Student One',
      phone: '+966500000001',
      role: 'STUDENT',
      university: 'KSU',
      isVerified: true,
    },
  });

  const student2 = await prisma.user.upsert({
    where: { email: 'student2@example.com' },
    update: {},
    create: {
      email: 'student2@example.com',
      passwordHash: await bcrypt.hash('Password123!', 10),
      fullName: 'Student Two',
      phone: '+966500000002',
      role: 'STUDENT',
      university: 'KSU',
      isVerified: true,
    },
  });

  // Create drivers
  const driverUser1 = await prisma.user.upsert({
    where: { email: 'driver1@uniride.local' },
    update: {},
    create: {
      email: 'driver1@uniride.local',
      passwordHash: await bcrypt.hash('Password123!', 10),
      fullName: 'Aisha Driver',
      phone: '+966511111111',
      role: 'DRIVER',
      isVerified: true,
    },
  });

  const driver1 = await prisma.driver.upsert({
    where: { userId: driverUser1.id },
    update: {},
    create: {
      userId: driverUser1.id,
      photoUrl: 'https://i.pravatar.cc/150?img=47',
      licenseNumber: 'KSA-DRIV-001',
      vehicleMake: 'Toyota',
      vehicleModel: 'Hiace',
      vehiclePlate: 'ABC-1234',
      approved: true,
    },
  });

  // Trips
  const now = new Date();
  const in2h = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const in3h = new Date(now.getTime() + 3 * 60 * 60 * 1000);

  await prisma.trip.createMany({
    data: [
      {
        driverId: driver1.id,
        university: 'KSU',
        origin: 'Riyadh - Al Malaz',
        destination: 'KSU Main Gate',
        routeStops: ['Al Malaz', 'Olaya', 'KSU'],
        departureTime: in2h,
        arrivalTime: in3h,
        pricePerSeat: 25,
        totalSeats: 12,
        bookedSeats: 2,
      },
      {
        driverId: driver1.id,
        university: 'PNU',
        origin: 'Riyadh - Al Nakheel',
        destination: 'PNU Gate 2',
        routeStops: ['Al Nakheel', 'PNU'],
        departureTime: in3h,
        arrivalTime: new Date(in3h.getTime() + 60 * 60 * 1000),
        pricePerSeat: 20,
        totalSeats: 10,
        bookedSeats: 1,
      },
    ],
    skipDuplicates: true,
  });

  console.log('Seed completed:', { student1: student1.email, student2: student2.email });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

