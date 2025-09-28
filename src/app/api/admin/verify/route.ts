import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const adminSession = cookieStore.get('admin-session')

    if (adminSession?.value === 'authenticated') {
      return NextResponse.json({
        authenticated: true,
        message: 'Admin session valid',
      })
    } else {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error('Admin verify error:', error)
    return NextResponse.json(
      { message: 'Error verifying session' },
      { status: 500 }
    )
  }
}
