import { describe, it, expect } from 'vitest'
import {
  CreateReservationSchema,
  CreateUserSchema,
  VerifyMatriculaSchema,
  RESERVATION_RULES,
} from '@/lib/schemas'

describe('Validaciones de Esquemas', () => {
  describe('CreateReservationSchema', () => {
    it('debe validar una reserva correcta', () => {
      const inicio = new Date()
      inicio.setHours(10, 0, 0, 0)
      const fin = new Date()
      fin.setHours(11, 0, 0, 0)

      const result = CreateReservationSchema.safeParse({
        room_id: '123e4567-e89b-12d3-a456-426614174000',
        inicio: inicio.toISOString(),
        fin: fin.toISOString(),
      })

      expect(result.success).toBe(true)
    })

    it('debe rechazar si la fecha fin es anterior a la fecha inicio', () => {
      const inicio = new Date()
      inicio.setHours(11, 0, 0, 0)
      const fin = new Date()
      fin.setHours(10, 0, 0, 0)

      const result = CreateReservationSchema.safeParse({
        room_id: '123e4567-e89b-12d3-a456-426614174000',
        inicio: inicio.toISOString(),
        fin: fin.toISOString(),
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('fin')
      }
    })

    it('debe rechazar si falta el room_id', () => {
      const inicio = new Date()
      inicio.setHours(10, 0, 0, 0)
      const fin = new Date()
      fin.setHours(11, 0, 0, 0)

      const result = CreateReservationSchema.safeParse({
        inicio: inicio.toISOString(),
        fin: fin.toISOString(),
      })

      expect(result.success).toBe(false)
    })
  })

  describe('CreateUserSchema', () => {
    it('debe validar un usuario correcto', () => {
      const result = CreateUserSchema.safeParse({
        email: 'test@example.com',
        matricula: '2024001234',
      })

      expect(result.success).toBe(true)
    })

    it('debe rechazar un email inválido', () => {
      const result = CreateUserSchema.safeParse({
        email: 'email-invalido',
        matricula: '2024001234',
      })

      expect(result.success).toBe(false)
    })

    it('debe rechazar una matrícula vacía', () => {
      const result = CreateUserSchema.safeParse({
        email: 'test@example.com',
        matricula: '',
      })

      expect(result.success).toBe(false)
    })
  })

  describe('VerifyMatriculaSchema', () => {
    it('debe validar una matrícula correcta', () => {
      const result = VerifyMatriculaSchema.safeParse({
        matricula: '2024001234',
      })

      expect(result.success).toBe(true)
    })

    it('debe rechazar una matrícula vacía', () => {
      const result = VerifyMatriculaSchema.safeParse({
        matricula: '',
      })

      expect(result.success).toBe(false)
    })

    it('debe rechazar una matrícula muy larga', () => {
      const result = VerifyMatriculaSchema.safeParse({
        matricula: 'a'.repeat(21), // Más de 20 caracteres
      })

      expect(result.success).toBe(false)
    })
  })

  describe('RESERVATION_RULES', () => {
    it('debe tener una duración máxima de 2 horas', () => {
      expect(RESERVATION_RULES.MAX_DURATION_MINUTES).toBe(120)
    })

    it('debe tener horarios de biblioteca definidos', () => {
      expect(RESERVATION_RULES.LIBRARY_HOURS.OPEN).toBe('08:00')
      expect(RESERVATION_RULES.LIBRARY_HOURS.CLOSE).toBe('22:00')
    })
  })
})

