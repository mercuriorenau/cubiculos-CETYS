import { supabase } from './supabase'
import { VerifyMatriculaSchema } from './schemas'

export interface User {
  id: string
  email: string
  matricula?: string
  verified: boolean
  role: 'student' | 'admin'
}

export async function getCurrentUser(): Promise<User | null> {
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return null
  }

  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (userError || !userData) {
    return null
  }

  return userData as User
}

export async function verifyMatricula(matricula: string): Promise<{ valid: boolean; message?: string }> {
  try {
    console.log('🔍 Validando matrícula:', matricula)
    const validatedData = VerifyMatriculaSchema.parse({ matricula })
    const trimmedMatricula = validatedData.matricula.trim()
    
    // Normalizar matrícula: eliminar ceros a la izquierda y convertir a número
    // Ejemplo: "000001" -> 1, "001234" -> 1234, "13652" -> 13652
    // La tabla 'students' tiene matricula como int8 (número)
    const normalizedNumber = parseInt(trimmedMatricula.replace(/^0+/, '') || '0', 10)
    
    console.log('📝 Matrícula original:', matricula)
    console.log('📝 Matrícula normalizada (número):', normalizedNumber)

    // Solo usar Supabase - NO usar fallback mock
    console.log('🔍 Buscando en tabla "students"...')
    
    // Primero buscar la matrícula SIN filtrar por activo
    // Esto nos permite verificar si existe y si está activa
    const { data: studentEntry, error } = await supabase
      .from('students')
      .select('*')
      .eq('matricula', normalizedNumber)
      .single()

    console.log('📊 Resultado de Supabase:', { studentEntry, error })

    if (error) {
      // Si el error es "PGRST116" significa que no se encontró ningún registro
      if (error.code === 'PGRST116') {
        console.log('❌ Matrícula no encontrada en la base de datos')
        return { valid: false, message: 'Matrícula no encontrada en la lista de estudiantes autorizados' }
      }
      
      console.error('❌ Error de Supabase:', error)
      return { valid: false, message: `Error de conexión: ${error.message}` }
    }

    if (!studentEntry) {
      console.log('❌ Matrícula no encontrada en la base de datos')
      return { valid: false, message: 'Matrícula no encontrada en la lista de estudiantes autorizados' }
    }

    // Verificar si la matrícula está activa
    if (!studentEntry.activo) {
      console.log('⚠️ Matrícula encontrada pero NO está activa')
      return { 
        valid: false, 
        message: 'Tu matrícula no está activa. Por favor, acude a Dirección para activar tu matrícula.' 
      }
    }

    console.log('✅ Matrícula válida y activa encontrada en Supabase:', studentEntry)
    return { valid: true }
  } catch (error) {
    console.error('❌ Error validando matrícula:', error)
    // Si el error es de validación de Zod, dar un mensaje más claro
    if (error instanceof Error && error.name === 'ZodError') {
      return { valid: false, message: 'Formato de matrícula inválido. Debe ser un número.' }
    }
    return { valid: false, message: 'Formato de matrícula inválido' }
  }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) {
    throw new Error(error.message)
  }
}

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function signUpWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    throw new Error(error.message)
  }

  // Create user record
  if (data.user) {
    const { error: insertError } = await supabase
      .from('users')
      .insert({
        id: data.user.id,
        email: data.user.email!,
        verified: false,
        role: 'student'
      })

    if (insertError) {
      console.error('Error creating user record:', insertError)
    }
  }

  return data
}

export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })

  if (error) {
    throw new Error(error.message)
  }
}

export async function getStudentName(matricula: string): Promise<string | null> {
  try {
    const trimmedMatricula = matricula.trim()
    const normalizedNumber = parseInt(trimmedMatricula.replace(/^0+/, '') || '0', 10)
    
    const { data: studentEntry, error } = await supabase
      .from('students')
      .select('nombre_abr')
      .eq('matricula', normalizedNumber)
      .single()

    if (error || !studentEntry) {
      return null
    }

    return studentEntry.nombre_abr || null
  } catch (error) {
    console.error('Error obteniendo nombre del estudiante:', error)
    return null
  }
}
