// Mock functions para desarrollo sin Supabase
export const mockUser = {
  id: 'mock-user-id',
  email: 'test@example.com',
  matricula: '2024001234',
  verified: true,
  role: 'student' as const
}

export const mockRooms = [
  // Cubículos individuales (8 normales)
  {
    id: '1',
    nombre: 'Cubículo 1',
    descripcion: 'Cubículo individual con escritorio y silla',
    capacidad: 1,
    activo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    nombre: 'Cubículo 2',
    descripcion: 'Cubículo individual con escritorio y silla',
    capacidad: 1,
    activo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    nombre: 'Cubículo 3',
    descripcion: 'Cubículo individual con escritorio y silla',
    capacidad: 1,
    activo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '4',
    nombre: 'Cubículo 4',
    descripcion: 'Cubículo individual con escritorio y silla',
    capacidad: 1,
    activo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '5',
    nombre: 'Cubículo 5',
    descripcion: 'Cubículo individual con escritorio y silla',
    capacidad: 1,
    activo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '6',
    nombre: 'Cubículo 6',
    descripcion: 'Cubículo individual con escritorio y silla',
    capacidad: 1,
    activo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '7',
    nombre: 'Cubículo 7',
    descripcion: 'Cubículo individual con escritorio y silla',
    capacidad: 1,
    activo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '8',
    nombre: 'Cubículo 8',
    descripcion: 'Cubículo individual con escritorio y silla',
    capacidad: 1,
    activo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  // Salas grandes (2 grandes)
  {
    id: '9',
    nombre: 'Sala de Estudio A',
    descripcion: 'Sala grande para 6 personas con mesa amplia y pizarra',
    capacidad: 6,
    activo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '10',
    nombre: 'Sala de Estudio B',
    descripcion: 'Sala grande para 8 personas con mesa amplia y proyector',
    capacidad: 8,
    activo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

export const mockReservations = [
  {
    id: '1',
    user_id: 'mock-user-id',
    room_id: '1',
    inicio: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Mañana
    fin: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(), // Mañana + 1 hora
    status: 'active' as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    room: mockRooms[0],
    matricula: '2024001234',
    nombreCompleto: 'Juan Pérez García',
    cantidadPersonas: 1,
  },
  {
    id: '2',
    user_id: 'mock-user-id',
    room_id: '3',
    inicio: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // Pasado mañana
    fin: new Date(Date.now() + 50 * 60 * 60 * 1000).toISOString(), // Pasado mañana + 2 horas
    status: 'active' as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    room: mockRooms[2],
    matricula: '2024001235',
    nombreCompleto: 'María González López',
    cantidadPersonas: 3,
  },
  {
    id: '3',
    user_id: 'mock-user-id',
    room_id: '2',
    inicio: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 horas atrás
    fin: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hora atrás
    status: 'completed' as const,
    created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    room: mockRooms[1],
    matricula: '2024001236',
    nombreCompleto: 'Carlos Rodríguez Martínez',
    cantidadPersonas: 1,
  },
]
