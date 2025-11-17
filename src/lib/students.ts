import { supabase } from './supabase'

export interface Student {
  matricula: number
  nombre_abr?: string
  cve_nivel?: string
  cve_programa?: string
  cve_departamento?: string
  activo: boolean
}

export interface StudentRow {
  matricula: string | number
  nombre_abr?: string
  nombre?: string
  cve_nivel?: string
  cve_programa?: string
  cve_departamento?: string
  activo?: boolean
}

// Normalizar matrícula: convertir a número y eliminar ceros a la izquierda
export function normalizeMatricula(matricula: string | number): number {
  const str = String(matricula).trim()
  const normalized = parseInt(str.replace(/^0+/, '') || '0', 10)
  return normalized
}

// Obtener todos los estudiantes
export async function getAllStudents(): Promise<Student[]> {
  let allStudents: Student[] = []
  let from = 0
  const pageSize = 1000 // Supabase tiene un límite de 1000 por defecto
  
  while (true) {
    const { data, error, count } = await supabase
      .from('students')
      .select('*', { count: 'exact' })
      .order('matricula', { ascending: true })
      .range(from, from + pageSize - 1)

    if (error) {
      console.error('Error obteniendo estudiantes:', error)
      throw new Error(`Error al obtener estudiantes: ${error.message}`)
    }

    if (data) {
      allStudents = [...allStudents, ...data]
    }

    // Si no hay más datos o ya obtuvimos todos, salir
    if (!data || data.length < pageSize || (count && allStudents.length >= count)) {
      break
    }

    from += pageSize
  }

  return allStudents
}

// Obtener un estudiante por matrícula
export async function getStudentByMatricula(matricula: string | number): Promise<Student | null> {
  const normalizedMatricula = normalizeMatricula(matricula)
  
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('matricula', normalizedMatricula)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null // No encontrado
    }
    console.error('Error obteniendo estudiante:', error)
    throw new Error(`Error al obtener estudiante: ${error.message}`)
  }

  return data
}

// Crear un nuevo estudiante
export async function createStudent(student: StudentRow): Promise<Student> {
  const normalizedMatricula = normalizeMatricula(student.matricula)
  
  const { data, error } = await supabase
    .from('students')
    .insert({
      matricula: normalizedMatricula,
      nombre_abr: student.nombre_abr || student.nombre || null,
      cve_nivel: student.cve_nivel || null,
      cve_programa: student.cve_programa || null,
      cve_departamento: student.cve_departamento || null,
      activo: true
    })
    .select()
    .single()

  if (error) {
    console.error('Error creando estudiante:', error)
    throw new Error(`Error al crear estudiante: ${error.message}`)
  }

  return data
}

// Actualizar un estudiante
export async function updateStudent(
  matricula: string | number,
  updates: Partial<Omit<Student, 'matricula'>>
): Promise<Student> {
  const normalizedMatricula = normalizeMatricula(matricula)
  
  const { data, error } = await supabase
    .from('students')
    .update(updates)
    .eq('matricula', normalizedMatricula)
    .select()
    .single()

  if (error) {
    console.error('Error actualizando estudiante:', error)
    throw new Error(`Error al actualizar estudiante: ${error.message}`)
  }

  return data
}

// Activar/Desactivar estudiante
export async function toggleStudentActive(matricula: string | number, activo: boolean): Promise<Student> {
  return updateStudent(matricula, { activo })
}

// Eliminar un estudiante
export async function deleteStudent(matricula: string | number): Promise<void> {
  const normalizedMatricula = normalizeMatricula(matricula)
  
  const { error } = await supabase
    .from('students')
    .delete()
    .eq('matricula', normalizedMatricula)

  if (error) {
    console.error('Error eliminando estudiante:', error)
    throw new Error(`Error al eliminar estudiante: ${error.message}`)
  }
}

// Procesar archivo Excel/CSV y obtener cambios propuestos
export interface ProcessFileResult {
  toInsert: StudentRow[]
  toUpdate: Array<{ matricula: number; updates: Partial<Student> }>
  toDeactivate: Array<{ matricula: number }>
  errors: string[]
}

export async function processStudentFile(rows: StudentRow[]): Promise<ProcessFileResult> {
  const result: ProcessFileResult = {
    toInsert: [],
    toUpdate: [],
    toDeactivate: [],
    errors: []
  }

  try {
    // Obtener todos los estudiantes existentes
    const existingStudents = await getAllStudents()
    const existingMap = new Map<number, Student>()
    
    existingStudents.forEach(student => {
      existingMap.set(student.matricula, student)
    })

    // Crear set de matrículas en el archivo
    const fileMatriculas = new Set<number>()
    const processedMatriculas = new Set<number>()

    // Procesar cada fila del archivo
    for (const row of rows) {
      try {
        const normalizedMatricula = normalizeMatricula(row.matricula)
        
        // Validar matrícula
        if (isNaN(normalizedMatricula) || normalizedMatricula <= 0) {
          result.errors.push(`Matrícula inválida: ${row.matricula}`)
          continue
        }

        // Verificar duplicados en el archivo
        if (processedMatriculas.has(normalizedMatricula)) {
          result.errors.push(`Matrícula duplicada en el archivo: ${normalizedMatricula}`)
          continue
        }
        processedMatriculas.add(normalizedMatricula)
        fileMatriculas.add(normalizedMatricula)

        const existing = existingMap.get(normalizedMatricula)
        const nombre = row.nombre_abr || row.nombre

        if (existing) {
          // Determinar el estado activo: usar el del archivo si está definido, sino mantener el existente
          const activo = row.activo !== undefined ? row.activo : existing.activo
          
          // Verificar si hay cambios
          const hasChanges = 
            (nombre && existing.nombre_abr !== nombre) ||
            (row.cve_nivel && existing.cve_nivel !== row.cve_nivel) ||
            (row.cve_programa && existing.cve_programa !== row.cve_programa) ||
            (row.cve_departamento && existing.cve_departamento !== row.cve_departamento) ||
            (row.activo !== undefined && existing.activo !== row.activo)

          if (hasChanges) {
            result.toUpdate.push({
              matricula: normalizedMatricula,
              updates: {
                nombre_abr: nombre || existing.nombre_abr,
                cve_nivel: row.cve_nivel || existing.cve_nivel,
                cve_programa: row.cve_programa || existing.cve_programa,
                cve_departamento: row.cve_departamento || existing.cve_departamento,
                activo: activo
              }
            })
          }
        } else {
          // Nuevo estudiante: activo por defecto si no se especifica
          const activo = row.activo !== undefined ? row.activo : true
          
          result.toInsert.push({
            matricula: normalizedMatricula,
            nombre_abr: nombre,
            nombre: nombre,
            cve_nivel: row.cve_nivel,
            cve_programa: row.cve_programa,
            cve_departamento: row.cve_departamento,
            activo: activo
          })
        }
      } catch (error) {
        result.errors.push(`Error procesando fila con matrícula ${row.matricula}: ${error instanceof Error ? error.message : 'Error desconocido'}`)
      }
    }

    // Identificar estudiantes a desactivar (están en BD pero no en el archivo)
    existingStudents.forEach(student => {
      if (!fileMatriculas.has(student.matricula) && student.activo) {
        result.toDeactivate.push({ matricula: student.matricula })
      }
    })

  } catch (error) {
    result.errors.push(`Error general: ${error instanceof Error ? error.message : 'Error desconocido'}`)
  }

  return result
}

// Aplicar cambios a la base de datos
export async function applyStudentChanges(result: ProcessFileResult): Promise<{
  inserted: number
  updated: number
  deactivated: number
  errors: string[]
}> {
  const response = {
    inserted: 0,
    updated: 0,
    deactivated: 0,
    errors: [] as string[]
  }

  try {
    // Insertar nuevos estudiantes
    if (result.toInsert.length > 0) {
      const studentsToInsert = result.toInsert.map(row => ({
        matricula: normalizeMatricula(row.matricula),
        nombre_abr: row.nombre_abr || row.nombre || null,
        cve_nivel: row.cve_nivel || null,
        cve_programa: row.cve_programa || null,
        cve_departamento: row.cve_departamento || null,
        activo: row.activo !== undefined ? row.activo : true
      }))

      const { error: insertError } = await supabase
        .from('students')
        .insert(studentsToInsert)

      if (insertError) {
        response.errors.push(`Error insertando estudiantes: ${insertError.message}`)
      } else {
        response.inserted = result.toInsert.length
      }
    }

    // Actualizar estudiantes existentes
    for (const update of result.toUpdate) {
      try {
        await updateStudent(update.matricula, update.updates)
        response.updated++
      } catch (error) {
        response.errors.push(`Error actualizando matrícula ${update.matricula}: ${error instanceof Error ? error.message : 'Error desconocido'}`)
      }
    }

    // Desactivar estudiantes
    for (const deactivate of result.toDeactivate) {
      try {
        await toggleStudentActive(deactivate.matricula, false)
        response.deactivated++
      } catch (error) {
        response.errors.push(`Error desactivando matrícula ${deactivate.matricula}: ${error instanceof Error ? error.message : 'Error desconocido'}`)
      }
    }

  } catch (error) {
    response.errors.push(`Error general aplicando cambios: ${error instanceof Error ? error.message : 'Error desconocido'}`)
  }

  return response
}

