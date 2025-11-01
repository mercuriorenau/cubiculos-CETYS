// Sistema de reservas completamente simplificado
export interface Reservation {
  id: string
  room_id: string
  matricula: string
  nombreCompleto: string
  cantidadPersonas: number
  inicio: string
  fin: string
  status: 'active' | 'cancelled' | 'completed'
  created_at: string
}

export interface Room {
  id: string
  nombre: string
  descripcion?: string
  capacidad: number
  activo: boolean
}

// Cubículos por defecto - se usan para inicializar si no hay datos en localStorage
const DEFAULT_CUBICULOS: Room[] = [
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

// Funciones para manejar cubículos en localStorage
function getRoomsFromStorage(): Room[] {
  if (typeof window === 'undefined') return DEFAULT_CUBICULOS
  
  try {
    const stored = localStorage.getItem('cubiculos-rooms')
    if (stored) {
      return JSON.parse(stored)
    } else {
      // Inicializar con cubículos por defecto si no hay datos
      saveRoomsToStorage(DEFAULT_CUBICULOS)
      return DEFAULT_CUBICULOS
    }
  } catch (error) {
    console.error('Error leyendo cubículos del localStorage:', error)
    return DEFAULT_CUBICULOS
  }
}

function saveRoomsToStorage(rooms: Room[]): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem('cubiculos-rooms', JSON.stringify(rooms))
  } catch (error) {
    console.error('Error guardando cubículos en localStorage:', error)
  }
}

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
  return getRoomsFromStorage().filter(room => room.activo)
}

export function getAllRooms(): Room[] {
  return getRoomsFromStorage()
}

export function getRoomById(roomId: string): Room | null {
  const rooms = getRoomsFromStorage()
  return rooms.find(room => room.id === roomId) || null
}

export function createRoom(
  nombre: string,
  descripcion: string,
  capacidad: number
): Room {
  const room: Room = {
    id: `room-${Date.now()}`,
    nombre,
    descripcion: descripcion || undefined,
    capacidad,
    activo: true
  }
  
  const rooms = getRoomsFromStorage()
  rooms.push(room)
  saveRoomsToStorage(rooms)
  
  return room
}

export function updateRoom(
  roomId: string,
  updates: Partial<Pick<Room, 'nombre' | 'descripcion' | 'capacidad' | 'activo'>>
): Room | null {
  if (typeof window === 'undefined') return null
  
  try {
    const rooms = getRoomsFromStorage()
    const index = rooms.findIndex(r => r.id === roomId)
    
    if (index === -1) {
      return null
    }
    
    const updatedRoom = { ...rooms[index], ...updates }
    rooms[index] = updatedRoom
    saveRoomsToStorage(rooms)
    
    return updatedRoom
  } catch (error) {
    console.error('Error actualizando cubículo:', error)
    return null
  }
}

export function deleteRoom(roomId: string): void {
  if (typeof window === 'undefined') return
  
  try {
    const rooms = getRoomsFromStorage()
    const filtered = rooms.filter(r => r.id !== roomId)
    saveRoomsToStorage(filtered)
  } catch (error) {
    console.error('Error eliminando cubículo:', error)
  }
}

export function toggleRoomActive(roomId: string): Room | null {
  const room = getRoomById(roomId)
  if (!room) return null
  
  return updateRoom(roomId, { activo: !room.activo })
}

export function getReservations(): Reservation[] {
  // Actualizar estados antes de obtener las reservas
  updateReservationStatuses()
  return getReservationsFromStorage().filter(r => r.status === 'active')
}

export function getAllReservations(): Reservation[] {
  // Actualizar estados antes de obtener todas las reservas
  updateReservationStatuses()
  return getReservationsFromStorage()
}

export function getUserReservations(): Reservation[] {
  // Actualizar estados antes de obtener las reservas del usuario
  updateReservationStatuses()
  return getReservationsFromStorage().filter(r => r.status === 'active')
}

// Función para verificar si una matrícula tiene una reserva activa (en curso o futura)
export function hasActiveReservation(matricula: string): boolean {
  // Actualizar estados antes de verificar
  updateReservationStatuses()
  const reservations = getReservationsFromStorage()
  const now = new Date()
  
  // Buscar reservas de esta matrícula que estén activas o sean futuras
  const activeReservations = reservations.filter(reservation => {
    // Solo considerar reservas no canceladas
    if (reservation.status === 'cancelled') return false
    
    // Verificar que sea la misma matrícula
    if (reservation.matricula !== matricula) return false
    
    const inicio = new Date(reservation.inicio)
    const fin = new Date(reservation.fin)
    
    // Considerar reservas que:
    // 1. Están en curso (ahora está dentro del rango de la reserva)
    // 2. Son futuras (aún no han comenzado)
    const isInProgress = now >= inicio && now <= fin
    const isFuture = now < inicio
    
    return isInProgress || isFuture
  })
  
  return activeReservations.length > 0
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
    status: 'active', // Siempre se crea como active, luego se actualiza según la hora
    created_at: new Date().toISOString()
  }
  
  saveReservationToStorage(reservation)
  // Actualizar estados después de crear la reserva para establecer el estado correcto
  updateReservationStatuses()
  
  // Obtener la reserva actualizada para retornar el estado correcto
  const updatedReservations = getReservationsFromStorage()
  const updatedReservation = updatedReservations.find(r => r.id === reservation.id)
  return updatedReservation || reservation
}

export function cancelReservation(reservationId: string): void {
  updateReservationInStorage(reservationId, { status: 'cancelled' })
}

export function deleteReservation(reservationId: string): void {
  if (typeof window === 'undefined') return
  
  try {
    const reservations = getReservationsFromStorage()
    const filtered = reservations.filter(r => r.id !== reservationId)
    localStorage.setItem('cubiculos-reservations', JSON.stringify(filtered))
  } catch (error) {
    console.error('Error eliminando reserva:', error)
  }
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
  // Actualizar estados antes de verificar conflictos
  updateReservationStatuses()
  const reservations = getReservationsFromStorage()
  const startTime = new Date(inicio)
  const endTime = new Date(fin)
  const now = new Date()
  
  return reservations.filter(reservation => {
    // No considerar reservas canceladas
    if (reservation.status === 'cancelled') return false
    
    // No considerar reservas del mismo cubículo
    if (reservation.room_id !== roomId) return false
    
    const resStart = new Date(reservation.inicio)
    const resEnd = new Date(reservation.fin)
    
    // Considerar reservas activas y reservas futuras (que tienen status 'completed' pero son futuras)
    const isActive = reservation.status === 'active'
    const isFuture = resStart > now // Reserva futura
    
    // Solo considerar reservas activas o futuras (no las que ya pasaron)
    if (!isActive && !isFuture) return false
    
    // Verificar si hay solapamiento
    // Dos reservas se solapan si: startTime < resEnd && endTime > resStart
    // Esto detecta cualquier tipo de solapamiento (parcial o completo)
    return (startTime < resEnd && endTime > resStart)
  })
}

// Función para verificar si una matrícula ya tiene una reserva activa en el mismo horario
export function checkMatriculaConflicts(
  matricula: string,
  inicio: string,
  fin: string,
  excludeReservationId?: string
): Reservation[] {
  // Actualizar estados antes de verificar conflictos
  updateReservationStatuses()
  const reservations = getReservationsFromStorage()
  const startTime = new Date(inicio)
  const endTime = new Date(fin)
  
  return reservations.filter(reservation => {
    // Solo considerar reservas activas (no canceladas ni completadas)
    if (reservation.status !== 'active') return false
    
    // Excluir la reserva actual si se está editando
    if (excludeReservationId && reservation.id === excludeReservationId) {
      return false
    }
    
    // Verificar que sea la misma matrícula
    if (reservation.matricula !== matricula) return false
    
    const resStart = new Date(reservation.inicio)
    const resEnd = new Date(reservation.fin)
    
    // Verificar si hay solapamiento de tiempo
    return (startTime < resEnd && endTime > resStart)
  })
}

export function getRoomAvailability(roomId: string): boolean {
  // Actualizar estados antes de verificar disponibilidad
  updateReservationStatuses()
  const now = new Date()
  const activeReservations = getReservationsFromStorage().filter(r => 
    r.room_id === roomId && 
    r.status === 'active' &&
    new Date(r.inicio) <= now &&
    new Date(r.fin) >= now
  )
  return activeReservations.length === 0
}

// Función para actualizar automáticamente el estado de las reservas basándose en la hora actual
export function updateReservationStatuses(): void {
  if (typeof window === 'undefined') return
  
  try {
    const reservations = getReservationsFromStorage()
    const now = new Date()
    let hasChanges = false
    
    const updatedReservations = reservations.map(reservation => {
      // Si está cancelada, no cambiar su estado (solo se cancela manualmente)
      if (reservation.status === 'cancelled') {
        return reservation
      }
      
      const inicio = new Date(reservation.inicio)
      const fin = new Date(reservation.fin)
      
      // Si la hora actual está dentro del rango de la reserva (durante la reserva): active
      if (now >= inicio && now <= fin) {
        if (reservation.status !== 'active') {
          hasChanges = true
          return { ...reservation, status: 'active' as const }
        }
      }
      // Si la hora actual es después del fin: completed
      else if (now > fin) {
        if (reservation.status !== 'completed') {
          hasChanges = true
          return { ...reservation, status: 'completed' as const }
        }
      }
      // Si la hora actual es antes del inicio: cambiar a completed temporalmente
      // Las reservas futuras NO deben estar "active" hasta que llegue su hora
      // Usamos "completed" como estado temporal para reservas futuras
      // En la UI se mostrará como "Pendiente" cuando el estado es "completed" pero la fecha es futura
      else if (now < inicio) {
        // Si la reserva está como "active" pero aún no es su hora, cambiarla a "completed"
        // Esto evita que se muestren como "active" antes de su hora
        if (reservation.status === 'active') {
          hasChanges = true
          return { ...reservation, status: 'completed' as const }
        }
        // Si ya está como "completed", mantenerlo (puede ser una reserva futura o pasada)
        return reservation
      }
      
      return reservation
    })
    
    // Solo actualizar si hubo cambios
    if (hasChanges) {
      localStorage.setItem('cubiculos-reservations', JSON.stringify(updatedReservations))
    }
  } catch (error) {
    console.error('Error actualizando estados de reservas:', error)
  }
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

// ==================== ANUNCIOS ====================

export interface Announcement {
  id: string
  mensaje: string
  activo: boolean
  created_at: string
  updated_at: string
}

// Funciones para manejar anuncios en localStorage
function getAnnouncementsFromStorage(): Announcement[] {
  if (typeof window === 'undefined') return []
  
  try {
    const stored = localStorage.getItem('cubiculos-announcements')
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('Error leyendo anuncios del localStorage:', error)
    return []
  }
}

function saveAnnouncementsToStorage(announcements: Announcement[]): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem('cubiculos-announcements', JSON.stringify(announcements))
  } catch (error) {
    console.error('Error guardando anuncios en localStorage:', error)
  }
}

export function getAnnouncements(): Announcement[] {
  return getAnnouncementsFromStorage().filter(a => a.activo)
}

export function getAllAnnouncements(): Announcement[] {
  return getAnnouncementsFromStorage()
}

export function createAnnouncement(mensaje: string): Announcement {
  const announcement: Announcement = {
    id: Date.now().toString(),
    mensaje,
    activo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
  
  const announcements = getAnnouncementsFromStorage()
  announcements.push(announcement)
  saveAnnouncementsToStorage(announcements)
  
  return announcement
}

export function updateAnnouncement(
  announcementId: string,
  updates: Partial<Pick<Announcement, 'mensaje' | 'activo'>>
): Announcement | null {
  if (typeof window === 'undefined') return null
  
  try {
    const announcements = getAnnouncementsFromStorage()
    const index = announcements.findIndex(a => a.id === announcementId)
    
    if (index === -1) {
      return null
    }
    
    const updatedAnnouncement = {
      ...announcements[index],
      ...updates,
      updated_at: new Date().toISOString()
    }
    announcements[index] = updatedAnnouncement
    saveAnnouncementsToStorage(announcements)
    
    return updatedAnnouncement
  } catch (error) {
    console.error('Error actualizando anuncio:', error)
    return null
  }
}

export function deleteAnnouncement(announcementId: string): void {
  if (typeof window === 'undefined') return
  
  try {
    const announcements = getAnnouncementsFromStorage()
    const filtered = announcements.filter(a => a.id !== announcementId)
    saveAnnouncementsToStorage(filtered)
  } catch (error) {
    console.error('Error eliminando anuncio:', error)
  }
}

