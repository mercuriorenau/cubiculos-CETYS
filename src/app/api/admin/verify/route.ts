import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminSession } from '@/lib/auth-admin'

export async function GET(request: NextRequest) {
  try {
    const isAuthenticated = await verifyAdminSession()

    if (isAuthenticated) {
      return NextResponse.json({
        authenticated: true,
        message: 'Admin session valid',
      })
    } else {
      return NextResponse.json(
        { authenticated: false, message: 'Not authenticated' },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error('Admin verify error:', error)
    return NextResponse.json(
      { authenticated: false, message: 'Error verifying session' },
      { status: 500 }
    )
  }
}
