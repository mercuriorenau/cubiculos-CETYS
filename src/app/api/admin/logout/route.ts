import { NextRequest, NextResponse } from 'next/server'
import { destroyAdminSession } from '@/lib/auth-admin'

export async function POST(request: NextRequest) {
  try {
    await destroyAdminSession()

    return NextResponse.json({
      success: true,
      message: 'Logout successful',
    })
  } catch (error) {
    console.error('Admin logout error:', error)
    return NextResponse.json(
      { message: 'Error during logout' },
      { status: 500 }
    )
  }
}
