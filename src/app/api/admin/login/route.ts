import { NextRequest, NextResponse } from 'next/server'
import { AdminLoginSchema } from '@/lib/schemas'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = AdminLoginSchema.parse(body)

    const { username, password } = validatedData

    // Usar variables de entorno si están configuradas, sino usar credenciales por defecto
    const adminUser = process.env.ADMIN_USER || 'admin'
    const adminPass = process.env.ADMIN_PASS || 'admin'

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
        { message: 'Credenciales inválidas' },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error('Admin login error:', error)
    return NextResponse.json(
      { message: 'Error en la solicitud' },
      { status: 400 }
    )
  }
}
