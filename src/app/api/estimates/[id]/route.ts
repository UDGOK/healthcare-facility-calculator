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

// GET /api/estimates/[id] - Get estimate by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate user
    const user = await authenticate(request)
    if (!user) {
      return errorResponse('Unauthorized', 401)
    }

    const { id } = await params

    // Get estimate
    const estimate = await EstimateService.getById(id, user.id)

    if (!estimate) {
      return errorResponse('Estimate not found', 404)
    }

    return successResponse(estimate)
  } catch (error) {
    console.error('GET /api/estimates/[id] error:', error)
    return errorResponse('Internal server error', 500)
  }
}

// PUT /api/estimates/[id] - Update estimate
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate user
    const user = await authenticate(request)
    if (!user) {
      return errorResponse('Unauthorized', 401)
    }

    const { id } = await params

    // Parse request body
    const body = await request.json()

    // Update estimate
    const estimate = await EstimateService.update(id, user.id, body)

    return successResponse(estimate)
  } catch (error) {
    console.error('PUT /api/estimates/[id] error:', error)

    if (error instanceof z.ZodError) {
      return errorResponse(`Validation error: ${error.errors.map(e => e.message).join(', ')}`)
    }

    if (error instanceof Error) {
      return errorResponse(error.message)
    }

    return errorResponse('Internal server error', 500)
  }
}

// DELETE /api/estimates/[id] - Delete estimate
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate user
    const user = await authenticate(request)
    if (!user) {
      return errorResponse('Unauthorized', 401)
    }

    const { id } = await params

    // Delete estimate
    const success = await EstimateService.delete(id, user.id)

    if (!success) {
      return errorResponse('Estimate not found', 404)
    }

    return successResponse({ deleted: true })
  } catch (error) {
    console.error('DELETE /api/estimates/[id] error:', error)

    if (error instanceof Error) {
      return errorResponse(error.message)
    }

    return errorResponse('Internal server error', 500)
  }
}
