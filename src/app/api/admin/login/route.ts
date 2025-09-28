import { NextRequest, NextResponse } from 'next/server'
import { AdminLoginSchema } from '@/lib/schemas'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = AdminLoginSchema.parse(body)

    const { username, password } = validatedData

    // Check if admin backdoor is enabled
    const adminBackdoorEnabled = process.env.ADMIN_BACKDOOR_ENABLED === 'true'
    const adminUser = process.env.ADMIN_USER
    const adminPass = process.env.ADMIN_PASS

    if (!adminBackdoorEnabled) {
      return NextResponse.json(
        { message: 'Admin backdoor is disabled' },
        { status: 403 }
      )
    }

    // Validate credentials
    if (username === adminUser && password === adminPass) {
      // Create admin session cookie
      const cookieStore = cookies()
      cookieStore.set('admin-session', 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24, // 24 hours
        path: '/',
      })

      return NextResponse.json({
        success: true,
        message: 'Login successful',
      })
    } else {
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error('Admin login error:', error)
    return NextResponse.json(
      { message: 'Invalid request' },
      { status: 400 }
    )
  }
}
