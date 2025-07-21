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

// POST /api/auth/logout - Logout user
export async function POST(request: NextRequest) {
  try {
    // Get token from cookie or authorization header
    const cookieToken = request.cookies.get('auth-token')?.value
    const authHeader = request.headers.get('authorization')
    const headerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null

    const token = cookieToken || headerToken

    if (!token) {
      return errorResponse('No token provided', 401)
    }

    // Logout user (invalidate session)
    await UserService.logout(token)

    // Clear cookie
    const response = successResponse({ message: 'Logged out successfully' })
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires: new Date(0) // Expire immediately
    })

    return response
  } catch (error) {
    console.error('POST /api/auth/logout error:', error)
    return errorResponse('Internal server error', 500)
  }
}
