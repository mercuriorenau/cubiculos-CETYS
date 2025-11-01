// Sistema de verificación por correo electrónico

export interface VerificationCode {
  code: string
  matricula: string
  email: string
  expiresAt: number // timestamp
  attempts: number
}

// Almacenar códigos en memoria (en producción debería ser en base de datos o Redis)
const verificationCodes = new Map<string, VerificationCode>()

// Generar código de verificación de 6 dígitos
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Crear código de verificación
export function createVerificationCode(matricula: string): { code: string; email: string } {
  // Limpiar códigos expirados
  cleanupExpiredCodes()
  
  // Generar código
  const code = generateVerificationCode()
  const email = `e0${matricula}@cetys.edu.mx`
  
  // Guardar código (expira en 10 minutos)
  const expiresAt = Date.now() + 10 * 60 * 1000 // 10 minutos
  verificationCodes.set(matricula, {
    code,
    matricula,
    email,
    expiresAt,
    attempts: 0
  })
  
  return { code, email }
}

// Validar código de verificación
export function validateVerificationCode(
  matricula: string,
  code: string
): { valid: boolean; message?: string } {
  // Limpiar códigos expirados
  cleanupExpiredCodes()
  
  const verification = verificationCodes.get(matricula)
  
  if (!verification) {
    return { valid: false, message: 'No se encontró un código de verificación. Por favor, solicita uno nuevo.' }
  }
  
  // Verificar si expiró
  if (Date.now() > verification.expiresAt) {
    verificationCodes.delete(matricula)
    return { valid: false, message: 'El código de verificación ha expirado. Por favor, solicita uno nuevo.' }
  }
  
  // Verificar intentos (máximo 5 intentos)
  if (verification.attempts >= 5) {
    verificationCodes.delete(matricula)
    return { valid: false, message: 'Demasiados intentos fallidos. Por favor, solicita un nuevo código.' }
  }
  
  // Verificar código
  if (verification.code !== code) {
    verification.attempts++
    return { valid: false, message: 'Código de verificación incorrecto. Intenta de nuevo.' }
  }
  
  // Código válido - eliminar de la memoria
  verificationCodes.delete(matricula)
  return { valid: true }
}

// Obtener código de verificación (para envío de correo)
export function getVerificationCode(matricula: string): VerificationCode | null {
  cleanupExpiredCodes()
  return verificationCodes.get(matricula) || null
}

// Limpiar códigos expirados
function cleanupExpiredCodes(): void {
  const now = Date.now()
  for (const [matricula, verification] of verificationCodes.entries()) {
    if (now > verification.expiresAt) {
      verificationCodes.delete(matricula)
    }
  }
}

// Limpiar código después de uso exitoso
export function clearVerificationCode(matricula: string): void {
  verificationCodes.delete(matricula)
}

