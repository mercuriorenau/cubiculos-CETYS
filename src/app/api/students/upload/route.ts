import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { processStudentFile, StudentRow } from '@/lib/students'
import { requireAdminAuth } from '@/lib/auth-admin'

// POST - Subir archivo de estudiantes (SOLO ADMINISTRADORES)
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación de administrador
    const authError = await requireAdminAuth(request)
    if (authError) {
      return authError
    }
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó ningún archivo' },
        { status: 400 }
      )
    }

    const filename = file.name.toLowerCase()
    if (!filename.endsWith('.xlsx') && !filename.endsWith('.csv') && !filename.endsWith('.xls')) {
      return NextResponse.json(
        { error: 'El archivo debe ser Excel (.xlsx, .xls) o CSV (.csv)' },
        { status: 400 }
      )
    }

    // Leer el archivo
    const arrayBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    
    // Convertir a JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]
    
    if (jsonData.length < 2) {
      return NextResponse.json(
        { error: 'El archivo debe tener al menos una fila de datos (además del encabezado)' },
        { status: 400 }
      )
    }

    // Detectar encabezados (primera fila)
    const headers = jsonData[0].map((h: any) => String(h).toLowerCase().trim())
    
    // Buscar índices de columnas
    const matriculaIndex = headers.findIndex(h => 
      h.includes('matricula') || h.includes('matrícula') || h === 'mat' || h === 'm'
    )
    const nombreIndex = headers.findIndex(h => 
      h.includes('nombre') || h.includes('name') || h.includes('nombre_abr')
    )
    const nivelIndex = headers.findIndex(h => 
      h.includes('nivel') || h.includes('cve_nivel') || h.includes('level')
    )
    const programaIndex = headers.findIndex(h => 
      h.includes('programa') || h.includes('cve_programa') || h.includes('program')
    )
    const departamentoIndex = headers.findIndex(h => 
      h.includes('departamento') || h.includes('cve_departamento') || h.includes('dept')
    )
    const activoIndex = headers.findIndex(h => 
      h.includes('activo') || h.includes('active') || h.includes('estado')
    )

    if (matriculaIndex === -1) {
      return NextResponse.json(
        { error: 'No se encontró la columna de matrícula. Asegúrate de que el archivo tenga una columna llamada "matricula" o "matrícula"' },
        { status: 400 }
      )
    }

    // Procesar filas de datos
    const rows: StudentRow[] = []
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i]
      if (!row || row.length === 0) continue

      const matricula = row[matriculaIndex]
      if (!matricula) continue

      // Procesar campo activo
      let activo: boolean | undefined = undefined
      if (activoIndex !== -1 && row[activoIndex] !== undefined && row[activoIndex] !== null && row[activoIndex] !== '') {
        const activoValue = String(row[activoIndex]).trim().toLowerCase()
        activo = activoValue === 'true' || activoValue === '1' || activoValue === 'si' || activoValue === 'sí' || activoValue === 'yes'
      }

      rows.push({
        matricula: String(matricula).trim(),
        nombre_abr: nombreIndex !== -1 && row[nombreIndex] ? String(row[nombreIndex]).trim() : undefined,
        nombre: nombreIndex !== -1 && row[nombreIndex] ? String(row[nombreIndex]).trim() : undefined,
        cve_nivel: nivelIndex !== -1 && row[nivelIndex] ? String(row[nivelIndex]).trim() : undefined,
        cve_programa: programaIndex !== -1 && row[programaIndex] ? String(row[programaIndex]).trim() : undefined,
        cve_departamento: departamentoIndex !== -1 && row[departamentoIndex] ? String(row[departamentoIndex]).trim() : undefined,
        activo: activo,
      })
    }

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'No se encontraron datos válidos en el archivo' },
        { status: 400 }
      )
    }

    // Procesar el archivo y obtener cambios propuestos
    const result = await processStudentFile(rows)

    return NextResponse.json({
      success: true,
      ...result
    })

  } catch (error) {
    console.error('Error procesando archivo:', error)
    return NextResponse.json(
      { 
        error: 'Error al procesar el archivo',
        message: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}

