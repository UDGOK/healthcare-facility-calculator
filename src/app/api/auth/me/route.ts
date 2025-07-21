import { NextRequest, NextResponse } from 'next/server'
import { UserService } from '@/lib/services/user-service'

// Error response helper
function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

// Success response helper
function successResponse(data: any, status = 200) {
  return NextResponse.json({ success: true, data }, { status })
}

// Authentication helper
async function authenticate(request: NextRequest) {
  // Get token from cookie or authorization header
  const cookieToken = request.cookies.get('auth-token')?.value
  const authHeader = request.headers.get('authorization')
  const headerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null

  const token = cookieToken || headerToken

  if (!token) {
    return null
  }

  return await UserService.verifySession(token)
}

// GET /api/auth/me - Get current user
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const user = await authenticate(request)
    if (!user) {
      return errorResponse('Unauthorized', 401)
    }

    return successResponse(user)
  } catch (error) {
    console.error('GET /api/auth/me error:', error)
    return errorResponse('Internal server error', 500)
  }
}
