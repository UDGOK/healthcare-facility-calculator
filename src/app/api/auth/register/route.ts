import { NextRequest, NextResponse } from 'next/server'
import { UserService } from '@/lib/services/user-service'
import { z } from 'zod'

// Error response helper
function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

// Success response helper
function successResponse(data: any, status = 200) {
  return NextResponse.json({ success: true, data }, { status })
}

// POST /api/auth/register - Register new user
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()

    // Get client metadata
    const ipAddress = request.ip ||
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Register user
    const result = await UserService.register(body, {
      ipAddress,
      userAgent
    })

    // Set secure HTTP-only cookie with the token
    const response = successResponse({
      user: result.user,
      expiresAt: result.expiresAt
    }, 201)

    // Set cookie options
    const isProduction = process.env.NODE_ENV === 'production'
    response.cookies.set('auth-token', result.token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      expires: result.expiresAt
    })

    return response
  } catch (error) {
    console.error('POST /api/auth/register error:', error)

    if (error instanceof z.ZodError) {
      return errorResponse(`Validation error: ${error.errors.map(e => e.message).join(', ')}`)
    }

    if (error instanceof Error) {
      return errorResponse(error.message)
    }

    return errorResponse('Internal server error', 500)
  }
}
