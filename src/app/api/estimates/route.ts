import { NextRequest, NextResponse } from 'next/server'
import { EstimateService } from '@/lib/services/estimate-service'
import { UserService } from '@/lib/services/user-service'
import { z } from 'zod'

// Authentication middleware
async function authenticate(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)
  return await UserService.verifySession(token)
}

// Error response helper
function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

// Success response helper
function successResponse(data: any, status = 200) {
  return NextResponse.json({ success: true, data }, { status })
}

// GET /api/estimates - Get user's estimates
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const user = await authenticate(request)
    if (!user) {
      return errorResponse('Unauthorized', 401)
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status') || undefined
    const facilityType = searchParams.get('facilityType') || undefined
    const search = searchParams.get('search') || undefined

    // Validate pagination
    if (page < 1 || limit < 1 || limit > 100) {
      return errorResponse('Invalid pagination parameters')
    }

    // Get estimates
    const result = await EstimateService.getUserEstimates(user.id, {
      page,
      limit,
      status,
      facilityType,
      search
    })

    return successResponse(result)
  } catch (error) {
    console.error('GET /api/estimates error:', error)
    return errorResponse('Internal server error', 500)
  }
}

// POST /api/estimates - Create new estimate
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await authenticate(request)
    if (!user) {
      return errorResponse('Unauthorized', 401)
    }

    // Parse request body
    const body = await request.json()

    // Create estimate
    const estimate = await EstimateService.create(user.id, body)

    return successResponse(estimate, 201)
  } catch (error) {
    console.error('POST /api/estimates error:', error)

    if (error instanceof z.ZodError) {
      return errorResponse(`Validation error: ${error.errors.map(e => e.message).join(', ')}`)
    }

    if (error instanceof Error) {
      return errorResponse(error.message)
    }

    return errorResponse('Internal server error', 500)
  }
}
