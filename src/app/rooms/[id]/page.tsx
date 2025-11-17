'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { getRooms, getReservations, createReservation, checkReservationConflicts, getRoomById } from '@/lib/reservations'
import { Room, Reservation } from '@/lib/reservations'
import { ArrowLeft, MapPin, Users, Calendar, Clock, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { CETYS_CLASSES } from '@/lib/cetys-colors'

// Función para verificar si la biblioteca está abierta
const isLibraryOpen = (hora: string) => {
  const [horas, minutos] = hora.split(':').map(Number)
  const horaDecimal = horas + minutos / 60
  
  // Biblioteca abierta de 7:00 AM a 9:00 PM (7.0 a 21.0)
  return horaDecimal >= 7.0 && horaDecimal <= 21.0
}

// Función para verificar si hoy es domingo
const isSunday = () => {
  const hoy = new Date()
  return hoy.getDay() === 0 // 0 = domingo
}

const reservationSchema = z.object({
  matricula: z.string().min(1, 'La matrícula es requerida').max(20, 'Matrícula muy larga'),
  cantidadPersonas: z.number().int().min(1, 'Mínimo 1 persona').max(10, 'Máximo 10 personas'),
  horaInicio: z.string().min(1, 'Hora de inicio requerida'),
  horaFin: z.string().min(1, 'Hora de fin requerida'),
}).refine((data) => {
  const horaInicio = data.horaInicio
  const horaFin = data.horaFin
  return horaFin > horaInicio
}, {
  message: "La hora de fin debe ser posterior a la de inicio",
  path: ["horaFin"]
}).refine((data) => {
  // Verificar que no sea domingo
  if (isSunday()) {
    return false
  }
  return true
}, {
  message: "La biblioteca está cerrada los domingos",
  path: ["horaInicio"]
}).refine((data) => {
  // Verificar que la hora de inicio esté dentro del horario de la biblioteca
  if (!isLibraryOpen(data.horaInicio)) {
    return false
  }
  return true
}, {
  message: "La hora de inicio debe estar entre 7:00 AM y 9:00 PM",
  path: ["horaInicio"]
}).refine((data) => {
  // Verificar que la hora de fin esté dentro del horario de la biblioteca
  if (!isLibraryOpen(data.horaFin)) {
    return false
  }
  return true
}, {
  message: "La hora de fin debe estar entre 7:00 AM y 9:00 PM",
  path: ["horaFin"]
}).refine((data) => {
  // Verificar que la reserva no exceda 2 horas
  const inicio = new Date(`2000-01-01T${data.horaInicio}`)
  const fin = new Date(`2000-01-01T${data.horaFin}`)
  const duracionHoras = (fin.getTime() - inicio.getTime()) / (1000 * 60 * 60)
  
  return duracionHoras <= 2
}, {
  message: "La reserva no puede exceder 2 horas",
  path: ["horaFin"]
})

type ReservationForm = z.infer<typeof reservationSchema>

export default function RoomDetailPage() {
  const [room, setRoom] = useState<Room | null>(null)
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const router = useRouter()
  const params = useParams()
  const roomId = params.id as string

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ReservationForm>({
    resolver: zodResolver(reservationSchema),
  })

  useEffect(() => {
    const loadRoomData = async () => {
      try {
        console.log('🔍 Buscando cubículo con ID:', roomId)
        
        // Obtener cubículo por ID (síncrono) y reservas (asíncrono)
        const roomData = getRoomById(roomId)
        console.log('📦 Datos del cubículo encontrados:', roomData)
        
        const reservationsData = await getReservations(roomId)
        console.log('📅 Reservas encontradas:', reservationsData)

        if (!roomData) {
          console.error('❌ Cubículo no encontrado para ID:', roomId)
          toast.error('Cubículo no encontrado')
          router.push('/')
          return
        }

        setRoom(roomData)
        setReservations(reservationsData)
        console.log('✅ Datos cargados correctamente')
      } catch (error) {
        console.error('❌ Error al cargar datos:', error)
        toast.error('Error al cargar los datos del cubículo')
      } finally {
        setIsLoading(false)
      }
    }

    if (roomId) {
      loadRoomData()
    }
  }, [roomId, router])

  const onSubmit = async (data: ReservationForm) => {
    setIsCreating(true)
    try {
      // Verificar si es domingo
      if (isSunday()) {
        toast.error('La biblioteca está cerrada los domingos')
        return
      }

      // Validar matrícula contra la base de datos
      const matriculaValidation = await validateMatricula(data.matricula)
      if (!matriculaValidation.valid) {
        // Mostrar el mensaje específico que viene de la validación
        toast.error(matriculaValidation.message || 'Matrícula no válida o no autorizada')
        return
      }

      // Verificar capacidad del cubículo
      if (data.cantidadPersonas > (room?.capacidad || 1)) {
        toast.error(`Este cubículo solo tiene capacidad para ${room?.capacidad} persona${room?.capacidad > 1 ? 's' : ''}`)
        return
      }

      // Crear fechas completas usando la fecha actual + hora seleccionada
      const hoy = new Date()
      const [horaInicio, minutoInicio] = data.horaInicio.split(':').map(Number)
      const [horaFin, minutoFin] = data.horaFin.split(':').map(Number)
      
      const inicio = new Date(hoy)
      inicio.setHours(horaInicio, minutoInicio, 0, 0)
      
      const fin = new Date(hoy)
      fin.setHours(horaFin, minutoFin, 0, 0)

      // Check for conflicts
      const conflicts = await checkReservationConflicts(roomId, inicio.toISOString(), fin.toISOString())
      if (conflicts.length > 0) {
        toast.error('Ya existe una reserva en ese horario')
        return
      }

      // Crear reserva usando el sistema simplificado
      const nuevaReserva = await createReservation(
        roomId,
        data.matricula,
        '', // No necesitamos nombre completo
        data.cantidadPersonas,
        inicio.toISOString(),
        fin.toISOString()
      )

      // Crear reserva exitosa
      toast.success('Reserva creada exitosamente')
      setIsDialogOpen(false)
      reset()
      
      // Actualizar lista de reservas
      setReservations([...reservations, nuevaReserva])
    } catch (error) {
      toast.error('Error al crear la reserva')
    } finally {
      setIsCreating(false)
    }
  }

  // Función para validar matrícula usando el sistema real
  const validateMatricula = async (matricula: string): Promise<{ valid: boolean; message?: string }> => {
    try {
      const { verifyMatricula } = await import('@/lib/auth')
      const result = await verifyMatricula(matricula)
      return result
    } catch (error) {
      console.error('Error validando matrícula:', error)
      return { valid: false, message: 'Error al validar la matrícula. Por favor, intenta de nuevo.' }
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getNextAvailableSlot = () => {
    const hoy = new Date()
    
    // Verificar si es domingo
    if (isSunday()) {
      // Si es domingo, sugerir horario para el lunes
      return {
        horaInicio: "07:00",
        horaFin: "08:00"
      }
    }
    
    // Horario de la biblioteca: 7:00 AM - 9:00 PM
    const horaActual = hoy.getHours()
    let horaInicio = Math.max(horaActual + 1, 7) // Mínimo 1 hora después de ahora, mínimo 7 AM
    let horaFin = horaInicio + 1 // Duración de 1 hora por defecto
    
    // Si ya es muy tarde, usar horario de mañana
    if (horaActual >= 20) {
      horaInicio = 7
      horaFin = 8
    }
    
    // Asegurar que no exceda el horario de cierre
    if (horaFin > 21) {
      horaFin = 21
      horaInicio = horaFin - 1
    }

    return {
      horaInicio: `${horaInicio.toString().padStart(2, '0')}:00`,
      horaFin: `${horaFin.toString().padStart(2, '0')}:00`
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FFCD00] mx-auto"></div>
          <p className="mt-2 text-black">Cargando cubículo...</p>
        </div>
      </div>
    )
  }

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-black mb-2">
            Cubículo no encontrado
          </h3>
          <Button 
            onClick={() => router.push('/')}
            className="bg-[#FFCD00] hover:bg-[#E6B800] text-black"
          >
            Volver al Inicio
          </Button>
        </div>
      </div>
    )
  }

  const nextSlot = getNextAvailableSlot()

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-20">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => router.push('/')}
                className="mr-4 text-black hover:bg-gray-100"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-black">
                  {room.nombre}
                </h1>
                <p className="text-sm text-gray-600">
                  Reserva de cubículo - CETYS
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Room Info */}
          <div className="lg:col-span-1">
            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="bg-gray-50 rounded-t-lg">
                <CardTitle className="flex items-center text-black">
                  <MapPin className="h-5 w-5 mr-2 text-[#FFCD00]" />
                  Información del Cubículo
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div>
                  <h3 className="font-semibold text-black text-lg">{room.nombre}</h3>
                  {room.descripcion && (
                    <p className="text-sm text-gray-600 mt-2">{room.descripcion}</p>
                  )}
                </div>
                
                <div className="flex items-center text-sm text-gray-500">
                  <Users className="h-4 w-4 mr-2" />
                  Capacidad: {room.capacidad} persona{room.capacidad > 1 ? 's' : ''}
                </div>

                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="h-4 w-4 mr-2" />
                  Horario: 8:00 AM - 10:00 PM
                </div>

                <Badge variant="secondary" className="w-fit bg-[#DCFCE7] text-[#16A34A]">
                  Disponible
                </Badge>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full bg-[#22C55E] hover:bg-[#16A34A] text-white py-3">
                      <Calendar className="h-4 w-4 mr-2" />
                      Nueva Reserva
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Nueva Reserva</DialogTitle>
                      <DialogDescription>
                        Reserva el cubículo {room.nombre}
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="matricula">Matrícula</Label>
                        <Input
                          id="matricula"
                          placeholder="Ej: 2024001234"
                          {...register('matricula')}
                          disabled={isCreating}
                          className="uppercase"
                        />
                        {errors.matricula && (
                          <p className="text-sm text-red-600">{errors.matricula.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="cantidadPersonas">Cantidad de Personas</Label>
                            <Input
                              id="cantidadPersonas"
                              type="number"
                              min="1"
                              max={room.capacidad}
                              placeholder="1"
                              {...register('cantidadPersonas', { valueAsNumber: true })}
                              disabled={isCreating}
                            />
                            {errors.cantidadPersonas && (
                              <p className="text-sm text-red-600">{errors.cantidadPersonas.message}</p>
                            )}
                            <p className="text-xs text-gray-500">
                              Máximo {room.capacidad} persona{room.capacidad > 1 ? 's' : ''}
                            </p>
                          </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="horaInicio">Hora de Inicio</Label>
                          <Input
                            id="horaInicio"
                            type="time"
                            {...register('horaInicio')}
                            disabled={isCreating}
                            defaultValue={nextSlot.horaInicio}
                          />
                          {errors.horaInicio && (
                            <p className="text-sm text-red-600">{errors.horaInicio.message}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="horaFin">Hora de Fin</Label>
                          <Input
                            id="horaFin"
                            type="time"
                            {...register('horaFin')}
                            disabled={isCreating}
                            defaultValue={nextSlot.horaFin}
                          />
                          {errors.horaFin && (
                            <p className="text-sm text-red-600">{errors.horaFin.message}</p>
                          )}
                        </div>
                      </div>

                          <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-sm text-gray-600">
                              <strong>Horario de la biblioteca:</strong> 7:00 AM - 9:00 PM
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Lunes a Sábado: 7:00 AM - 9:00 PM | Domingo: Cerrado
                            </p>
                            <p className="text-xs text-gray-500">
                              Las reservas son automáticamente para el día de hoy
                            </p>
                          </div>

                      <div className="flex justify-end space-x-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsDialogOpen(false)}
                          disabled={isCreating}
                        >
                          Cancelar
                        </Button>
                        <Button type="submit" disabled={isCreating} className="bg-[#22C55E] hover:bg-[#16A34A] text-white">
                          {isCreating ? 'Creando...' : 'Crear Reserva'}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </div>

          {/* Reservations */}
          <div className="lg:col-span-2">
            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="bg-gray-50 rounded-t-lg">
                <CardTitle className="text-black">Reservas del Cubículo</CardTitle>
                <CardDescription>
                  Reservas activas para este cubículo
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {reservations.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-black mb-2">
                      No hay reservas
                    </h3>
                    <p className="text-gray-600">
                      Este cubículo está disponible para reservar.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reservations.map((reservation) => (
                      <div key={reservation.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <Calendar className="h-5 w-5 text-gray-400" />
                          </div>
                          <div>
                            <p className="font-medium text-black">
                              {formatDate(reservation.inicio)} - {formatDate(reservation.fin)}
                            </p>
                            <p className="text-sm text-gray-600">
                              Matrícula: {(reservation as any).matricula || 'N/A'}
                            </p>
                            <p className="text-sm text-gray-600">
                              Personas: {(reservation as any).cantidadPersonas || 1}
                            </p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="bg-[#FFF4B3] text-[#E6B800]">
                          {reservation.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
