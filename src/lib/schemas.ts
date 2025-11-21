import { z } from 'zod'

// User schemas
export const CreateUserSchema = z.object({
  email: z.string().email(),
  matricula: z.string().min(1).max(20),
})

export const VerifyMatriculaSchema = z.object({
  matricula: z.string().min(1).max(20),
})

// Reservation schemas
export const CreateReservationSchema = z.object({
  room_id: z.string().uuid(),
  inicio: z.string().datetime(),
  fin: z.string().datetime(),
}).refine((data) => {
  const start = new Date(data.inicio)
  const end = new Date(data.fin)
  return end > start
}, {
  message: "End time must be after start time",
  path: ["fin"]
})

export const UpdateReservationSchema = z.object({
  status: z.enum(['active', 'cancelled', 'completed']),
})

// Whitelist schemas
export const WhitelistRowSchema = z.object({
  matricula: z.string().min(1).max(20),
  nombre: z.string().optional(),
})

export const WhitelistDryRunSchema = z.object({
  toInsert: z.array(WhitelistRowSchema),
  toUpdate: z.array(WhitelistRowSchema.extend({
    id: z.string().uuid(),
  })),
  toDeactivate: z.array(z.object({
    id: z.string().uuid(),
    matricula: z.string(),
  })),
  errors: z.array(z.string()),
})

export const WhitelistApplySchema = z.object({
  toInsert: z.array(WhitelistRowSchema),
  toUpdate: z.array(WhitelistRowSchema.extend({
    id: z.string().uuid(),
  })),
  toDeactivate: z.array(z.object({
    id: z.string().uuid(),
    matricula: z.string(),
  })),
  mode: z.enum(['incremental', 'full-sync']),
})

// Room schemas
export const CreateRoomSchema = z.object({
  nombre: z.string().min(1).max(100),
  descripcion: z.string().optional(),
  capacidad: z.number().int().min(1).max(10),
})

export const UpdateRoomSchema = CreateRoomSchema.partial().extend({
  activo: z.boolean().optional(),
})

// Blackout schemas
export const CreateBlackoutSchema = z.object({
  titulo: z.string().min(1).max(100),
  descripcion: z.string().optional(),
  inicio: z.string().datetime(),
  fin: z.string().datetime(),
}).refine((data) => {
  const start = new Date(data.inicio)
  const end = new Date(data.fin)
  return end > start
}, {
  message: "End time must be after start time",
  path: ["fin"]
})

export const UpdateBlackoutSchema = CreateBlackoutSchema.partial().extend({
  activo: z.boolean().optional(),
})

// Admin login schema
export const AdminLoginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
})

// Availability query schema
export const AvailabilityQuerySchema = z.object({
  room_id: z.string().uuid().optional(),
  start_date: z.string().datetime(),
  end_date: z.string().datetime(),
})

// Reservation rules
export const RESERVATION_RULES = {
  MIN_DURATION_MINUTES: 30,
  MAX_DURATION_MINUTES: 120, // 2 hours (máximo permitido)
  MAX_ADVANCE_DAYS: 7,
  MAX_RESERVATIONS_PER_DAY: 2,
  MAX_RESERVATIONS_PER_WEEK: 5,
  LIBRARY_HOURS: {
    OPEN: '08:00',
    CLOSE: '22:00',
  }
} as const
