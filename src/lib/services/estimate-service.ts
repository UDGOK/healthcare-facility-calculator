import { Prisma } from '@prisma/client'
import { prisma, withTransaction } from '../db'
import { z } from 'zod'

// ===== VALIDATION SCHEMAS =====

export const RoomSchema = z.object({
  name: z.string().min(1, 'Room name is required'),
  type: z.string().min(1, 'Room type is required'),
  area: z.number().positive('Area must be positive'),
  ceilingHeight: z.number().positive().optional(),
  oxygenOutlets: z.number().int().min(0).default(0),
  airOutlets: z.number().int().min(0).default(0),
  vacuumOutlets: z.number().int().min(0).default(0),
  co2Outlets: z.number().int().min(0).default(0),
  n2oOutlets: z.number().int().min(0).default(0),
  pressureRequirement: z.string().optional(),
  backupRequired: z.boolean().default(false),
  specialRequirements: z.string().optional(),
  nfpaCompliance: z.array(z.string()).default([]),
  flowRateRequirements: z.record(z.number()).optional(),
  estimatedCost: z.number().min(0)
})

export const EquipmentSchema = z.object({
  name: z.string().min(1, 'Equipment name is required'),
  category: z.string().min(1, 'Category is required'),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  quantity: z.number().int().positive('Quantity must be positive'),
  unitCost: z.number().min(0, 'Unit cost must be non-negative'),
  installationCost: z.number().min(0).default(0),
  warranty: z.string().optional(),
  powerRequirement: z.string().optional(),
  spaceRequirement: z.number().optional(),
  maintenanceRequired: z.boolean().default(false),
  specialInstallation: z.string().optional(),
  description: z.string().optional(),
  specifications: z.record(z.any()).optional()
})

export const CreateEstimateSchema = z.object({
  projectName: z.string().min(1, 'Project name is required'),
  clientName: z.string().optional(),
  location: z.string().optional(),
  facilityType: z.enum(['HOSPITAL', 'SURGERY_CENTER', 'CLINIC', 'EMERGENCY', 'SPECIALTY', 'ICU', 'LABORATORY', 'IMAGING', 'REHABILITATION', 'OUTPATIENT', 'OTHER']).default('HOSPITAL'),
  specialRequirements: z.string().optional(),
  squareFootage: z.number().int().positive().optional(),
  numberOfRooms: z.number().int().positive().optional(),
  templateId: z.string().optional(),
  rooms: z.array(RoomSchema).default([]),
  equipment: z.array(EquipmentSchema).default([])
})

export const UpdateEstimateSchema = CreateEstimateSchema.partial()

// ===== TYPES =====

export type CreateEstimateInput = z.infer<typeof CreateEstimateSchema>
export type UpdateEstimateInput = z.infer<typeof UpdateEstimateSchema>
export type RoomInput = z.infer<typeof RoomSchema>
export type EquipmentInput = z.infer<typeof EquipmentSchema>

export interface EstimateWithDetails {
  id: string
  projectName: string
  clientName: string | null
  location: string | null
  facilityType: string
  totalCost: number
  status: string
  version: number
  createdAt: Date
  updatedAt: Date
  rooms: Array<{
    id: string
    name: string
    type: string
    area: number
    oxygenOutlets: number
    airOutlets: number
    vacuumOutlets: number
    estimatedCost: number
  }>
  equipment: Array<{
    id: string
    name: string
    category: string
    quantity: number
    unitCost: number
    totalCost: number
  }>
  user: {
    id: string
    name: string
    email: string
  }
}

// ===== COST CALCULATION UTILITIES =====

export function calculateRoomCost(room: RoomInput): number {
  const outletCosts = {
    oxygen: room.oxygenOutlets * 1500,
    air: room.airOutlets * 1200,
    vacuum: room.vacuumOutlets * 1400,
    co2: room.co2Outlets * 1300,
    n2o: room.n2oOutlets * 1350
  }

  const totalOutletCost = Object.values(outletCosts).reduce((sum, cost) => sum + cost, 0)
  const pipingCost = room.area * 30 // $30 per square foot for piping

  // Apply complexity multiplier based on room type
  const complexityMultipliers: Record<string, number> = {
    'operating_room': 1.5,
    'icu': 1.3,
    'emergency_room': 1.4,
    'recovery_room': 1.1,
    'patient_room': 1.0,
    'support_room': 0.8
  }

  const multiplier = complexityMultipliers[room.type.toLowerCase()] || 1.0
  return (totalOutletCost + pipingCost) * multiplier
}

export function calculateEquipmentCost(equipment: EquipmentInput): number {
  return (equipment.quantity * equipment.unitCost) + equipment.installationCost
}

export function calculateTotalEstimateCost(
  rooms: RoomInput[],
  equipment: EquipmentInput[]
): {
  roomCosts: number
  equipmentCosts: number
  subtotal: number
  complianceCost: number
  contingencyCost: number
  total: number
} {
  const roomCosts = rooms.reduce((sum, room) => sum + calculateRoomCost(room), 0)
  const equipmentCosts = equipment.reduce((sum, item) => sum + calculateEquipmentCost(item), 0)
  const subtotal = roomCosts + equipmentCosts

  // Industry standard markups
  const complianceCost = subtotal * 0.15 // 15% for compliance and regulatory
  const contingencyCost = subtotal * 0.10 // 10% contingency

  const total = subtotal + complianceCost + contingencyCost

  return {
    roomCosts,
    equipmentCosts,
    subtotal,
    complianceCost,
    contingencyCost,
    total
  }
}

// ===== DATABASE OPERATIONS =====

export class EstimateService {

  // Create new estimate
  static async create(userId: string, data: CreateEstimateInput): Promise<EstimateWithDetails> {
    // Validate input
    const validatedData = CreateEstimateSchema.parse(data)

    return withTransaction(async (tx) => {
      // Calculate costs
      const costs = calculateTotalEstimateCost(validatedData.rooms, validatedData.equipment)

      // Create estimate
      const estimate = await tx.estimate.create({
        data: {
          userId,
          projectName: validatedData.projectName,
          clientName: validatedData.clientName,
          location: validatedData.location,
          facilityType: validatedData.facilityType,
          specialRequirements: validatedData.specialRequirements,
          squareFootage: validatedData.squareFootage,
          numberOfRooms: validatedData.numberOfRooms,
          templateId: validatedData.templateId,
          totalCost: costs.total,
          costBreakdown: costs,
          status: 'DRAFT'
        },
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        }
      })

      // Create rooms
      const rooms = await Promise.all(
        validatedData.rooms.map(room =>
          tx.room.create({
            data: {
              estimateId: estimate.id,
              ...room,
              estimatedCost: calculateRoomCost(room)
            }
          })
        )
      )

      // Create equipment
      const equipment = await Promise.all(
        validatedData.equipment.map(item =>
          tx.equipment.create({
            data: {
              estimateId: estimate.id,
              ...item,
              totalCost: calculateEquipmentCost(item)
            }
          })
        )
      )

      // Create initial version
      await tx.estimateVersion.create({
        data: {
          estimateId: estimate.id,
          version: 1,
          data: {
            estimate,
            rooms,
            equipment
          },
          changeLog: 'Initial version',
          createdBy: userId
        }
      })

      // Log audit trail
      await tx.auditLog.create({
        data: {
          userId,
          action: 'create',
          entityType: 'estimate',
          entityId: estimate.id,
          newValues: { projectName: estimate.projectName, totalCost: estimate.totalCost },
          metadata: { facilityType: estimate.facilityType }
        }
      })

      return {
        ...estimate,
        totalCost: Number(estimate.totalCost),
        rooms: rooms.map(r => ({
          ...r,
          area: Number(r.area),
          estimatedCost: Number(r.estimatedCost)
        })),
        equipment: equipment.map(e => ({
          ...e,
          unitCost: Number(e.unitCost),
          totalCost: Number(e.totalCost)
        }))
      }
    })
  }

  // Get estimate by ID
  static async getById(id: string, userId?: string): Promise<EstimateWithDetails | null> {
    const estimate = await prisma.estimate.findFirst({
      where: {
        id,
        ...(userId && { userId })
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        rooms: {
          orderBy: { createdAt: 'asc' }
        },
        equipment: {
          orderBy: { createdAt: 'asc' }
        }
      }
    })

    if (!estimate) return null

    return {
      ...estimate,
      totalCost: Number(estimate.totalCost),
      rooms: estimate.rooms.map(r => ({
        ...r,
        area: Number(r.area),
        estimatedCost: Number(r.estimatedCost)
      })),
      equipment: estimate.equipment.map(e => ({
        ...e,
        unitCost: Number(e.unitCost),
        totalCost: Number(e.totalCost)
      }))
    }
  }

  // Get user's estimates
  static async getUserEstimates(
    userId: string,
    options: {
      page?: number
      limit?: number
      status?: string
      facilityType?: string
      search?: string
    } = {}
  ): Promise<{
    estimates: EstimateWithDetails[]
    total: number
    page: number
    limit: number
    totalPages: number
  }> {
    const { page = 1, limit = 10, status, facilityType, search } = options

    const where: Prisma.EstimateWhereInput = {
      userId,
      ...(status && { status: status as any }),
      ...(facilityType && { facilityType: facilityType as any }),
      ...(search && {
        OR: [
          { projectName: { contains: search, mode: 'insensitive' } },
          { clientName: { contains: search, mode: 'insensitive' } },
          { location: { contains: search, mode: 'insensitive' } }
        ]
      })
    }

    const [estimates, total] = await Promise.all([
      prisma.estimate.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true }
          },
          rooms: {
            orderBy: { createdAt: 'asc' }
          },
          equipment: {
            orderBy: { createdAt: 'asc' }
          }
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.estimate.count({ where })
    ])

    return {
      estimates: estimates.map(estimate => ({
        ...estimate,
        totalCost: Number(estimate.totalCost),
        rooms: estimate.rooms.map(r => ({
          ...r,
          area: Number(r.area),
          estimatedCost: Number(r.estimatedCost)
        })),
        equipment: estimate.equipment.map(e => ({
          ...e,
          unitCost: Number(e.unitCost),
          totalCost: Number(e.totalCost)
        }))
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  }

  // Update estimate
  static async update(
    id: string,
    userId: string,
    data: UpdateEstimateInput
  ): Promise<EstimateWithDetails> {
    // Validate input
    const validatedData = UpdateEstimateSchema.parse(data)

    return withTransaction(async (tx) => {
      // Get current estimate
      const currentEstimate = await tx.estimate.findFirst({
        where: { id, userId },
        include: { rooms: true, equipment: true }
      })

      if (!currentEstimate) {
        throw new Error('Estimate not found')
      }

      // Calculate new costs if rooms or equipment changed
      let totalCost = Number(currentEstimate.totalCost)
      let costBreakdown = currentEstimate.costBreakdown

      if (validatedData.rooms || validatedData.equipment) {
        const rooms = validatedData.rooms || []
        const equipment = validatedData.equipment || []
        const costs = calculateTotalEstimateCost(rooms, equipment)
        totalCost = costs.total
        costBreakdown = costs
      }

      // Update estimate
      const updatedEstimate = await tx.estimate.update({
        where: { id },
        data: {
          ...validatedData,
          totalCost,
          costBreakdown,
          version: { increment: 1 }
        },
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        }
      })

      // Update rooms if provided
      if (validatedData.rooms) {
        // Delete existing rooms
        await tx.room.deleteMany({ where: { estimateId: id } })

        // Create new rooms
        await Promise.all(
          validatedData.rooms.map(room =>
            tx.room.create({
              data: {
                estimateId: id,
                ...room,
                estimatedCost: calculateRoomCost(room)
              }
            })
          )
        )
      }

      // Update equipment if provided
      if (validatedData.equipment) {
        // Delete existing equipment
        await tx.equipment.deleteMany({ where: { estimateId: id } })

        // Create new equipment
        await Promise.all(
          validatedData.equipment.map(item =>
            tx.equipment.create({
              data: {
                estimateId: id,
                ...item,
                totalCost: calculateEquipmentCost(item)
              }
            })
          )
        )
      }

      // Create new version
      await tx.estimateVersion.create({
        data: {
          estimateId: id,
          version: updatedEstimate.version,
          data: validatedData,
          changeLog: 'Updated estimate',
          createdBy: userId
        }
      })

      // Log audit trail
      await tx.auditLog.create({
        data: {
          userId,
          action: 'update',
          entityType: 'estimate',
          entityId: id,
          oldValues: { totalCost: currentEstimate.totalCost },
          newValues: { totalCost: updatedEstimate.totalCost },
          metadata: { version: updatedEstimate.version }
        }
      })

      // Get updated estimate with details
      return this.getById(id, userId) as Promise<EstimateWithDetails>
    })
  }

  // Delete estimate
  static async delete(id: string, userId: string): Promise<boolean> {
    return withTransaction(async (tx) => {
      const estimate = await tx.estimate.findFirst({
        where: { id, userId }
      })

      if (!estimate) {
        throw new Error('Estimate not found')
      }

      // Delete estimate (cascade will handle related records)
      await tx.estimate.delete({ where: { id } })

      // Log audit trail
      await tx.auditLog.create({
        data: {
          userId,
          action: 'delete',
          entityType: 'estimate',
          entityId: id,
          oldValues: { projectName: estimate.projectName },
          metadata: { deletedAt: new Date().toISOString() }
        }
      })

      return true
    })
  }

  // Get estimate versions
  static async getVersions(estimateId: string, userId: string) {
    // Verify user has access to this estimate
    const estimate = await prisma.estimate.findFirst({
      where: { id: estimateId, userId }
    })

    if (!estimate) {
      throw new Error('Estimate not found')
    }

    return prisma.estimateVersion.findMany({
      where: { estimateId },
      orderBy: { version: 'desc' },
      take: 10 // Limit to last 10 versions
    })
  }

  // Update estimate status
  static async updateStatus(
    id: string,
    userId: string,
    status: 'DRAFT' | 'IN_PROGRESS' | 'UNDER_REVIEW' | 'APPROVED' | 'COMPLETED' | 'ARCHIVED' | 'CANCELLED'
  ): Promise<EstimateWithDetails> {
    return withTransaction(async (tx) => {
      const estimate = await tx.estimate.findFirst({
        where: { id, userId }
      })

      if (!estimate) {
        throw new Error('Estimate not found')
      }

      const updatedEstimate = await tx.estimate.update({
        where: { id },
        data: {
          status,
          ...(status === 'COMPLETED' && { completedAt: new Date() })
        },
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        }
      })

      // Log audit trail
      await tx.auditLog.create({
        data: {
          userId,
          action: 'status_change',
          entityType: 'estimate',
          entityId: id,
          oldValues: { status: estimate.status },
          newValues: { status },
          metadata: { timestamp: new Date().toISOString() }
        }
      })

      return this.getById(id, userId) as Promise<EstimateWithDetails>
    })
  }
}
