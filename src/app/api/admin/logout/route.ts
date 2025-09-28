import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    cookieStore.delete('admin-session')

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
