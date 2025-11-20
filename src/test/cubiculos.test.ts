import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  createReservation,
  getAllReservations,
  checkReservationConflicts,
  checkMatriculaConflicts,
  updateReservationStatuses,
  getRooms,
  getAllRooms,
  createRoom,
  updateRoom,
  deleteRoom,
  toggleRoomActive,
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  hasActiveReservation,
  type Reservation,
  type Room,
} from '@/lib/cubiculos'

describe('Gestión de Reservas', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('createReservation', () => {
    it('debe crear una reserva correctamente', () => {
      const inicio = new Date()
      inicio.setHours(10, 0, 0, 0)
      const fin = new Date()
      fin.setHours(11, 0, 0, 0)

      const reservation = createReservation(
        'cubicle-1',
        '2024001234',
        'Juan Pérez',
        1,
        inicio.toISOString(),
        fin.toISOString()
      )

      expect(reservation).toBeDefined()
      expect(reservation.room_id).toBe('cubicle-1')
      expect(reservation.matricula).toBe('2024001234')
      expect(reservation.nombreCompleto).toBe('Juan Pérez')
      expect(reservation.status).toBeDefined()
    })

    it('debe asignar un ID único a cada reserva', async () => {
      const inicio = new Date()
      inicio.setHours(10, 0, 0, 0)
      const fin = new Date()
      fin.setHours(11, 0, 0, 0)

      const res1 = createReservation(
        'cubicle-1',
        '2024001234',
        'Juan Pérez',
        1,
        inicio.toISOString(),
        fin.toISOString()
      )

      // Esperar lo suficiente para que Date.now() cambie (IDs basados en timestamp)
      await new Promise(resolve => setTimeout(resolve, 5))

      const res2 = createReservation(
        'cubicle-2',
        '2024001235',
        'María García',
        1,
        inicio.toISOString(),
        fin.toISOString()
      )

      expect(res1.id).not.toBe(res2.id)
    })
  })

  describe('getAllReservations', () => {
    it('debe retornar todas las reservas de un cubículo', () => {
      const inicio = new Date()
      inicio.setHours(10, 0, 0, 0)
      const fin = new Date()
      fin.setHours(11, 0, 0, 0)

      createReservation(
        'cubicle-1',
        '2024001234',
        'Juan Pérez',
        1,
        inicio.toISOString(),
        fin.toISOString()
      )

      createReservation(
        'cubicle-1',
        '2024001235',
        'María García',
        1,
        inicio.toISOString(),
        fin.toISOString()
      )

      const reservations = getAllReservations().filter(r => r.room_id === 'cubicle-1')
      expect(reservations.length).toBe(2)
      expect(reservations.every(r => r.room_id === 'cubicle-1')).toBe(true)
    })

    it('debe retornar un array vacío si no hay reservas', () => {
      const reservations = getAllReservations()
      expect(reservations).toEqual([])
    })
  })

  describe('checkReservationConflicts', () => {
    it('debe detectar conflictos de horario', () => {
      const inicio1 = new Date()
      inicio1.setHours(10, 0, 0, 0)
      const fin1 = new Date()
      fin1.setHours(11, 0, 0, 0)

      createReservation(
        'cubicle-1',
        '2024001234',
        'Juan Pérez',
        1,
        inicio1.toISOString(),
        fin1.toISOString()
      )

      // Intentar crear una reserva que se solapa
      const inicio2 = new Date()
      inicio2.setHours(10, 30, 0, 0)
      const fin2 = new Date()
      fin2.setHours(11, 30, 0, 0)

      const conflicts = checkReservationConflicts(
        'cubicle-1',
        inicio2.toISOString(),
        fin2.toISOString()
      )

      expect(conflicts.length).toBeGreaterThan(0)
    })

    it('no debe detectar conflictos si los horarios no se solapan', () => {
      const inicio1 = new Date()
      inicio1.setHours(10, 0, 0, 0)
      const fin1 = new Date()
      fin1.setHours(11, 0, 0, 0)

      createReservation(
        'cubicle-1',
        '2024001234',
        'Juan Pérez',
        1,
        inicio1.toISOString(),
        fin1.toISOString()
      )

      // Reserva que no se solapa
      const inicio2 = new Date()
      inicio2.setHours(12, 0, 0, 0)
      const fin2 = new Date()
      fin2.setHours(13, 0, 0, 0)

      const conflicts = checkReservationConflicts(
        'cubicle-1',
        inicio2.toISOString(),
        fin2.toISOString()
      )

      expect(conflicts.length).toBe(0)
    })
  })

  describe('checkMatriculaConflicts', () => {
    it('debe detectar si una matrícula ya tiene una reserva en el mismo horario', () => {
      // Reserva en curso (activa): solo status 'active' cuenta para conflictos de matrícula
      const inicio = new Date(Date.now() - 30 * 60 * 1000)
      const fin = new Date(Date.now() + 30 * 60 * 1000)

      createReservation(
        'cubicle-1',
        '2024001234',
        'Juan Pérez',
        1,
        inicio.toISOString(),
        fin.toISOString()
      )

      const inicio2 = new Date(Date.now() - 15 * 60 * 1000)
      const fin2 = new Date(Date.now() + 45 * 60 * 1000)

      const conflicts = checkMatriculaConflicts(
        '2024001234',
        inicio2.toISOString(),
        fin2.toISOString()
      )

      expect(conflicts.length).toBeGreaterThan(0)
    })

    it('no debe detectar conflictos si la matrícula es diferente', () => {
      const inicio = new Date()
      inicio.setHours(10, 0, 0, 0)
      const fin = new Date()
      fin.setHours(11, 0, 0, 0)

      createReservation(
        'cubicle-1',
        '2024001234',
        'Juan Pérez',
        1,
        inicio.toISOString(),
        fin.toISOString()
      )

      const conflicts = checkMatriculaConflicts(
        '2024001235', // Diferente matrícula
        inicio.toISOString(),
        fin.toISOString()
      )

      expect(conflicts.length).toBe(0)
    })
  })

  describe('hasActiveReservation', () => {
    it('debe retornar true si la matrícula tiene una reserva activa', () => {
      const inicio = new Date()
      inicio.setHours(10, 0, 0, 0)
      const fin = new Date()
      fin.setHours(11, 0, 0, 0)

      createReservation(
        'cubicle-1',
        '2024001234',
        'Juan Pérez',
        1,
        inicio.toISOString(),
        fin.toISOString()
      )

      updateReservationStatuses()
      const hasActive = hasActiveReservation('2024001234')
      expect(hasActive).toBe(true)
    })

    it('debe retornar false si la matrícula no tiene reservas activas', () => {
      const hasActive = hasActiveReservation('2024001234')
      expect(hasActive).toBe(false)
    })
  })

  describe('updateReservationStatuses', () => {
    it('debe marcar reservas pasadas como completadas', () => {
      const inicio = new Date(Date.now() - 3 * 60 * 60 * 1000)
      const fin = new Date(Date.now() - 1 * 60 * 60 * 1000)

      createReservation(
        'cubicle-1',
        '2024001234',
        'Juan Pérez',
        1,
        inicio.toISOString(),
        fin.toISOString()
      )

      updateReservationStatuses()
      const reservations = getAllReservations().filter(r => r.room_id === 'cubicle-1')
      expect(reservations[0].status).toBe('completed')
    })

    it('debe marcar reservas futuras correctamente', () => {
      const inicio = new Date()
      inicio.setHours(15, 0, 0, 0) // En 2 horas
      inicio.setTime(inicio.getTime() + 2 * 60 * 60 * 1000)
      const fin = new Date()
      fin.setHours(16, 0, 0, 0) // En 3 horas
      fin.setTime(fin.getTime() + 3 * 60 * 60 * 1000)

      createReservation(
        'cubicle-1',
        '2024001234',
        'Juan Pérez',
        1,
        inicio.toISOString(),
        fin.toISOString()
      )

      updateReservationStatuses()
      const reservations = getAllReservations().filter(r => r.room_id === 'cubicle-1')
      // Las reservas futuras no deben estar como 'active'
      expect(reservations[0].status).not.toBe('active')
    })
  })
})

describe('Gestión de Cubículos', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('getRooms', () => {
    it('debe retornar solo cubículos activos', () => {
      const rooms = getRooms()
      expect(rooms.length).toBeGreaterThan(0)
      expect(rooms.every(r => r.activo === true)).toBe(true)
    })
  })

  describe('createRoom', () => {
    it('debe crear un nuevo cubículo', () => {
      const room = createRoom(
        'Cubículo Test',
        'Descripción de prueba',
        2
      )

      expect(room).toBeDefined()
      expect(room.nombre).toBe('Cubículo Test')
      expect(room.capacidad).toBe(2)
      expect(room.activo).toBe(true)
    })
  })

  describe('updateRoom', () => {
    it('debe actualizar un cubículo existente', () => {
      const room = createRoom(
        'Cubículo Test',
        '',
        2
      )

      const updated = updateRoom(room.id, {
        nombre: 'Cubículo Actualizado',
        capacidad: 4,
      })

      expect(updated?.nombre).toBe('Cubículo Actualizado')
      expect(updated?.capacidad).toBe(4)
    })
  })

  describe('deleteRoom', () => {
    it('debe eliminar un cubículo', () => {
      const room = createRoom(
        'Cubículo Test',
        '',
        2
      )

      deleteRoom(room.id)
      const rooms = getRooms()
      expect(rooms.find(r => r.id === room.id)).toBeUndefined()
    })
  })

  describe('toggleRoomActive', () => {
    it('debe desactivar un cubículo activo', () => {
      const room = createRoom(
        'Cubículo Test',
        '',
        2
      )

      toggleRoomActive(room.id)
      expect(getRooms().find(r => r.id === room.id)).toBeUndefined()
      expect(getAllRooms().find(r => r.id === room.id)?.activo).toBe(false)
    })
  })
})

describe('Gestión de Anuncios', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('createAnnouncement', () => {
    it('debe crear un anuncio', () => {
      const announcement = createAnnouncement('Mensaje de prueba')

      expect(announcement).toBeDefined()
      expect(announcement.mensaje).toBe('Mensaje de prueba')
      expect(announcement.activo).toBe(true)
    })
  })

  describe('getAnnouncements', () => {
    it('debe retornar solo anuncios activos', () => {
      createAnnouncement({ mensaje: 'Anuncio 1' })
      createAnnouncement({ mensaje: 'Anuncio 2' })

      const announcements = getAnnouncements()
      expect(announcements.length).toBe(2)
      expect(announcements.every(a => a.activo === true)).toBe(true)
    })
  })

  describe('updateAnnouncement', () => {
    it('debe actualizar un anuncio', () => {
      const announcement = createAnnouncement('Mensaje original')
      const updated = updateAnnouncement(announcement.id, {
        mensaje: 'Mensaje actualizado',
      })

      expect(updated?.mensaje).toBe('Mensaje actualizado')
    })
  })

  describe('deleteAnnouncement', () => {
    it('debe eliminar un anuncio', () => {
      const announcement = createAnnouncement('Mensaje de prueba')
      deleteAnnouncement(announcement.id)

      const announcements = getAnnouncements()
      expect(announcements.find(a => a.id === announcement.id)).toBeUndefined()
    })
  })
})

