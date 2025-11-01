import { NextRequest, NextResponse } from 'next/server'
import { AdminLoginSchema } from '@/lib/schemas'
import { createAdminSession } from '@/lib/auth-admin'

// Rate limiting simple (en producción usar Redis o similar)
const loginAttempts = new Map<string, { count: number; resetAt: number }>()
const MAX_ATTEMPTS = 5
const LOCKOUT_DURATION = 15 * 60 * 1000 // 15 minutos

function getClientId(request: NextRequest): string {
  // Usar IP del cliente como identificador
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown'
  return ip
}

function checkRateLimit(clientId: string): boolean {
  const now = Date.now()
  const attempt = loginAttempts.get(clientId)

  if (!attempt) {
    return true
  }

  // Si el lockout expiró, resetear
  if (now > attempt.resetAt) {
    loginAttempts.delete(clientId)
    return true
  }

  // Si excedió el límite, bloquear
  if (attempt.count >= MAX_ATTEMPTS) {
    return false
  }

  return true
}

function recordFailedAttempt(clientId: string): void {
  const now = Date.now()
  const attempt = loginAttempts.get(clientId)

  if (!attempt || now > attempt.resetAt) {
    loginAttempts.set(clientId, {
      count: 1,
      resetAt: now + LOCKOUT_DURATION,
    })
  } else {
    attempt.count++
  }
}

export async function POST(request: NextRequest) {
  try {
    const clientId = getClientId(request)

    // Verificar rate limiting
    if (!checkRateLimit(clientId)) {
      return NextResponse.json(
        { 
          message: 'Demasiados intentos fallidos. Por favor, intenta de nuevo en 15 minutos.' 
        },
        { status: 429 }
      )
    }

    const body = await request.json()
    const validatedData = AdminLoginSchema.parse(body)

    const { username, password } = validatedData

    // Usar variables de entorno si están configuradas, sino usar credenciales por defecto
    const adminUser = process.env.ADMIN_USER || 'admin'
    const adminPass = process.env.ADMIN_PASS || 'admin'

    // Validate credentials
    if (username === adminUser && password === adminPass) {
      // Limpiar intentos fallidos
      loginAttempts.delete(clientId)

      // Create secure admin session
      await createAdminSession()

      return NextResponse.json({
        success: true,
        message: 'Login successful',
      })
    } else {
      // Registrar intento fallido
      recordFailedAttempt(clientId)

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
