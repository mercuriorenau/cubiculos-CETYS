import { describe, it, expect, beforeEach } from 'vitest'
import {
  validateReservationRules,
  checkMatriculaConflicts,
} from '@/lib/reservations'

describe('Validaciones de Reservas', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('validateReservationRules', () => {
    it('debe validar una reserva dentro del horario de la biblioteca', () => {
      const inicio = new Date()
      inicio.setDate(inicio.getDate() + 1)
      inicio.setHours(10, 0, 0, 0)
      const fin = new Date(inicio)
      fin.setHours(11, 0, 0, 0)

      const result = validateReservationRules(
        inicio.toISOString(),
        fin.toISOString()
      )

      expect(result.valid).toBe(true)
    })

    it('debe rechazar una reserva fuera del horario de la biblioteca (antes de las 8 AM)', () => {
      const inicio = new Date()
      inicio.setDate(inicio.getDate() + 1)
      inicio.setHours(7, 0, 0, 0)
      const fin = new Date(inicio)
      fin.setHours(8, 0, 0, 0)

      const result = validateReservationRules(
        inicio.toISOString(),
        fin.toISOString()
      )

      expect(result.valid).toBe(false)
      expect(result.message).toContain('horario')
    })

    it('debe rechazar una reserva fuera del horario de la biblioteca (después de las 10 PM)', () => {
      const inicio = new Date()
      inicio.setDate(inicio.getDate() + 1)
      inicio.setHours(22, 0, 0, 0)
      const fin = new Date(inicio)
      fin.setHours(23, 0, 0, 0)

      const result = validateReservationRules(
        inicio.toISOString(),
        fin.toISOString()
      )

      expect(result.valid).toBe(false)
      expect(result.message).toContain('horario')
    })

    it('debe rechazar una reserva que exceda 2 horas', () => {
      const inicio = new Date()
      inicio.setDate(inicio.getDate() + 1)
      inicio.setHours(10, 0, 0, 0)
      const fin = new Date(inicio)
      fin.setHours(13, 0, 0, 0) // 3 horas

      const result = validateReservationRules(
        inicio.toISOString(),
        fin.toISOString()
      )

      expect(result.valid).toBe(false)
      expect(result.message).toContain('2 horas')
    })

    it('debe permitir una reserva de exactamente 2 horas', () => {
      const inicio = new Date()
      inicio.setDate(inicio.getDate() + 1)
      inicio.setHours(10, 0, 0, 0)
      const fin = new Date(inicio)
      fin.setHours(12, 0, 0, 0) // 2 horas exactas

      const result = validateReservationRules(
        inicio.toISOString(),
        fin.toISOString()
      )

      expect(result.valid).toBe(true)
    })

    it('debe permitir reservar el bloque horario actual', () => {
      const ahora = new Date()
      const inicio = new Date(ahora)
      inicio.setMinutes(0, 0, 0) // Inicio de la hora actual
      const fin = new Date(inicio)
      fin.setHours(fin.getHours() + 1) // Una hora después

      const result = validateReservationRules(
        inicio.toISOString(),
        fin.toISOString()
      )

      // Solo aplicable dentro del horario de biblioteca (08:00 - 22:00)
      if (inicio.getHours() >= 8 && fin.getHours() <= 22) {
        expect(result.valid).toBe(true)
      } else {
        expect(result.valid).toBe(false)
      }
    })
  })

  describe('checkMatriculaConflicts', () => {
    it('debe detectar conflictos de horario para la misma matrícula', async () => {
      const { createReservation } = await import('@/lib/cubiculos')

      const inicio1 = new Date(Date.now() - 30 * 60 * 1000)
      const fin1 = new Date(Date.now() + 30 * 60 * 1000)

      createReservation(
        'cubicle-1',
        '2024001234',
        'Juan Pérez',
        1,
        inicio1.toISOString(),
        fin1.toISOString()
      )

      const inicio2 = new Date(Date.now() - 15 * 60 * 1000)
      const fin2 = new Date(Date.now() + 45 * 60 * 1000)

      const conflicts = await checkMatriculaConflicts(
        '2024001234',
        inicio2.toISOString(),
        fin2.toISOString()
      )

      expect(conflicts.length).toBeGreaterThan(0)
    })

    it('no debe detectar conflictos si los horarios no se solapan', async () => {
      const { createReservation } = await import('@/lib/cubiculos')

      const inicio1 = new Date(Date.now() - 30 * 60 * 1000)
      const fin1 = new Date(Date.now() + 30 * 60 * 1000)

      createReservation(
        'cubicle-1',
        '2024001234',
        'Juan Pérez',
        1,
        inicio1.toISOString(),
        fin1.toISOString()
      )

      const inicio2 = new Date(Date.now() + 2 * 60 * 60 * 1000)
      const fin2 = new Date(Date.now() + 3 * 60 * 60 * 1000)

      const conflicts = await checkMatriculaConflicts(
        '2024001234',
        inicio2.toISOString(),
        fin2.toISOString()
      )

      expect(conflicts.length).toBe(0)
    })
  })
})

