import { Prisma } from '@prisma/client'
import { prisma, withTransaction } from '../db'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { randomUUID } from 'crypto'

// ===== VALIDATION SCHEMAS =====

export const RegisterUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['USER', 'ADMIN', 'SUPER_ADMIN', 'CLIENT']).default('USER')
})

export const LoginUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
})

export const UpdateProfileSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  company: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  timezone: z.string().optional(),
  language: z.string().optional(),
  preferences: z.record(z.any()).optional()
})

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number')
})

// ===== TYPES =====

export type RegisterUserInput = z.infer<typeof RegisterUserSchema>
export type LoginUserInput = z.infer<typeof LoginUserSchema>
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>

export interface UserWithProfile {
  id: string
  email: string
  name: string
  role: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  profile: {
    id: string
    firstName: string | null
    lastName: string | null
    company: string | null
    phone: string | null
    address: string | null
    city: string | null
    state: string | null
    zipCode: string | null
    country: string | null
    timezone: string | null
    language: string | null
    avatar: string | null
    preferences: any
  } | null
}

export interface AuthResult {
  user: UserWithProfile
  token: string
  expiresAt: Date
}

export interface SessionInfo {
  id: string
  userId: string
  token: string
  expiresAt: Date
  createdAt: Date
  ipAddress: string | null
  userAgent: string | null
}

// ===== UTILITY FUNCTIONS =====

export function generateJWT(userId: string, email: string, role: string): string {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set')
  }

  const expiresIn = process.env.JWT_EXPIRES_IN || '7d'

  return jwt.sign(
    {
      userId,
      email,
      role,
      type: 'access_token'
    },
    secret,
    { expiresIn }
  )
}

export function verifyJWT(token: string): { userId: string; email: string; role: string } | null {
  try {
    const secret = process.env.JWT_SECRET
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is not set')
    }

    const decoded = jwt.verify(token, secret) as any

    if (decoded.type !== 'access_token') {
      return null
    }

    return {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role
    }
  } catch (error) {
    return null
  }
}

export async function hashPassword(password: string): Promise<string> {
  const rounds = parseInt(process.env.BCRYPT_ROUNDS || '12')
  return bcrypt.hash(password, rounds)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

function calculateTokenExpiry(): Date {
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d'
  const now = new Date()

  // Parse expiry string (e.g., "7d", "24h", "60m")
  const match = expiresIn.match(/^(\d+)([dhm])$/)
  if (!match) {
    // Default to 7 days if invalid format
    return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  }

  const [, value, unit] = match
  const num = parseInt(value)

  switch (unit) {
    case 'd': // days
      return new Date(now.getTime() + num * 24 * 60 * 60 * 1000)
    case 'h': // hours
      return new Date(now.getTime() + num * 60 * 60 * 1000)
    case 'm': // minutes
      return new Date(now.getTime() + num * 60 * 1000)
    default:
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  }
}

// ===== DATABASE OPERATIONS =====

export class UserService {

  // Register new user
  static async register(
    data: RegisterUserInput,
    metadata?: { ipAddress?: string; userAgent?: string }
  ): Promise<AuthResult> {
    // Validate input
    const validatedData = RegisterUserSchema.parse(data)

    return withTransaction(async (tx) => {
      // Check if user already exists
      const existingUser = await tx.user.findUnique({
        where: { email: validatedData.email }
      })

      if (existingUser) {
        throw new Error('User with this email already exists')
      }

      // Hash password
      const hashedPassword = await hashPassword(validatedData.password)

      // Create user
      const user = await tx.user.create({
        data: {
          email: validatedData.email,
          password: hashedPassword,
          name: validatedData.name,
          role: validatedData.role,
          profile: {
            create: {
              preferences: {}
            }
          }
        },
        include: {
          profile: true
        }
      })

      // Generate JWT token
      const token = generateJWT(user.id, user.email, user.role)
      const expiresAt = calculateTokenExpiry()

      // Create session
      await tx.userSession.create({
        data: {
          userId: user.id,
          token,
          expiresAt,
          ipAddress: metadata?.ipAddress,
          userAgent: metadata?.userAgent
        }
      })

      // Log audit trail
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'register',
          entityType: 'user',
          entityId: user.id,
          newValues: { email: user.email, role: user.role },
          ipAddress: metadata?.ipAddress,
          userAgent: metadata?.userAgent
        }
      })

      return {
        user: {
          ...user,
          password: undefined // Remove password from response
        } as UserWithProfile,
        token,
        expiresAt
      }
    })
  }

  // Login user
  static async login(
    data: LoginUserInput,
    metadata?: { ipAddress?: string; userAgent?: string }
  ): Promise<AuthResult> {
    // Validate input
    const validatedData = LoginUserSchema.parse(data)

    return withTransaction(async (tx) => {
      // Find user
      const user = await tx.user.findUnique({
        where: { email: validatedData.email },
        include: { profile: true }
      })

      if (!user) {
        throw new Error('Invalid email or password')
      }

      if (!user.isActive) {
        throw new Error('Account is disabled')
      }

      // Verify password
      const isValidPassword = await verifyPassword(validatedData.password, user.password)
      if (!isValidPassword) {
        throw new Error('Invalid email or password')
      }

      // Generate JWT token
      const token = generateJWT(user.id, user.email, user.role)
      const expiresAt = calculateTokenExpiry()

      // Clean up expired sessions
      await tx.userSession.deleteMany({
        where: {
          userId: user.id,
          expiresAt: { lt: new Date() }
        }
      })

      // Create new session
      await tx.userSession.create({
        data: {
          userId: user.id,
          token,
          expiresAt,
          ipAddress: metadata?.ipAddress,
          userAgent: metadata?.userAgent
        }
      })

      // Log audit trail
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'login',
          entityType: 'user',
          entityId: user.id,
          metadata: { loginAt: new Date().toISOString() },
          ipAddress: metadata?.ipAddress,
          userAgent: metadata?.userAgent
        }
      })

      return {
        user: {
          ...user,
          password: undefined // Remove password from response
        } as UserWithProfile,
        token,
        expiresAt
      }
    })
  }

  // Logout user
  static async logout(token: string): Promise<boolean> {
    try {
      await prisma.userSession.delete({
        where: { token }
      })
      return true
    } catch (error) {
      // Session might not exist or already expired
      return false
    }
  }

  // Get user by ID
  static async getById(id: string): Promise<UserWithProfile | null> {
    const user = await prisma.user.findUnique({
      where: { id },
      include: { profile: true }
    })

    if (!user) return null

    return {
      ...user,
      password: undefined
    } as UserWithProfile
  }

  // Get user by email
  static async getByEmail(email: string): Promise<UserWithProfile | null> {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true }
    })

    if (!user) return null

    return {
      ...user,
      password: undefined
    } as UserWithProfile
  }

  // Verify session token
  static async verifySession(token: string): Promise<UserWithProfile | null> {
    const session = await prisma.userSession.findUnique({
      where: { token },
      include: {
        user: {
          include: { profile: true }
        }
      }
    })

    if (!session || session.expiresAt < new Date()) {
      // Clean up expired session
      if (session) {
        await prisma.userSession.delete({ where: { token } })
      }
      return null
    }

    return {
      ...session.user,
      password: undefined
    } as UserWithProfile
  }

  // Update user profile
  static async updateProfile(
    userId: string,
    data: UpdateProfileInput
  ): Promise<UserWithProfile> {
    // Validate input
    const validatedData = UpdateProfileSchema.parse(data)

    return withTransaction(async (tx) => {
      // Check if user exists
      const user = await tx.user.findUnique({
        where: { id: userId },
        include: { profile: true }
      })

      if (!user) {
        throw new Error('User not found')
      }

      // Update or create profile
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          profile: {
            upsert: {
              create: validatedData,
              update: validatedData
            }
          }
        },
        include: { profile: true }
      })

      // Log audit trail
      await tx.auditLog.create({
        data: {
          userId,
          action: 'update_profile',
          entityType: 'user',
          entityId: userId,
          newValues: validatedData,
          metadata: { updatedAt: new Date().toISOString() }
        }
      })

      return {
        ...updatedUser,
        password: undefined
      } as UserWithProfile
    })
  }

  // Change password
  static async changePassword(
    userId: string,
    data: ChangePasswordInput
  ): Promise<boolean> {
    // Validate input
    const validatedData = ChangePasswordSchema.parse(data)

    return withTransaction(async (tx) => {
      // Get user
      const user = await tx.user.findUnique({
        where: { id: userId }
      })

      if (!user) {
        throw new Error('User not found')
      }

      // Verify current password
      const isValidPassword = await verifyPassword(validatedData.currentPassword, user.password)
      if (!isValidPassword) {
        throw new Error('Current password is incorrect')
      }

      // Hash new password
      const hashedPassword = await hashPassword(validatedData.newPassword)

      // Update password
      await tx.user.update({
        where: { id: userId },
        data: { password: hashedPassword }
      })

      // Invalidate all existing sessions except current one
      await tx.userSession.deleteMany({
        where: { userId }
      })

      // Log audit trail
      await tx.auditLog.create({
        data: {
          userId,
          action: 'change_password',
          entityType: 'user',
          entityId: userId,
          metadata: { changedAt: new Date().toISOString() }
        }
      })

      return true
    })
  }

  // Get user's active sessions
  static async getUserSessions(userId: string): Promise<SessionInfo[]> {
    const sessions = await prisma.userSession.findMany({
      where: {
        userId,
        expiresAt: { gte: new Date() }
      },
      orderBy: { createdAt: 'desc' }
    })

    return sessions.map(session => ({
      id: session.id,
      userId: session.userId,
      token: session.token.substring(0, 10) + '...', // Masked token
      expiresAt: session.expiresAt,
      createdAt: session.createdAt,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent
    }))
  }

  // Revoke session
  static async revokeSession(userId: string, sessionId: string): Promise<boolean> {
    try {
      await prisma.userSession.delete({
        where: {
          id: sessionId,
          userId // Ensure user can only revoke their own sessions
        }
      })
      return true
    } catch (error) {
      return false
    }
  }

  // Deactivate user
  static async deactivateUser(userId: string): Promise<boolean> {
    return withTransaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { isActive: false }
      })

      // Invalidate all sessions
      await tx.userSession.deleteMany({
        where: { userId }
      })

      // Log audit trail
      await tx.auditLog.create({
        data: {
          userId,
          action: 'deactivate',
          entityType: 'user',
          entityId: userId,
          metadata: { deactivatedAt: new Date().toISOString() }
        }
      })

      return true
    })
  }

  // Admin: Get all users (with pagination)
  static async getAllUsers(options: {
    page?: number
    limit?: number
    role?: string
    search?: string
    isActive?: boolean
  } = {}): Promise<{
    users: UserWithProfile[]
    total: number
    page: number
    limit: number
    totalPages: number
  }> {
    const { page = 1, limit = 10, role, search, isActive } = options

    const where: Prisma.UserWhereInput = {
      ...(role && { role: role as any }),
      ...(isActive !== undefined && { isActive }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { profile: { company: { contains: search, mode: 'insensitive' } } }
        ]
      })
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: { profile: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.user.count({ where })
    ])

    return {
      users: users.map(user => ({
        ...user,
        password: undefined
      })) as UserWithProfile[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  }

  // Clean up expired sessions (run periodically)
  static async cleanupExpiredSessions(): Promise<number> {
    const result = await prisma.userSession.deleteMany({
      where: {
        expiresAt: { lt: new Date() }
      }
    })

    return result.count
  }
}
