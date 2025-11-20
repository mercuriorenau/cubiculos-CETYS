import { describe, it, expect, beforeEach } from 'vitest'
import {
  generateVerificationCode,
  createVerificationCode,
  validateVerificationCode,
  getVerificationCode,
  clearVerificationCode,
} from '@/lib/verification'

describe('Sistema de Verificación', () => {
  beforeEach(() => {
    clearVerificationCode('2024001234')
  })

  describe('generateVerificationCode', () => {
    it('debe generar un código de 6 dígitos', () => {
      const code = generateVerificationCode()
      expect(code).toMatch(/^\d{6}$/)
    })

    it('debe generar códigos diferentes en cada llamada', () => {
      const code1 = generateVerificationCode()
      const code2 = generateVerificationCode()
      expect(code1).not.toBe(code2)
    })
  })

  describe('createVerificationCode', () => {
    it('debe crear un código de verificación para una matrícula', () => {
      const { code, email } = createVerificationCode('2024001234')

      expect(code).toMatch(/^\d{6}$/)
      expect(email).toBe('e02024001234@cetys.edu.mx')
    })

    it('debe generar el email en el formato correcto', () => {
      const { email } = createVerificationCode('2024001234')
      expect(email).toBe('e02024001234@cetys.edu.mx')
    })

    it('debe almacenar el código para verificación posterior', () => {
      const { code } = createVerificationCode('2024001234')
      const stored = getVerificationCode('2024001234')

      expect(stored).toBeDefined()
      expect(stored?.code).toBe(code)
      expect(stored?.matricula).toBe('2024001234')
    })
  })

  describe('validateVerificationCode', () => {
    it('debe validar un código correcto', () => {
      const { code } = createVerificationCode('2024001234')
      const result = validateVerificationCode('2024001234', code)

      expect(result.valid).toBe(true)
      expect(result.message).toBeUndefined()
    })

    it('debe rechazar un código incorrecto', () => {
      createVerificationCode('2024001234')
      const result = validateVerificationCode('2024001234', '000000')

      expect(result.valid).toBe(false)
      expect(result.message).toContain('incorrecto')
    })

    it('debe rechazar si no existe un código para la matrícula', () => {
      const result = validateVerificationCode('2024001234', '123456')

      expect(result.valid).toBe(false)
      expect(result.message).toContain('No se encontró')
    })

    it('debe incrementar los intentos fallidos', () => {
      createVerificationCode('2024001234')

      validateVerificationCode('2024001234', '000000')
      const stored1 = getVerificationCode('2024001234')
      expect(stored1?.attempts).toBe(1)

      validateVerificationCode('2024001234', '000000')
      const stored2 = getVerificationCode('2024001234')
      expect(stored2?.attempts).toBe(2)
    })

    it('debe rechazar después de 5 intentos fallidos', () => {
      createVerificationCode('2024001234')

      for (let i = 0; i < 5; i++) {
        validateVerificationCode('2024001234', '000000')
      }

      const result = validateVerificationCode('2024001234', '000000')
      expect(result.valid).toBe(false)
      expect(result.message).toContain('Demasiados intentos')
      expect(getVerificationCode('2024001234')).toBeNull()
    })

    it('debe expirar después de 10 minutos', () => {
      const { code } = createVerificationCode('2024001234')

      const stored = getVerificationCode('2024001234')
      if (stored) {
        stored.expiresAt = Date.now() - 1000
      }

      // cleanupExpiredCodes elimina el código antes de validar
      const result = validateVerificationCode('2024001234', code)
      expect(result.valid).toBe(false)
      expect(result.message).toContain('No se encontró')
    })
  })

  describe('clearVerificationCode', () => {
    it('debe eliminar un código de verificación', () => {
      createVerificationCode('2024001234')
      clearVerificationCode('2024001234')

      const stored = getVerificationCode('2024001234')
      expect(stored).toBeNull()
    })
  })
})
