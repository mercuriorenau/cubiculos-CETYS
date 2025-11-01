import { NextRequest, NextResponse } from 'next/server'
import { validateVerificationCode } from '@/lib/verification'

export async function POST(request: NextRequest) {
  try {
    const { matricula, code } = await request.json()
    
    if (!matricula || typeof matricula !== 'string') {
      return NextResponse.json(
        { error: 'Matrícula requerida' },
        { status: 400 }
      )
    }
    
    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Código de verificación requerido' },
        { status: 400 }
      )
    }
    
    // Validar código
    const result = validateVerificationCode(matricula, code)
    
    if (!result.valid) {
      return NextResponse.json(
        { error: result.message || 'Código de verificación inválido' },
        { status: 400 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Código de verificación válido'
    })
  } catch (error) {
    console.error('Error en verify verification:', error)
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    )
  }
}

