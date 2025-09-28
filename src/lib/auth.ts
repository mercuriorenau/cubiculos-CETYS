import { supabase } from './supabase'
import { VerifyMatriculaSchema } from './schemas'
import { mockUser } from './mock-data'

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
    const validatedData = VerifyMatriculaSchema.parse({ matricula })
    const normalizedMatricula = validatedData.matricula.trim().toUpperCase()
    
    // Normalizar matrícula: eliminar ceros a la izquierda
    // Ejemplo: "000001" -> "1", "001234" -> "1234"
    const normalizedNumber = normalizedMatricula.replace(/^0+/, '') || '0'

    // Check if matricula exists in whitelist (both original and normalized)
    const { data: whitelistEntry, error } = await supabase
      .from('whitelist_matriculas')
      .select('*')
      .or(`matricula.eq.${normalizedMatricula},matricula.eq.${normalizedNumber}`)
      .eq('activo', true)
      .single()

    if (error || !whitelistEntry) {
      return { valid: false, message: 'Matrícula no encontrada en la lista de estudiantes autorizados' }
    }

    return { valid: true }
  } catch (error) {
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
