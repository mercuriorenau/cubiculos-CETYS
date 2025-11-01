import { NextRequest, NextResponse } from 'next/server'
import { applyStudentChanges, ProcessFileResult } from '@/lib/students'
import { requireAdminAuth } from '@/lib/auth-admin'

// POST - Aplicar cambios de estudiantes (SOLO ADMINISTRADORES)
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación de administrador
    const authError = await requireAdminAuth(request)
    if (authError) {
      return authError
    }
    const body = await request.json()
    const result: ProcessFileResult = body

    if (!result || !result.toInsert || !result.toUpdate || !result.toDeactivate) {
      return NextResponse.json(
        { error: 'Datos inválidos' },
        { status: 400 }
      )
    }

    // Aplicar cambios
    const response = await applyStudentChanges(result)

    return NextResponse.json({
      success: true,
      ...response
    })

  } catch (error) {
    console.error('Error aplicando cambios:', error)
    return NextResponse.json(
      { 
        error: 'Error al aplicar los cambios',
        message: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}

