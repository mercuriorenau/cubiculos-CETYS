// Utilidades de autenticación y autorización para administradores

import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

// Clave secreta para firmar las sesiones (debe estar en variables de entorno)
const SESSION_SECRET = process.env.SESSION_SECRET || 'default-secret-change-in-production'
const SESSION_DURATION = 60 * 60 * 24 // 24 horas en segundos

// Generar token de sesión seguro
function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

// Crear hash de la sesión
function hashSession(sessionToken: string): string {
  return crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(sessionToken)
    .digest('hex')
}

// Verificar sesión de administrador
export async function verifyAdminSession(): Promise<boolean> {
  try {
    const cookieStore = cookies()
    const sessionToken = cookieStore.get('admin-session-token')?.value
    const sessionHash = cookieStore.get('admin-session-hash')?.value

    if (!sessionToken || !sessionHash) {
      return false
    }

    // Verificar que el hash coincida
    const expectedHash = hashSession(sessionToken)
    if (sessionHash !== expectedHash) {
      return false
    }

    // Verificar expiración (almacenada en el token)
    // Por simplicidad, usamos maxAge en la cookie, pero podríamos agregar timestamp aquí

    return true
  } catch (error) {
    console.error('Error verificando sesión admin:', error)
    return false
  }
}

// Crear sesión de administrador
export async function createAdminSession(): Promise<{ token: string; hash: string }> {
  const token = generateSessionToken()
  const hash = hashSession(token)

  const cookieStore = cookies()
  
  // Guardar token y hash en cookies separadas
  cookieStore.set('admin-session-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: SESSION_DURATION,
    path: '/',
  })

  cookieStore.set('admin-session-hash', hash, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: SESSION_DURATION,
    path: '/',
  })

  return { token, hash }
}

// Destruir sesión de administrador
export async function destroyAdminSession(): Promise<void> {
  const cookieStore = cookies()
  cookieStore.delete('admin-session-token')
  cookieStore.delete('admin-session-hash')
  cookieStore.delete('admin-session') // Limpiar cookie antigua si existe
}

// Middleware para proteger rutas API (usar en route handlers)
export async function requireAdminAuth(
  request: NextRequest
): Promise<NextResponse | null> {
  const isAuthenticated = await verifyAdminSession()

  if (!isAuthenticated) {
    return NextResponse.json(
      { error: 'No autorizado. Se requiere autenticación de administrador.' },
      { status: 401 }
    )
  }

  return null // null significa que la autenticación pasó
}

// Verificar autenticación desde el cliente (para proteger páginas)
export async function checkAdminAuth(): Promise<boolean> {
  try {
    const response = await fetch('/api/admin/verify', {
      method: 'GET',
      credentials: 'include',
    })

    if (!response.ok) {
      return false
    }

    const data = await response.json()
    return data.authenticated === true
  } catch (error) {
    console.error('Error verificando autenticación:', error)
    return false
  }
}

