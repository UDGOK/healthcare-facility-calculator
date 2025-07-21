import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Hash password function
  const hashPassword = async (password: string) => {
    return await bcrypt.hash(password, 12)
  }

  // Create Admin Users
  console.log('👤 Creating admin users...')
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@dsarch.org' },
    update: {},
    create: {
      email: 'admin@dsarch.org',
      password: await hashPassword('admin123'),
      name: 'Admin User',
      role: 'ADMIN',
      isActive: true,
      profile: {
        create: {
          firstName: 'Admin',
          lastName: 'User',
          company: 'DS Arch',
          timezone: 'America/New_York'
        }
      }
    }
  })

  // Create Client Users
  console.log('🏥 Creating client users...')
  const clients = [
    {
      email: 'demo@healthcare.com',
      password: 'client123',
      firstName: 'Sarah',
      lastName: 'Johnson',
      role: 'CLIENT',
      organization: 'General Hospital',
      title: 'Facilities Manager'
    },
    {
      email: 'client@medical-center.com',
      password: 'client123',
      firstName: 'Michael',
      lastName: 'Chen',
      role: 'CLIENT',
      organization: 'Regional Medical Center',
      title: 'Project Director'
    },
    {
      email: 'facilities@stmarys.org',
      password: 'client123',
      firstName: 'Emily',
      lastName: 'Rodriguez',
      role: 'CLIENT',
      organization: 'St. Marys Hospital',
      title: 'Chief Operating Officer'
    },
    {
      email: 'procurement@cityhealth.gov',
      password: 'client123',
      firstName: 'David',
      lastName: 'Thompson',
      role: 'CLIENT',
      organization: 'City Health Department',
      title: 'Procurement Manager'
    },
    {
      email: 'planning@universityhospital.edu',
      password: 'client123',
      firstName: 'Lisa',
      lastName: 'Wang',
      role: 'CLIENT',
      organization: 'University Hospital',
      title: 'Strategic Planning Director'
    }
  ]

  const createdClients = []
  for (const client of clients) {
    const user = await prisma.user.upsert({
      where: { email: client.email },
      update: {},
      create: {
        email: client.email,
        password: await hashPassword(client.password),
        name: `${client.firstName} ${client.lastName}`,
        role: client.role as any,
        isActive: true,
        profile: {
          create: {
            firstName: client.firstName,
            lastName: client.lastName,
            company: client.organization,
            timezone: 'America/New_York'
          }
        }
      }
    })
    createdClients.push(user)
    console.log(`✅ Created client: ${client.firstName} ${client.lastName} (${client.email})`)
  }

  // Create Demo Estimates for clients
  console.log('📊 Creating sample estimates...')

  const sampleEstimates = [
    {
      userId: createdClients[0].id,
      projectName: 'Emergency Department Expansion',
      facilityType: 'Emergency Department',
      totalCost: 4500000,
      status: 'COMPLETED'
    },
    {
      userId: createdClients[1].id,
      projectName: 'New ICU Wing',
      facilityType: 'ICU Unit',
      totalCost: 3500000,
      status: 'IN_PROGRESS'
    },
    {
      userId: createdClients[2].id,
      projectName: 'Operating Room Renovation',
      facilityType: 'Operating Room Suite',
      totalCost: 2500000,
      status: 'DRAFT'
    }
  ]

  for (const estimate of sampleEstimates) {
    await prisma.estimate.create({
      data: {
        userId: estimate.userId,
        projectName: estimate.projectName,
        facilityType: 'HOSPITAL',
        totalCost: estimate.totalCost,
        status: estimate.status,
        costBreakdown: {
          rooms: [
            {
              type: estimate.facilityType,
              count: 1,
              area: 500,
              cost: estimate.totalCost
            }
          ],
          medicalGas: {
            oxygen: true,
            nitrous: true,
            vacuum: true,
            compressedAir: true
          },
          compliance: {
            nfpa99: true,
            ashrae: true,
            jointCommission: true
          }
        },
        squareFootage: 500,
        numberOfRooms: 1
      }
    })
  }

  console.log('✅ Database seeding completed!')
  console.log('\n📋 Created Accounts:')
  console.log('='.repeat(50))
  console.log('👨‍💼 ADMIN ACCOUNT:')
  console.log('Email: admin@dsarch.org')
  console.log('Password: admin123')
  console.log('')
  console.log('🏥 CLIENT ACCOUNTS:')
  clients.forEach((client, index) => {
    console.log(`${index + 1}. ${client.firstName} ${client.lastName}`)
    console.log(`   Email: ${client.email}`)
    console.log(`   Password: ${client.password}`)
    console.log(`   Organization: ${client.organization}`)
    console.log(`   Title: ${client.title}`)
    console.log('')
  })
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
