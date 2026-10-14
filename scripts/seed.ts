import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const NODE_ENV = process.env.NODE_ENV || 'development';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smart_school_erp';

if (NODE_ENV === 'production') {
  console.error('❌ Refusing to run development seed script in PRODUCTION environment.');
  process.exit(1);
}

async function seed() {
  console.log('🌱 Starting development seed...');
  console.log(`Connecting to: ${MONGODB_URI.replace(/\/\/.*@/, '//<credentials>@')}`);

  await mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
  });

  const { School } = await import('../apps/api/src/modules/schools/school.model.js');
  const { User } = await import('../apps/api/src/modules/auth/user.model.js');

  // 1. Seed Demo School
  let demoSchool = await School.findOne({ slug: 'springfield-academy' });
  if (!demoSchool) {
    demoSchool = await School.create({
      name: 'Springfield Academy',
      slug: 'springfield-academy',
      code: 'SPA-001',
      status: 'active',
      contactEmail: 'contact@springfield.edu',
      contactPhone: '+1 (555) 234-5678',
      address: {
        street: '742 Evergreen Terrace',
        city: 'Springfield',
        state: 'OR',
        postalCode: '97477',
        country: 'US',
      },
      settings: {
        academicYear: '2026-2027',
        timezone: 'America/Los_Angeles',
        currency: 'USD',
      },
    });
    console.log('✅ Demo School created: Springfield Academy (@springfield-academy)');
  } else {
    console.log('ℹ️  Demo School already exists: Springfield Academy');
  }

  // 2. Seed Users
  const usersToSeed = [
    {
      name: 'Eleanor Vance',
      email: 'admin@springfield.edu',
      password: 'Admin@123456',
      role: 'school_admin',
      schoolId: demoSchool._id,
    },
    {
      name: 'Marcus Brody',
      email: 'teacher@springfield.edu',
      password: 'Teacher@123456',
      role: 'teacher',
      schoolId: demoSchool._id,
    },
    {
      name: 'Platform Overseer',
      email: 'superadmin@platform.local',
      password: 'SuperAdmin@123456',
      role: 'super_admin',
      schoolId: undefined,
    },
  ];

  for (const item of usersToSeed) {
    const existing = await User.findOne({ email: item.email.toLowerCase() });
    if (!existing) {
      const passwordHash = await bcrypt.hash(item.password, 10);
      await User.create({
        name: item.name,
        email: item.email.toLowerCase(),
        passwordHash,
        role: item.role,
        schoolId: item.schoolId,
        isActive: true,
      });
      console.log(`✅ Created ${item.role}: ${item.email} (Password: ${item.password})`);
    } else {
      console.log(`ℹ️  User already exists: ${item.email}`);
    }
  }

  console.log('\n🎉 Development seed completed successfully!');
  console.log('---------------------------------------------------------');
  console.log('Development Credentials:');
  console.log('1. School Admin:  admin@springfield.edu      / Admin@123456');
  console.log('2. Teacher:       teacher@springfield.edu    / Teacher@123456');
  console.log('3. Super Admin:   superadmin@platform.local  / SuperAdmin@123456');
  console.log('---------------------------------------------------------');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('❌ Seeding failed:', err.message);
  process.exit(1);
});
