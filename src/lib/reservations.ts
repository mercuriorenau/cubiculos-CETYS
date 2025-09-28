import { supabase } from './supabase'
import { RESERVATION_RULES } from './schemas'
import { mockRooms, mockReservations } from './mock-data'

export interface Reservation {
  id: string
  user_id: string
  room_id: string
  inicio: string
  fin: string
  status: 'active' | 'cancelled' | 'completed'
  created_at: string
  updated_at: string
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

export async function getRooms(): Promise<Room[]> {
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('activo', true)
    .order('nombre')

  if (error) {
    throw new Error(error.message)
  }

  return data || []
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
  let query = supabase
    .from('reservations')
    .select(`
      *,
      room:rooms(*)
    `)
    .eq('status', 'active')

  if (roomId) {
    query = query.eq('room_id', roomId)
  }

  if (startDate) {
    query = query.gte('inicio', startDate.toISOString())
  }

  if (endDate) {
    query = query.lte('fin', endDate.toISOString())
  }

  const { data, error } = await query.order('inicio')

  if (error) {
    throw new Error(error.message)
  }

  return data || []
}

export async function getUserReservations(): Promise<Reservation[]> {
  const { data, error } = await supabase
    .from('reservations')
    .select(`
      *,
      room:rooms(*)
    `)
    .order('inicio', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return data || []
}

export async function createReservation(
  roomId: string,
  inicio: string,
  fin: string
): Promise<Reservation> {
  // Validate reservation rules
  const validation = validateReservationRules(inicio, fin)
  if (!validation.valid) {
    throw new Error(validation.message!)
  }

  // Check for conflicts
  const conflicts = await checkReservationConflicts(roomId, inicio, fin)
  if (conflicts.length > 0) {
    throw new Error('Ya existe una reserva en ese horario')
  }

  // Check blackouts
  const startDate = new Date(inicio)
  const endDate = new Date(fin)
  const blackouts = await getBlackouts(startDate, endDate)
  if (blackouts.length > 0) {
    throw new Error('No se pueden hacer reservas durante cierres de biblioteca')
  }

  const { data, error } = await supabase
    .from('reservations')
    .insert({
      room_id: roomId,
      inicio,
      fin,
      status: 'active'
    })
    .select(`
      *,
      room:rooms(*)
    `)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function cancelReservation(reservationId: string): Promise<void> {
  const { error } = await supabase
    .from('reservations')
    .update({ 
      status: 'cancelled',
      updated_at: new Date().toISOString()
    })
    .eq('id', reservationId)

  if (error) {
    throw new Error(error.message)
  }
}

export async function checkReservationConflicts(
  roomId: string,
  inicio: string,
  fin: string
): Promise<Reservation[]> {
  const { data, error } = await supabase
    .from('reservations')
    .select('*')
    .eq('room_id', roomId)
    .eq('status', 'active')
    .or(`and(inicio.lt.${fin},fin.gt.${inicio})`)

  if (error) {
    throw new Error(error.message)
  }

  return data || []
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
