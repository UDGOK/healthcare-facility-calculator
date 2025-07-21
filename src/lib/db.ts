import { PrismaClient } from '@prisma/client'

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  errorFormat: 'pretty',
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Database utility functions
export class DatabaseError extends Error {
  constructor(message: string, public code?: string, public details?: any) {
    super(message)
    this.name = 'DatabaseError'
  }
}

// Connection health check
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch (error) {
    console.error('Database connection failed:', error)
    return false
  }
}

// Graceful shutdown
export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect()
  } catch (error) {
    console.error('Error disconnecting from database:', error)
  }
}

// Transaction wrapper with error handling
export async function withTransaction<T>(
  operation: (tx: PrismaClient) => Promise<T>
): Promise<T> {
  try {
    return await prisma.$transaction(async (tx) => {
      return await operation(tx as PrismaClient)
    }, {
      maxWait: 5000, // 5 seconds
      timeout: 10000, // 10 seconds
    })
  } catch (error) {
    console.error('Transaction failed:', error)
    throw new DatabaseError(
      'Database transaction failed',
      'TRANSACTION_ERROR',
      error
    )
  }
}

// Database statistics
export async function getDatabaseStats() {
  try {
    const [
      userCount,
      estimateCount,
      templateCount,
      projectCount,
      activeSessionCount
    ] = await Promise.all([
      prisma.user.count(),
      prisma.estimate.count(),
      prisma.template.count(),
      prisma.clientProject.count(),
      prisma.userSession.count({
        where: {
          expiresAt: {
            gte: new Date()
          }
        }
      })
    ])

    return {
      users: userCount,
      estimates: estimateCount,
      templates: templateCount,
      projects: projectCount,
      activeSessions: activeSessionCount,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    console.error('Failed to get database stats:', error)
    throw new DatabaseError('Failed to retrieve database statistics')
  }
}

export default prisma
