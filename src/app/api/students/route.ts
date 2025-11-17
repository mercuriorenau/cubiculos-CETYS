import { NextRequest, NextResponse } from 'next/server'
import { getAllStudents, createStudent, updateStudent, toggleStudentActive, deleteStudent, StudentRow } from '@/lib/students'

// GET - Obtener todos los estudiantes
export async function GET(request: NextRequest) {
  try {
    const students = await getAllStudents()
    return NextResponse.json({
      success: true,
      data: students
    })
  } catch (error) {
    console.error('Error obteniendo estudiantes:', error)
    return NextResponse.json(
      { 
        error: 'Error al obtener estudiantes',
        message: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}

// POST - Crear un nuevo estudiante
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const student: StudentRow = body

    if (!student.matricula) {
      return NextResponse.json(
        { error: 'La matrícula es requerida' },
        { status: 400 }
      )
    }

    const newStudent = await createStudent(student)

    return NextResponse.json({
      success: true,
      data: newStudent
    })
  } catch (error) {
    console.error('Error creando estudiante:', error)
    return NextResponse.json(
      { 
        error: 'Error al crear estudiante',
        message: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}

// PUT - Actualizar un estudiante
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { matricula, ...updates } = body

    if (!matricula) {
      return NextResponse.json(
        { error: 'La matrícula es requerida' },
        { status: 400 }
      )
    }

    const updatedStudent = await updateStudent(matricula, updates)

    return NextResponse.json({
      success: true,
      data: updatedStudent
    })
  } catch (error) {
    console.error('Error actualizando estudiante:', error)
    return NextResponse.json(
      { 
        error: 'Error al actualizar estudiante',
        message: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar un estudiante
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const matricula = searchParams.get('matricula')

    if (!matricula) {
      return NextResponse.json(
        { error: 'La matrícula es requerida' },
        { status: 400 }
      )
    }

    await deleteStudent(matricula)

    return NextResponse.json({
      success: true,
      message: 'Estudiante eliminado exitosamente'
    })
  } catch (error) {
    console.error('Error eliminando estudiante:', error)
    return NextResponse.json(
      { 
        error: 'Error al eliminar estudiante',
        message: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}

// PATCH - Activar/Desactivar estudiante
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { matricula, activo } = body

    if (!matricula || typeof activo !== 'boolean') {
      return NextResponse.json(
        { error: 'La matrícula y el estado (activo) son requeridos' },
        { status: 400 }
      )
    }

    const updatedStudent = await toggleStudentActive(matricula, activo)

    return NextResponse.json({
      success: true,
      data: updatedStudent
    })
  } catch (error) {
    console.error('Error cambiando estado del estudiante:', error)
    return NextResponse.json(
      { 
        error: 'Error al cambiar estado del estudiante',
        message: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}

