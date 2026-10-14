import bcrypt from 'bcryptjs';
import { School } from '../modules/schools/school.model.js';
import { User } from '../modules/auth/user.model.js';
import { Student } from '../modules/students/student.model.js';
import { SubscriptionInvoice } from '../modules/invoices/invoice.model.js';
import { logger } from '../utils/logger.js';

export async function seedDemoData(): Promise<void> {
  try {
    let demoSchool = await School.findOne({ slug: 'springfield-academy' });
    if (!demoSchool) {
      demoSchool = await School.create({
        name: 'Springfield Academy',
        slug: 'springfield-academy',
        code: 'SPA-001',
        status: 'active',
        contactEmail: 'contact@springfield.edu',
        contactPhone: '+1 (555) 234-5678',
        settings: {
          academicYear: '2026-2027',
          timezone: 'America/Los_Angeles',
          currency: 'USD',
          dateFormat: 'YYYY-MM-DD',
          language: 'en',
        },
        branding: {
          logoUrl: '',
          faviconUrl: '',
          primaryColor: '#4f46e5',
          secondaryColor: '#0f172a',
          accentColor: '#06b6d4',
          loginTitle: 'Springfield Academy Portal',
          loginSubtitle: 'Excellence in education and character development.',
          receiptHeader: 'Springfield Academy — Official Fee Receipt',
          receiptFooter: 'Thank you for investing in quality education.',
          taxId: 'TAX-982144-SPA',
          authorizedSignatoryName: 'Dr. Arthur Pendelton',
          authorizedSignatoryTitle: 'Head of Administration',
          idCardTemplate: 'modern',
          idCardShowBloodGroup: true,
          idCardShowEmergencyContact: true,
        },
        subscription: {
          plan: 'annual',
          status: 'active',
          startDate: new Date(),
          expiryDate: new Date(Date.now() + 330 * 24 * 60 * 60 * 1000), // ~11 months remaining
          gracePeriodDays: 14,
          maxStudents: 2500,
          maxUsers: 100,
          maxStorageMB: 25000,
          features: ['students', 'academics', 'branding', 'reports', 'custom_domain', 'api_access'],
          autoRenew: true,
          notes: 'Standard Institution Annual License',
        },
        customDomain: {
          domain: 'erp.springfield.edu',
          status: 'verified',
          verificationToken: 'smartschool-verify-spa-prod',
          dnsRecordType: 'TXT',
          expectedValue: 'smartschool-verify-spa-prod',
          verifiedAt: new Date(),
          lastCheckedAt: new Date(),
          sslStatus: 'active',
        },
        usage: {
          studentCount: 5,
          userCount: 2,
          storageUsedMB: 12,
          lastActivityAt: new Date(),
        },
      });
      logger.info('🌱 Demo School seeded: Springfield Academy');
    }

    let schoolB = await School.findOne({ slug: 'riverdale-collegiate' });
    if (!schoolB) {
      schoolB = await School.create({
        name: 'Riverdale Collegiate',
        slug: 'riverdale-collegiate',
        code: 'RIV-002',
        status: 'active',
        contactEmail: 'contact@riverdale.edu',
        contactPhone: '+1 (555) 789-0123',
        settings: {
          academicYear: '2026-2027',
          timezone: 'America/New_York',
          currency: 'USD',
          dateFormat: 'YYYY-MM-DD',
          language: 'en',
        },
        branding: {
          primaryColor: '#0284c7', // Sky 600
          secondaryColor: '#1e293b',
          accentColor: '#10b981',
          loginTitle: 'Riverdale Collegiate Portal',
          loginSubtitle: 'Empowering minds, inspiring futures.',
        },
        subscription: {
          plan: 'monthly',
          status: 'active',
          startDate: new Date(),
          expiryDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000), // 25 days remaining
          gracePeriodDays: 14,
          maxStudents: 500,
          maxUsers: 25,
          maxStorageMB: 5000,
          features: ['students', 'academics', 'branding', 'reports'],
          autoRenew: false,
          notes: 'Standard Monthly Subscription',
        },
        customDomain: {
          domain: 'portal.riverdale.edu',
          status: 'pending',
          verificationToken: 'smartschool-verify-riv-99a',
          dnsRecordType: 'TXT',
          expectedValue: 'smartschool-verify-riv-99a',
          sslStatus: 'provisioning',
        },
        usage: {
          studentCount: 0,
          userCount: 1,
          storageUsedMB: 0,
          lastActivityAt: new Date(),
        },
      });
      logger.info('🌱 Demo School seeded: Riverdale Collegiate');
    }

    const usersToSeed = [
      {
        name: 'Eleanor Vance',
        email: 'admin@springfield.edu',
        password: 'Admin@123456',
        role: 'school_admin' as const,
        schoolId: demoSchool._id,
      },
      {
        name: 'Marcus Brody',
        email: 'teacher@springfield.edu',
        password: 'Teacher@123456',
        role: 'teacher' as const,
        schoolId: demoSchool._id,
      },
      {
        name: 'Platform Overseer',
        email: 'superadmin@platform.local',
        password: 'SuperAdmin@123456',
        role: 'super_admin' as const,
        schoolId: undefined,
      },
      {
        name: 'Reginald Mantle',
        email: 'admin@riverdale.edu',
        password: 'Admin@123456',
        role: 'school_admin' as const,
        schoolId: schoolB._id,
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
        logger.info(`🌱 Demo user seeded: ${item.email} (${item.role})`);
      }
    }

    // Seed mock students (Fictional educational records for demonstration)
    const mockStudents = [
      {
        admissionNumber: 'ADM-2026-0001',
        admissionDate: new Date('2026-08-15'),
        academicSession: '2026-2027',
        firstName: 'Lucas',
        lastName: 'Alvarez',
        dateOfBirth: new Date('2011-04-12'),
        gender: 'male' as const,
        bloodGroup: 'O+',
        nationalId: 'ID-88412',
        class: 'Grade 10',
        section: 'A',
        rollNumber: '101',
        email: 'lucas.alvarez@student.demo',
        phone: '+1 (555) 301-4412',
        currentAddress: { street: '42 Maple Street', city: 'Springfield', state: 'OR', postalCode: '97477', country: 'US' },
        guardian: {
          guardianName: 'Roberto Alvarez',
          guardianRelation: 'Father',
          guardianPhone: '+1 (555) 301-9981',
          guardianEmail: 'roberto.alvarez@email.demo',
          guardianOccupation: 'Civil Engineer',
          fatherName: 'Roberto Alvarez',
          fatherPhone: '+1 (555) 301-9981',
          motherName: 'Carmen Alvarez',
          motherPhone: '+1 (555) 301-9982',
        },
        status: 'active' as const,
        notes: 'Honor roll student. President of the high school robotics club.',
      },
      {
        admissionNumber: 'ADM-2026-0002',
        admissionDate: new Date('2026-08-16'),
        academicSession: '2026-2027',
        firstName: 'Sophia',
        lastName: 'Chen',
        dateOfBirth: new Date('2011-09-24'),
        gender: 'female' as const,
        bloodGroup: 'A+',
        nationalId: 'ID-99201',
        class: 'Grade 10',
        section: 'A',
        rollNumber: '102',
        email: 'sophia.chen@student.demo',
        phone: '+1 (555) 412-8821',
        currentAddress: { street: '108 Oak Avenue', city: 'Springfield', state: 'OR', postalCode: '97477', country: 'US' },
        guardian: {
          guardianName: 'Dr. Wei Chen',
          guardianRelation: 'Mother',
          guardianPhone: '+1 (555) 412-7711',
          guardianEmail: 'wei.chen@email.demo',
          guardianOccupation: 'Pediatrician',
          fatherName: 'David Chen',
          motherName: 'Dr. Wei Chen',
        },
        status: 'active' as const,
        notes: 'Member of school orchestra (violin).',
      },
      {
        admissionNumber: 'ADM-2026-0003',
        admissionDate: new Date('2026-08-18'),
        academicSession: '2026-2027',
        firstName: 'Ethan',
        lastName: 'O\'Connor',
        dateOfBirth: new Date('2012-02-14'),
        gender: 'male' as const,
        bloodGroup: 'B+',
        nationalId: 'ID-77312',
        class: 'Grade 9',
        section: 'B',
        rollNumber: '201',
        email: 'ethan.oconnor@student.demo',
        phone: '+1 (555) 612-4411',
        currentAddress: { street: '19 Pinecrest Drive', city: 'Springfield', state: 'OR', postalCode: '97477', country: 'US' },
        guardian: {
          guardianName: 'Sean O\'Connor',
          guardianRelation: 'Father',
          guardianPhone: '+1 (555) 612-9900',
          guardianEmail: 'sean.oconnor@email.demo',
          guardianOccupation: 'Architect',
        },
        status: 'active' as const,
      },
      {
        admissionNumber: 'ADM-2026-0004',
        admissionDate: new Date('2026-08-20'),
        academicSession: '2026-2027',
        firstName: 'Aaliyah',
        lastName: 'Patel',
        dateOfBirth: new Date('2010-11-05'),
        gender: 'female' as const,
        bloodGroup: 'AB+',
        nationalId: 'ID-55120',
        class: 'Grade 11',
        section: 'A',
        rollNumber: '301',
        email: 'aaliyah.patel@student.demo',
        phone: '+1 (555) 819-3312',
        currentAddress: { street: '77 Cedar Boulevard', city: 'Springfield', state: 'OR', postalCode: '97477', country: 'US' },
        guardian: {
          guardianName: 'Sunita Patel',
          guardianRelation: 'Mother',
          guardianPhone: '+1 (555) 819-2200',
          guardianEmail: 'sunita.patel@email.demo',
          guardianOccupation: 'Financial Analyst',
        },
        status: 'active' as const,
      },
      {
        admissionNumber: 'ADM-2026-0005',
        admissionDate: new Date('2026-08-22'),
        academicSession: '2026-2027',
        firstName: 'Noah',
        lastName: 'Kim',
        dateOfBirth: new Date('2011-06-30'),
        gender: 'male' as const,
        bloodGroup: 'O-',
        nationalId: 'ID-44211',
        class: 'Grade 10',
        section: 'B',
        rollNumber: '103',
        currentAddress: { street: '22 Elm Street', city: 'Springfield', state: 'OR', postalCode: '97477', country: 'US' },
        guardian: {
          guardianName: 'Jin-Woo Kim',
          guardianRelation: 'Father',
          guardianPhone: '+1 (555) 902-1144',
          guardianEmail: 'jinwoo.kim@email.demo',
        },
        status: 'inactive' as const,
        notes: 'Temporarily inactive pending health leave of absence.',
      },
    ];

    for (const studentData of mockStudents) {
      const existingStudent = await Student.findOne({
        schoolId: demoSchool._id,
        admissionNumber: studentData.admissionNumber,
      });

      if (!existingStudent) {
        await Student.create({
          ...studentData,
          schoolId: demoSchool._id,
        });
        logger.info(`🌱 Seeded student: ${studentData.firstName} ${studentData.lastName} (${studentData.admissionNumber})`);
      }
    }

    // Seed Demo Invoices
    const existingInvoice = await SubscriptionInvoice.findOne({ invoiceNumber: 'INV-2026-0001' });
    if (!existingInvoice) {
      await SubscriptionInvoice.create({
        invoiceNumber: 'INV-2026-0001',
        schoolId: demoSchool._id.toString(),
        schoolName: demoSchool.name,
        plan: 'annual',
        amount: 2400,
        currency: 'USD',
        billingCycle: 'Annual',
        status: 'paid',
        dueDate: new Date(),
        paidAt: new Date(),
        paymentMethod: 'Wire Transfer / Stripe',
        notes: 'Annual license subscription renewal for 2026-2027.',
      });
      logger.info('🌱 Demo invoice seeded: INV-2026-0001');
    }
  } catch (err: unknown) {
    logger.warn('Failed to seed development data:', err);
  }
}
