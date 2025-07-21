import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

async function main() {
  console.log('🌱 Starting database seeding...')

  // Clear existing data (for development)
  if (process.env.NODE_ENV === 'development') {
    console.log('🗑️  Clearing existing data...')
    await prisma.auditLog.deleteMany()
    await prisma.notification.deleteMany()
    await prisma.clientNotification.deleteMany()
    await prisma.projectCommunication.deleteMany()
    await prisma.projectDocument.deleteMany()
    await prisma.projectUpdate.deleteMany()
    await prisma.clientProject.deleteMany()
    await prisma.clientCompany.deleteMany()
    await prisma.estimateVersion.deleteMany()
    await prisma.equipment.deleteMany()
    await prisma.room.deleteMany()
    await prisma.estimate.deleteMany()
    await prisma.template.deleteMany()
    await prisma.userSession.deleteMany()
    await prisma.userProfile.deleteMany()
    await prisma.user.deleteMany()
    await prisma.systemConfig.deleteMany()
    await prisma.emailTemplate.deleteMany()
  }

  // Create admin user
  console.log('👤 Creating admin user...')
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@dsarch.org',
      password: await hashPassword('admin123'),
      name: 'DS Arch Admin',
      role: 'ADMIN',
      profile: {
        create: {
          firstName: 'DS Arch',
          lastName: 'Administrator',
          company: 'DS Arch',
          timezone: 'America/New_York',
          preferences: {
            theme: 'light',
            notifications: true,
            emailUpdates: true
          }
        }
      }
    }
  })

  // Create demo user
  console.log('👤 Creating demo user...')
  const demoUser = await prisma.user.create({
    data: {
      email: 'demo@dsarch.org',
      password: await hashPassword('demo123'),
      name: 'Demo User',
      role: 'USER',
      profile: {
        create: {
          firstName: 'Demo',
          lastName: 'User',
          company: 'Healthcare Facility Planning',
          phone: '(555) 123-4567',
          timezone: 'America/New_York',
          preferences: {
            theme: 'light',
            notifications: true
          }
        }
      }
    }
  })

  // Create client user
  console.log('👤 Creating client user...')
  const clientUser = await prisma.user.create({
    data: {
      email: 'client@healthcare.com',
      password: await hashPassword('client123'),
      name: 'Healthcare Client',
      role: 'CLIENT',
      profile: {
        create: {
          firstName: 'John',
          lastName: 'Healthcare',
          company: 'Regional Medical Center',
          phone: '(555) 987-6543',
          timezone: 'America/New_York',
          preferences: {
            theme: 'light',
            notifications: true
          }
        }
      }
    }
  })

  // Create professional templates
  console.log('📋 Creating professional templates...')

  const orSuiteTemplate = await prisma.template.create({
    data: {
      name: 'Operating Room Suite',
      description: 'Complete surgical suite with multiple operating rooms, prep areas, and recovery spaces',
      facilityType: 'SURGERY_CENTER',
      category: 'Surgical Facility',
      isPublic: true,
      isOfficial: true,
      estimatedCost: 2500000,
      squareFootage: 8000,
      constructionTime: '18-24 months',
      tags: ['surgery', 'operating room', 'medical gas', 'HEPA'],
      version: '1.0',
      createdBy: adminUser.id,
      templateData: {
        rooms: [
          {
            name: 'OR 1 - General Surgery',
            type: 'operating_room',
            area: 600,
            ceilingHeight: 12,
            oxygenOutlets: 6,
            airOutlets: 4,
            vacuumOutlets: 6,
            co2Outlets: 2,
            n2oOutlets: 4,
            pressureRequirement: 'High',
            backupRequired: true,
            specialRequirements: 'Laminar flow ceiling, surgical lights integration',
            nfpaCompliance: ['NFPA 99-2021', 'NFPA 101', 'ASHRAE 170'],
            flowRateRequirements: { oxygen: 100, air: 80, vacuum: 60 }
          },
          {
            name: 'OR 2 - Cardiac Surgery',
            type: 'operating_room',
            area: 700,
            ceilingHeight: 12,
            oxygenOutlets: 8,
            airOutlets: 6,
            vacuumOutlets: 8,
            co2Outlets: 4,
            n2oOutlets: 4,
            pressureRequirement: 'High',
            backupRequired: true,
            specialRequirements: 'Enhanced backup systems, specialized cardiac equipment integration',
            nfpaCompliance: ['NFPA 99-2021', 'NFPA 101', 'ASHRAE 170'],
            flowRateRequirements: { oxygen: 150, air: 120, vacuum: 80 }
          }
        ],
        equipment: [
          {
            name: 'Surgical Table - Advanced',
            category: 'Surgical',
            manufacturer: 'Steris',
            model: 'Amsco 3080 RL',
            quantity: 2,
            unitCost: 85000,
            installationCost: 5000,
            warranty: '5 years'
          },
          {
            name: 'Anesthesia Machine',
            category: 'Life Support',
            manufacturer: 'GE Healthcare',
            model: 'Aisys CS2',
            quantity: 2,
            unitCost: 125000,
            installationCost: 8000,
            warranty: '3 years'
          }
        ],
        compliance: [
          'NFPA 99-2021 (Health Care Facilities Code)',
          'NFPA 101 (Life Safety Code)',
          'ASHRAE 170 (Ventilation of Health Care Facilities)',
          'FGI Guidelines (Facility Guidelines Institute)'
        ]
      }
    }
  })

  const icuTemplate = await prisma.template.create({
    data: {
      name: 'Intensive Care Unit',
      description: 'Complete ICU with patient rooms, central monitoring, and support areas',
      facilityType: 'ICU',
      category: 'Critical Care',
      isPublic: true,
      isOfficial: true,
      estimatedCost: 3500000,
      squareFootage: 12000,
      constructionTime: '24-30 months',
      tags: ['icu', 'critical care', 'monitoring', 'isolation'],
      version: '1.0',
      createdBy: adminUser.id,
      templateData: {
        rooms: [
          {
            name: 'ICU Room 1',
            type: 'icu',
            area: 250,
            ceilingHeight: 10,
            oxygenOutlets: 3,
            airOutlets: 2,
            vacuumOutlets: 3,
            co2Outlets: 0,
            n2oOutlets: 0,
            pressureRequirement: 'Standard',
            backupRequired: true,
            specialRequirements: 'Isolation capability, negative pressure option',
            nfpaCompliance: ['NFPA 99-2021', 'ASHRAE 170'],
            flowRateRequirements: { oxygen: 75, air: 60, vacuum: 45 }
          }
        ],
        equipment: [
          {
            name: 'Patient Monitor',
            category: 'Monitoring',
            manufacturer: 'Philips',
            model: 'IntelliVue MX850',
            quantity: 8,
            unitCost: 35000,
            installationCost: 2000,
            warranty: '3 years'
          }
        ]
      }
    }
  })

  // Create demo estimates
  console.log('📊 Creating demo estimates...')

  const demoEstimate = await prisma.estimate.create({
    data: {
      userId: demoUser.id,
      projectName: 'Regional Medical Center - OR Expansion',
      clientName: 'Regional Medical Center',
      location: 'Chicago, IL',
      facilityType: 'SURGERY_CENTER',
      specialRequirements: 'HEPA filtration, advanced cardiac capabilities',
      squareFootage: 6000,
      numberOfRooms: 3,
      totalCost: 1850000,
      costBreakdown: {
        roomCosts: 850000,
        equipmentCosts: 750000,
        subtotal: 1600000,
        complianceCost: 160000,
        contingencyCost: 90000,
        total: 1850000
      },
      status: 'COMPLETED',
      templateId: orSuiteTemplate.id,
      rooms: {
        create: [
          {
            name: 'Operating Room A',
            type: 'operating_room',
            area: 500,
            ceilingHeight: 12,
            oxygenOutlets: 6,
            airOutlets: 4,
            vacuumOutlets: 6,
            co2Outlets: 2,
            n2oOutlets: 2,
            pressureRequirement: 'High',
            backupRequired: true,
            specialRequirements: 'Laminar flow ceiling',
            nfpaCompliance: ['NFPA 99-2021', 'ASHRAE 170'],
            estimatedCost: 425000
          }
        ]
      },
      equipment: {
        create: [
          {
            name: 'Surgical Table',
            category: 'Surgical',
            manufacturer: 'Steris',
            model: 'Amsco 3080',
            quantity: 1,
            unitCost: 75000,
            installationCost: 5000,
            totalCost: 80000,
            warranty: '5 years',
            maintenanceRequired: true
          }
        ]
      },
      versions: {
        create: {
          version: 1,
          data: { initial: true },
          changeLog: 'Initial estimate creation',
          createdBy: demoUser.id
        }
      }
    }
  })

  // Create client company
  console.log('🏥 Creating client company...')
  const clientCompany = await prisma.clientCompany.create({
    data: {
      name: 'Regional Medical Center',
      contactName: 'Dr. Sarah Johnson',
      email: 'sjohnson@regionalmedical.com',
      phone: '(555) 123-4567',
      address: '123 Healthcare Drive',
      city: 'Chicago',
      state: 'IL',
      zipCode: '60601',
      accountType: 'healthcare_provider',
      preferences: {
        communicationMethod: 'email',
        timezone: 'America/Chicago'
      }
    }
  })

  // Create client project
  console.log('📋 Creating client project...')
  const clientProject = await prisma.clientProject.create({
    data: {
      clientCompanyId: clientCompany.id,
      assignedUserId: demoUser.id,
      title: 'Emergency Department Renovation',
      description: 'Complete renovation of existing emergency department with trauma bay expansion',
      facilityType: 'EMERGENCY',
      projectType: 'RENOVATION',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      requestedStartDate: new Date('2025-03-01'),
      estimatedDuration: 18,
      estimatedBudgetRange: '$5M - $10M',
      fundingSource: 'internal',
      squareFootage: 15000,
      numberOfRooms: 20,
      medicalGasRequired: true,
      hvacUpgrade: true,
      electricalUpgrade: true,
      overallProgress: 35,
      currentPhase: 'Design Development',
      updates: {
        create: [
          {
            title: 'Design Phase Completed',
            description: 'Preliminary designs have been approved by the medical staff',
            updateType: 'MILESTONE',
            progress: 25,
            milestone: 'Design Approval',
            visibility: 'CLIENT',
            createdBy: demoUser.id
          }
        ]
      }
    }
  })

  // Create system configuration
  console.log('⚙️ Creating system configuration...')
  await prisma.systemConfig.createMany({
    data: [
      {
        key: 'app_name',
        value: 'DS Arch Medical Cost Estimator',
        description: 'Application name',
        category: 'general',
        isPublic: true
      },
      {
        key: 'default_markup_percentage',
        value: '30',
        description: 'Default markup percentage for estimates',
        category: 'pricing',
        isPublic: false
      },
      {
        key: 'nfpa_compliance_version',
        value: 'NFPA 99-2021',
        description: 'Current NFPA compliance version',
        category: 'compliance',
        isPublic: true
      },
      {
        key: 'max_file_upload_size',
        value: '10485760',
        description: 'Maximum file upload size in bytes (10MB)',
        category: 'files',
        isPublic: false
      }
    ]
  })

  // Create email templates
  console.log('📧 Creating email templates...')
  await prisma.emailTemplate.createMany({
    data: [
      {
        name: 'welcome_user',
        subject: 'Welcome to DS Arch Medical Cost Estimator',
        htmlBody: `
          <h1>Welcome {{name}}!</h1>
          <p>Thank you for joining DS Arch Medical Cost Estimator.</p>
          <p>You can now create professional healthcare facility cost estimates.</p>
          <a href="{{app_url}}/dashboard">Get Started</a>
        `,
        textBody: 'Welcome {{name}}! Thank you for joining DS Arch Medical Cost Estimator.',
        variables: ['name', 'app_url'],
        category: 'authentication',
        description: 'Welcome email for new users'
      },
      {
        name: 'estimate_completed',
        subject: 'Your Estimate "{{project_name}}" is Ready',
        htmlBody: `
          <h1>Estimate Completed</h1>
          <p>Your estimate for {{project_name}} has been completed.</p>
          <p><strong>Total Cost:</strong> ${{total_cost}}</p>
          <p><a href="{{estimate_url}}">View Estimate</a></p>
        `,
        textBody: 'Your estimate for {{project_name}} is ready. Total: ${{total_cost}}',
        variables: ['project_name', 'total_cost', 'estimate_url'],
        category: 'estimates',
        description: 'Notification when estimate is completed'
      }
    ]
  })

  // Create audit logs
  console.log('📜 Creating audit logs...')
  await prisma.auditLog.createMany({
    data: [
      {
        userId: adminUser.id,
        action: 'seed_database',
        entityType: 'system',
        newValues: { seeded: true },
        metadata: { version: '1.0', timestamp: new Date().toISOString() }
      },
      {
        userId: demoUser.id,
        action: 'create',
        entityType: 'estimate',
        entityId: demoEstimate.id,
        newValues: { projectName: demoEstimate.projectName },
        metadata: { seeded: true }
      }
    ]
  })

  console.log('✅ Database seeding completed!')
  console.log(`
📊 Summary:
  - Users: 3 (1 admin, 1 demo user, 1 client)
  - Templates: 2 (OR Suite, ICU)
  - Estimates: 1 (demo estimate)
  - Client Companies: 1
  - Client Projects: 1
  - System Config: 4 entries
  - Email Templates: 2

🔐 Demo Credentials:
  Admin: admin@dsarch.org / admin123
  User:  demo@dsarch.org / demo123
  Client: client@healthcare.com / client123
  `)
}

main()
  .catch((e) => {
    console.error('❌ Database seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
