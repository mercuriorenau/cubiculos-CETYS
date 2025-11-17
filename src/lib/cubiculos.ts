// Sistema de reservas completamente simplificado
export interface Reservation {
  id: string
  room_id: string
  matricula: string
  nombreCompleto: string
  cantidadPersonas: number
  inicio: string
  fin: string
  status: 'active' | 'cancelled'
  created_at: string
}

export interface Room {
  id: string
  nombre: string
  descripcion?: string
  capacidad: number
  activo: boolean
}

// Cubículos hardcodeados - ESTOS SON LOS QUE DEBE VER LA APLICACIÓN
export const CUBICULOS: Room[] = [
  { id: 'cubicle-1', nombre: 'Cubículo 1', descripcion: 'Cubículo individual con escritorio y silla', capacidad: 1, activo: true },
  { id: 'cubicle-2', nombre: 'Cubículo 2', descripcion: 'Cubículo individual con escritorio y silla', capacidad: 1, activo: true },
  { id: 'cubicle-3', nombre: 'Cubículo 3', descripcion: 'Cubículo individual con escritorio y silla', capacidad: 1, activo: true },
  { id: 'cubicle-4', nombre: 'Cubículo 4', descripcion: 'Cubículo individual con escritorio y silla', capacidad: 1, activo: true },
  { id: 'cubicle-5', nombre: 'Cubículo 5', descripcion: 'Cubículo individual con escritorio y silla', capacidad: 1, activo: true },
  { id: 'cubicle-6', nombre: 'Cubículo 6', descripcion: 'Cubículo individual con escritorio y silla', capacidad: 1, activo: true },
  { id: 'cubicle-7', nombre: 'Cubículo 7', descripcion: 'Cubículo individual con escritorio y silla', capacidad: 1, activo: true },
  { id: 'cubicle-8', nombre: 'Cubículo 8', descripcion: 'Cubículo individual con escritorio y silla', capacidad: 1, activo: true },
  { id: 'sala-a', nombre: 'Sala de Estudio A', descripcion: 'Sala para 4 personas con mesa grande', capacidad: 4, activo: true },
  { id: 'sala-b', nombre: 'Sala de Estudio B', descripcion: 'Sala para 6 personas con mesa grande', capacidad: 6, activo: true }
]

// Funciones para manejar reservas en localStorage
function getReservationsFromStorage(): Reservation[] {
  if (typeof window === 'undefined') return []
  
  try {
    const stored = localStorage.getItem('cubiculos-reservations')
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('Error leyendo reservas del localStorage:', error)
    return []
  }
}

function saveReservationToStorage(reservation: Reservation): void {
  if (typeof window === 'undefined') return
  
  try {
    const reservations = getReservationsFromStorage()
    reservations.push(reservation)
    localStorage.setItem('cubiculos-reservations', JSON.stringify(reservations))
  } catch (error) {
    console.error('Error guardando reserva en localStorage:', error)
  }
}

function updateReservationInStorage(reservationId: string, updates: Partial<Reservation>): void {
  if (typeof window === 'undefined') return
  
  try {
    const reservations = getReservationsFromStorage()
    const index = reservations.findIndex(r => r.id === reservationId)
    if (index !== -1) {
      reservations[index] = { ...reservations[index], ...updates }
      localStorage.setItem('cubiculos-reservations', JSON.stringify(reservations))
    }
  } catch (error) {
    console.error('Error actualizando reserva en localStorage:', error)
  }
}

// FUNCIONES PRINCIPALES EXPORTADAS
export function getRooms(): Room[] {
  return CUBICULOS
}

export function getRoomById(roomId: string): Room | null {
  return CUBICULOS.find(room => room.id === roomId) || null
}

export function getReservations(): Reservation[] {
  return getReservationsFromStorage().filter(r => r.status === 'active')
}

export function getAllReservations(): Reservation[] {
  return getReservationsFromStorage()
}

export function getUserReservations(): Reservation[] {
  return getReservationsFromStorage().filter(r => r.status === 'active')
}

export function createReservation(
  roomId: string,
  matricula: string,
  nombreCompleto: string,
  cantidadPersonas: number,
  inicio: string,
  fin: string
): Reservation {
  const reservation: Reservation = {
    id: Date.now().toString(),
    room_id: roomId,
    matricula,
    nombreCompleto,
    cantidadPersonas,
    inicio,
    fin,
    status: 'active',
    created_at: new Date().toISOString()
  }
  
  saveReservationToStorage(reservation)
  return reservation
}

export function cancelReservation(reservationId: string): void {
  updateReservationInStorage(reservationId, { status: 'cancelled' })
}

export function updateReservation(
  reservationId: string,
  updates: Partial<Omit<Reservation, 'id' | 'created_at'>>
): Reservation | null {
  if (typeof window === 'undefined') return null
  
  try {
    const reservations = getReservationsFromStorage()
    const index = reservations.findIndex(r => r.id === reservationId)
    
    if (index === -1) {
      return null
    }
    
    const updatedReservation = { ...reservations[index], ...updates }
    reservations[index] = updatedReservation
    localStorage.setItem('cubiculos-reservations', JSON.stringify(reservations))
    
    return updatedReservation
  } catch (error) {
    console.error('Error actualizando reserva:', error)
    return null
  }
}

export function checkReservationConflicts(
  roomId: string,
  inicio: string,
  fin: string
): Reservation[] {
  const reservations = getReservations()
  const startTime = new Date(inicio)
  const endTime = new Date(fin)
  
  return reservations.filter(reservation => {
    if (reservation.room_id !== roomId) return false
    
    const resStart = new Date(reservation.inicio)
    const resEnd = new Date(reservation.fin)
    
    // Verificar si hay solapamiento
    return (startTime < resEnd && endTime > resStart)
  })
}

export function getRoomAvailability(roomId: string): boolean {
  const now = new Date()
  const activeReservations = getReservations().filter(r => 
    r.room_id === roomId && 
    new Date(r.inicio) <= now &&
    new Date(r.fin) >= now
  )
  return activeReservations.length === 0
}

// Función para limpiar reservas expiradas (opcional)
export function cleanExpiredReservations(): void {
  if (typeof window === 'undefined') return
  
  try {
    const reservations = getReservationsFromStorage()
    const now = new Date()
    
    const activeReservations = reservations.filter(r => {
      if (r.status === 'cancelled') return false
      const endTime = new Date(r.fin)
      return endTime > now
    })
    
    localStorage.setItem('cubiculos-reservations', JSON.stringify(activeReservations))
  } catch (error) {
    console.error('Error limpiando reservas expiradas:', error)
  }
}

