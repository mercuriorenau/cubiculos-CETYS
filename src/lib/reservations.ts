import { supabase } from './supabase'
import { RESERVATION_RULES } from './schemas'
import { mockRooms, mockReservations } from './mock-data'
import { 
  getRooms as getCubiculos, 
  getReservations as getCubiculosReservations,
  getAllReservations as getAllCubiculosReservations,
  getUserReservations as getCubiculosUserReservations,
  createReservation as createCubiculosReservation,
  cancelReservation as cancelCubiculosReservation,
  updateReservation as updateCubiculosReservation,
  checkReservationConflicts as checkCubiculosConflicts,
  getRoomById as getCubiculosRoomById,
  type Reservation as CubiculosReservation,
  type Room as CubiculosRoom
} from './cubiculos'

export interface Reservation {
  id: string
  user_id: string
  room_id: string
  inicio: string
  fin: string
  status: 'active' | 'cancelled' | 'completed'
  created_at: string
  updated_at: string
  matricula?: string
  nombreCompleto?: string
  cantidadPersonas?: number
  room?: {
    id: string
    nombre: string
    descripcion?: string
    capacidad: number
  }
}

export interface Room {
  id: string
  nombre: string
  descripcion?: string
  capacidad: number
  activo: boolean
}

export interface Blackout {
  id: string
  titulo: string
  descripcion?: string
  inicio: string
  fin: string
  activo: boolean
}

export function getRooms(): Room[] {
  // Usar el sistema de cubículos hardcodeados
  const cubiculos = getCubiculos()
  
  // Convertir CubiculosRoom a Room para mantener compatibilidad
  return cubiculos.map(room => ({
    id: room.id,
    nombre: room.nombre,
    descripcion: room.descripcion,
    capacidad: room.capacidad,
    activo: room.activo
  }))
}

export function getRoomById(roomId: string): Room | null {
  const cubiculo = getCubiculosRoomById(roomId)
  if (!cubiculo) return null
  
  return {
    id: cubiculo.id,
    nombre: cubiculo.nombre,
    descripcion: cubiculo.descripcion,
    capacidad: cubiculo.capacidad,
    activo: cubiculo.activo
  }
}

export async function getBlackouts(startDate: Date, endDate: Date): Promise<Blackout[]> {
  const { data, error } = await supabase
    .from('blackouts')
    .select('*')
    .eq('activo', true)
    .gte('inicio', startDate.toISOString())
    .lte('fin', endDate.toISOString())

  if (error) {
    throw new Error(error.message)
  }

  return data || []
}

export async function getReservations(
  roomId?: string,
  startDate?: Date,
  endDate?: Date
): Promise<Reservation[]> {
  // Usar el sistema de cubículos con localStorage
  const cubiculosReservations = getCubiculosReservations()
  
  let filteredReservations = cubiculosReservations.filter(r => r.status === 'active')
  
  // Filtrar por roomId si se proporciona
  if (roomId) {
    filteredReservations = filteredReservations.filter(r => r.room_id === roomId)
  }
  
  // Filtrar por fechas si se proporcionan
  if (startDate) {
    filteredReservations = filteredReservations.filter(r => new Date(r.inicio) >= startDate)
  }
  
  if (endDate) {
    filteredReservations = filteredReservations.filter(r => new Date(r.fin) <= endDate)
  }
  
  // Convertir CubiculosReservation a Reservation para mantener compatibilidad
  return filteredReservations.map(reservation => ({
    id: reservation.id,
    user_id: '',
    room_id: reservation.room_id,
    inicio: reservation.inicio,
    fin: reservation.fin,
    status: reservation.status as 'active' | 'cancelled' | 'completed',
    created_at: reservation.created_at,
    updated_at: reservation.created_at,
    matricula: reservation.matricula,
    nombreCompleto: reservation.nombreCompleto,
    cantidadPersonas: reservation.cantidadPersonas,
    room: {
      id: reservation.room_id,
      nombre: getCubiculos().find(r => r.id === reservation.room_id)?.nombre || 'Cubículo',
      capacidad: getCubiculos().find(r => r.id === reservation.room_id)?.capacidad || 1
    }
  }))
}

export async function getUserReservations(): Promise<Reservation[]> {
  // Usar el sistema de cubículos con localStorage
  const cubiculosReservations = getCubiculosUserReservations()
  
  // Convertir CubiculosReservation a Reservation para mantener compatibilidad
  return cubiculosReservations.map(reservation => ({
    id: reservation.id,
    user_id: '', // No necesario en el sistema simplificado
    room_id: reservation.room_id,
    inicio: reservation.inicio,
    fin: reservation.fin,
    status: reservation.status as 'active' | 'cancelled' | 'completed',
    created_at: reservation.created_at,
    updated_at: reservation.created_at,
    matricula: reservation.matricula,
    nombreCompleto: reservation.nombreCompleto,
    cantidadPersonas: reservation.cantidadPersonas,
    room: {
      id: reservation.room_id,
      nombre: getCubiculos().find(r => r.id === reservation.room_id)?.nombre || 'Cubículo',
      capacidad: getCubiculos().find(r => r.id === reservation.room_id)?.capacidad || 1
    }
  }))
}

export async function createReservation(
  roomId: string,
  matricula: string,
  nombreCompleto: string,
  cantidadPersonas: number,
  inicio: string,
  fin: string
): Promise<Reservation> {
  // Validate reservation rules
  const validation = validateReservationRules(inicio, fin)
  if (!validation.valid) {
    throw new Error(validation.message!)
  }

  // Check for conflicts
  const conflicts = checkCubiculosConflicts(roomId, inicio, fin)
  if (conflicts.length > 0) {
    throw new Error('Ya existe una reserva en ese horario')
  }

  // Crear reserva usando el sistema de cubículos
  const cubiculosReservation = createCubiculosReservation(
    roomId,
    matricula,
    nombreCompleto,
    cantidadPersonas,
    inicio,
    fin
  )

  // Convertir a formato Reservation para mantener compatibilidad
  const room = getCubiculos().find(r => r.id === roomId)
  return {
    id: cubiculosReservation.id,
    user_id: '',
    room_id: cubiculosReservation.room_id,
    inicio: cubiculosReservation.inicio,
    fin: cubiculosReservation.fin,
    status: cubiculosReservation.status as 'active' | 'cancelled' | 'completed',
    created_at: cubiculosReservation.created_at,
    updated_at: cubiculosReservation.created_at,
    matricula: cubiculosReservation.matricula,
    nombreCompleto: cubiculosReservation.nombreCompleto,
    cantidadPersonas: cubiculosReservation.cantidadPersonas,
    room: {
      id: room?.id || roomId,
      nombre: room?.nombre || 'Cubículo',
      capacidad: room?.capacidad || 1
    }
  }
}

export async function cancelReservation(reservationId: string): Promise<void> {
  // Usar el sistema de cubículos
  cancelCubiculosReservation(reservationId)
}

export async function updateReservation(
  reservationId: string,
  updates: Partial<{
    room_id: string
    matricula: string
    nombreCompleto: string
    cantidadPersonas: number
    inicio: string
    fin: string
    status: 'active' | 'cancelled' | 'completed'
  }>
): Promise<Reservation | null> {
  // Usar el sistema de cubículos
  const updated = updateCubiculosReservation(reservationId, updates)
  
  if (!updated) return null
  
  // Convertir a formato Reservation para mantener compatibilidad
  const room = getCubiculos().find(r => r.id === updated.room_id)
  return {
    id: updated.id,
    user_id: '',
    room_id: updated.room_id,
    inicio: updated.inicio,
    fin: updated.fin,
    status: updated.status as 'active' | 'cancelled' | 'completed',
    created_at: updated.created_at,
    updated_at: updated.created_at,
    matricula: updated.matricula,
    nombreCompleto: updated.nombreCompleto,
    cantidadPersonas: updated.cantidadPersonas,
    room: {
      id: room?.id || updated.room_id,
      nombre: room?.nombre || 'Cubículo',
      capacidad: room?.capacidad || 1
    }
  }
}

export async function checkReservationConflicts(
  roomId: string,
  inicio: string,
  fin: string
): Promise<Reservation[]> {
  // Usar el sistema de cubículos
  const cubiculosConflicts = checkCubiculosConflicts(roomId, inicio, fin)
  
  // Convertir a formato Reservation para mantener compatibilidad
  return cubiculosConflicts.map(reservation => ({
    id: reservation.id,
    user_id: '',
    room_id: reservation.room_id,
    inicio: reservation.inicio,
    fin: reservation.fin,
    status: reservation.status as 'active' | 'cancelled' | 'completed',
    created_at: reservation.created_at,
    updated_at: reservation.created_at,
    matricula: reservation.matricula,
    nombreCompleto: reservation.nombreCompleto,
    cantidadPersonas: reservation.cantidadPersonas,
    room: {
      id: reservation.room_id,
      nombre: getCubiculos().find(r => r.id === reservation.room_id)?.nombre || 'Cubículo',
      capacidad: getCubiculos().find(r => r.id === reservation.room_id)?.capacidad || 1
    }
  }))
}

export function validateReservationRules(inicio: string, fin: string): { valid: boolean; message?: string } {
  const start = new Date(inicio)
  const end = new Date(fin)
  const now = new Date()

  // Check if start time is in the future
  if (start <= now) {
    return { valid: false, message: 'La reserva debe ser para el futuro' }
  }

  // Check duration
  const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60)
  if (durationMinutes < RESERVATION_RULES.MIN_DURATION_MINUTES) {
    return { valid: false, message: `La duración mínima es ${RESERVATION_RULES.MIN_DURATION_MINUTES} minutos` }
  }

  if (durationMinutes > RESERVATION_RULES.MAX_DURATION_MINUTES) {
    return { valid: false, message: `La duración máxima es ${RESERVATION_RULES.MAX_DURATION_MINUTES} minutos` }
  }

  // Check advance booking
  const daysInAdvance = (start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  if (daysInAdvance > RESERVATION_RULES.MAX_ADVANCE_DAYS) {
    return { valid: false, message: `Solo se pueden hacer reservas con ${RESERVATION_RULES.MAX_ADVANCE_DAYS} días de anticipación` }
  }

  // Check library hours
  const startHour = start.getHours()
  const endHour = end.getHours()
  const openHour = parseInt(RESERVATION_RULES.LIBRARY_HOURS.OPEN.split(':')[0])
  const closeHour = parseInt(RESERVATION_RULES.LIBRARY_HOURS.CLOSE.split(':')[0])

  if (startHour < openHour || endHour > closeHour) {
    return { valid: false, message: `Las reservas deben estar dentro del horario de biblioteca (${RESERVATION_RULES.LIBRARY_HOURS.OPEN} - ${RESERVATION_RULES.LIBRARY_HOURS.CLOSE})` }
  }

  return { valid: true }
}

export async function checkDailyReservationLimit(date: string): Promise<boolean> {
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)

  const { data, error } = await supabase
    .from('reservations')
    .select('id')
    .eq('status', 'active')
    .gte('inicio', startOfDay.toISOString())
    .lte('inicio', endOfDay.toISOString())

  if (error) {
    throw new Error(error.message)
  }

  return (data?.length || 0) < RESERVATION_RULES.MAX_RESERVATIONS_PER_DAY
}

export async function checkWeeklyReservationLimit(startOfWeek: string): Promise<boolean> {
  const start = new Date(startOfWeek)
  const end = new Date(start)
  end.setDate(end.getDate() + 7)

  const { data, error } = await supabase
    .from('reservations')
    .select('id')
    .eq('status', 'active')
    .gte('inicio', start.toISOString())
    .lt('inicio', end.toISOString())

  if (error) {
    throw new Error(error.message)
  }

  return (data?.length || 0) < RESERVATION_RULES.MAX_RESERVATIONS_PER_WEEK
}
