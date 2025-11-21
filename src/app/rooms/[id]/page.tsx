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

// Función para crear el esquema de validación
const createReservationSchema = () => z.object({
  matricula: z.string().min(1, 'La matrícula es requerida').max(20, 'Matrícula muy larga'),
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
  const duracionMinutos = (fin.getTime() - inicio.getTime()) / (1000 * 60)
  
  // Validar duración mínima de 30 minutos
  if (duracionMinutos < 30) {
    return false
  }
  
  // Validar duración máxima de 2 horas (120 minutos)
  return duracionHoras <= 2
}, {
  message: "La reserva debe ser entre 30 minutos y 2 horas máximo",
  path: ["horaFin"]
})

type ReservationForm = z.infer<ReturnType<typeof createReservationSchema>>

export default function RoomDetailPage() {
  const [room, setRoom] = useState<Room | null>(null)
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedBlocks, setSelectedBlocks] = useState<number[]>([]) // Índices de bloques seleccionados
  const router = useRouter()
  const params = useParams()
  const roomId = params.id as string

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<ReservationForm>({
    resolver: zodResolver(createReservationSchema()),
  })

  // Campos ocultos para mantener compatibilidad con el formulario
  // Los valores se actualizan automáticamente cuando se seleccionan bloques

  useEffect(() => {
    const loadRoomData = async () => {
      try {
        console.log('🔍 Buscando cubículo con ID:', roomId)
        
        // Obtener cubículo por ID (síncrono) y reservas (asíncrono)
        const roomData = getRoomById(roomId)
        console.log('📦 Datos del cubículo encontrados:', roomData)
        
        // Actualizar estados antes de obtener las reservas
        const { updateReservationStatuses } = await import('@/lib/cubiculos')
        updateReservationStatuses()
        
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
    
    // Actualizar estados de reservas cada minuto
    const interval = setInterval(() => {
      if (roomId) {
        loadRoomData()
      }
    }, 60000) // 60 segundos
    
    return () => clearInterval(interval)
  }, [roomId, router])

  const onSubmit = async (data: ReservationForm) => {
    setIsCreating(true)
    try {
      // Verificar que se hayan seleccionado bloques
      if (selectedBlocks.length === 0) {
        toast.error('Por favor selecciona al menos un bloque horario')
        setIsCreating(false)
        return
      }

      // Verificar si es domingo
      if (isSunday()) {
        toast.error('La biblioteca está cerrada los domingos')
        setIsCreating(false)
        return
      }

      // Validar matrícula contra la base de datos
      const matriculaValidation = await validateMatricula(data.matricula)
      if (!matriculaValidation.valid) {
        // Mostrar el mensaje específico que viene de la validación
        toast.error(matriculaValidation.message || 'Matrícula no válida o no autorizada')
        setIsCreating(false)
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

      // Validar que las horas estén definidas
      if (!data.horaInicio || !data.horaFin) {
        toast.error('Por favor selecciona un horario válido')
        setIsCreating(false)
        return
      }

      // Crear reserva usando el sistema simplificado
      // La función createReservation ya valida conflictos de cubículo y matrícula
      const nuevaReserva = await createReservation(
        roomId,
        data.matricula,
        '', // No necesitamos nombre completo
        1, // Cantidad de personas por defecto (ya no se usa pero se mantiene para compatibilidad)
        inicio.toISOString(),
        fin.toISOString()
      )

      // Crear reserva exitosa
      toast.success('Reserva creada exitosamente')
      setIsDialogOpen(false)
      setSelectedBlocks([])
      reset()
      
      // Actualizar lista de reservas inmediatamente
      // Primero actualizar estados y luego obtener las reservas actualizadas
      const { updateReservationStatuses } = await import('@/lib/cubiculos')
      updateReservationStatuses()
      const updatedReservations = await getReservations(roomId)
      setReservations(updatedReservations)
    } catch (error: any) {
      // Mostrar el mensaje de error específico
      const errorMessage = error?.message || 'Error al crear la reserva'
      toast.error(errorMessage)
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

  // Generar bloques horarios de 1 hora (7:00 AM a 9:00 PM)
  const generateTimeBlocks = () => {
    const blocks: { hora: string; index: number }[] = []
    for (let hora = 7; hora < 21; hora++) {
      blocks.push({
        hora: `${hora.toString().padStart(2, '0')}:00`,
        index: hora - 7
      })
    }
    return blocks
  }

  // Verificar si un bloque está disponible
  const isBlockAvailable = (blockIndex: number): boolean => {
    if (isSunday()) return false
    
    const hoy = new Date()
    const horaActual = hoy.getHours()
    const minutoActual = hoy.getMinutes()
    const horaBloque = blockIndex + 7
    
    // Permitir reservar en el bloque actual si aún no ha pasado completamente
    // Si la hora del bloque es igual a la hora actual, permitir reservar
    // Si la hora del bloque es menor, no permitir (ya pasó)
    if (horaBloque < horaActual) return false
    // Si es la misma hora, permitir (aún se puede reservar para ese bloque)
    
    // Verificar conflictos con reservas existentes
    const horaInicio = `${horaBloque.toString().padStart(2, '0')}:00`
    const horaFin = `${(horaBloque + 1).toString().padStart(2, '0')}:00`
    
    const hoyISO = hoy.toISOString().split('T')[0]
    const inicioISO = `${hoyISO}T${horaInicio}:00`
    const finISO = `${hoyISO}T${horaFin}:00`
    
    // Verificar si hay reservas que se solapen con este bloque
    // Considerar reservas activas y futuras (no canceladas ni completadas que ya pasaron)
    const hasConflict = reservations.some(reservation => {
      // No considerar reservas canceladas
      if (reservation.status === 'cancelled') return false
      
      const resInicio = new Date(reservation.inicio)
      const resFin = new Date(reservation.fin)
      const blockInicio = new Date(inicioISO)
      const blockFin = new Date(finISO)
      
      // Considerar reservas activas y futuras
      const isActive = reservation.status === 'active'
      const isFuture = resInicio > hoy
      
      // Solo considerar reservas activas o futuras
      if (!isActive && !isFuture) return false
      
      // Verificar solapamiento: dos intervalos se solapan si start1 < end2 && end1 > start2
      return (blockInicio < resFin && blockFin > resInicio)
    })
    
    return !hasConflict
  }

  // Verificar si un bloque puede ser seleccionado
  const canSelectBlock = (blockIndex: number): boolean => {
    if (!isBlockAvailable(blockIndex)) return false
    if (selectedBlocks.includes(blockIndex)) return true // Puede deseleccionarse
    
    if (selectedBlocks.length === 0) return true
    if (selectedBlocks.length === 1) {
      // Puede seleccionarse si es consecutivo al bloque seleccionado
      return Math.abs(blockIndex - selectedBlocks[0]) === 1
    }
    // Si ya hay 2 bloques, solo puede seleccionarse si es uno de los ya seleccionados
    return selectedBlocks.includes(blockIndex)
  }

  // Manejar selección de bloques
  const handleBlockClick = (blockIndex: number) => {
    if (!isBlockAvailable(blockIndex)) return
    
    setSelectedBlocks(prev => {
      // Si el bloque ya está seleccionado, deseleccionarlo
      if (prev.includes(blockIndex)) {
        const newSelection = prev.filter(idx => idx !== blockIndex)
        updateTimesFromBlocks(newSelection)
        return newSelection
      }
      
      // Si ya hay 2 bloques seleccionados, reemplazar con el nuevo
      if (prev.length >= 2) {
        const newSelection = [blockIndex]
        updateTimesFromBlocks(newSelection)
        return newSelection
      }
      
      // Si hay 1 bloque seleccionado, verificar que sea consecutivo
      if (prev.length === 1) {
        const firstBlock = prev[0]
        // Verificar si son consecutivos
        if (Math.abs(blockIndex - firstBlock) === 1) {
          const newSelection = [Math.min(firstBlock, blockIndex), Math.max(firstBlock, blockIndex)]
          updateTimesFromBlocks(newSelection)
          return newSelection
        } else {
          // Si no son consecutivos, reemplazar
          const newSelection = [blockIndex]
          updateTimesFromBlocks(newSelection)
          return newSelection
        }
      }
      
      // Si no hay bloques seleccionados, seleccionar este
      const newSelection = [blockIndex]
      updateTimesFromBlocks(newSelection)
      return newSelection
    })
  }

  // Actualizar campos de hora basado en bloques seleccionados
  const updateTimesFromBlocks = (blocks: number[]) => {
    if (blocks.length === 0) {
      setValue('horaInicio', '')
      setValue('horaFin', '')
      return
    }
    
    const sortedBlocks = [...blocks].sort((a, b) => a - b)
    const horaInicio = `${(sortedBlocks[0] + 7).toString().padStart(2, '0')}:00`
    const horaFin = `${(sortedBlocks[sortedBlocks.length - 1] + 8).toString().padStart(2, '0')}:00`
    
    setValue('horaInicio', horaInicio, { shouldValidate: true })
    setValue('horaFin', horaFin, { shouldValidate: true })
  }

  // Limpiar selección cuando se abre/cierra el diálogo
  useEffect(() => {
    if (isDialogOpen) {
      setSelectedBlocks([])
      setValue('horaInicio', '')
      setValue('horaFin', '')
    }
  }, [isDialogOpen, setValue])

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
                      {/* Campos ocultos para mantener compatibilidad con el formulario */}
                      <input type="hidden" {...register('horaInicio')} />
                      <input type="hidden" {...register('horaFin')} />
                      
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
                        <Label>Selecciona tu horario (máximo 2 horas consecutivas)</Label>
                        {(() => {
                          // Verificar si el cubículo está ocupado actualmente
                          const now = new Date()
                          const currentReservation = reservations.find(r => {
                            const inicio = new Date(r.inicio)
                            const fin = new Date(r.fin)
                            return now >= inicio && now <= fin
                          })
                          
                          if (currentReservation) {
                            const finReserva = new Date(currentReservation.fin)
                            const horaFin = finReserva.getHours()
                            const minutoFin = finReserva.getMinutes()
                            const horaFormateada = horaFin === 12
                              ? `12:${minutoFin.toString().padStart(2, '0')} PM`
                              : horaFin > 12
                                ? `${horaFin - 12}:${minutoFin.toString().padStart(2, '0')} PM`
                                : `${horaFin}:${minutoFin.toString().padStart(2, '0')} AM`
                            
                            return (
                              <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <p className="text-sm text-yellow-800">
                                  <strong>⚠️ Cubículo ocupado actualmente</strong>
                                  <br />
                                  El cubículo estará disponible a partir de las <strong>{horaFormateada}</strong>. 
                                  Puedes seleccionar bloques horarios después de esa hora.
                                </p>
                              </div>
                            )
                          }
                          return null
                        })()}
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                          {generateTimeBlocks().map((block) => {
                            const isAvailable = isBlockAvailable(block.index)
                            const isSelected = selectedBlocks.includes(block.index)
                            const canSelect = canSelectBlock(block.index)
                            
                            // Formatear hora para mostrar (AM/PM)
                            const horaNum = block.index + 7
                            const horaFormateada = horaNum === 12 
                              ? '12:00 PM' 
                              : horaNum > 12 
                                ? `${horaNum - 12}:00 PM`
                                : `${horaNum}:00 AM`
                            
                            return (
                              <button
                                key={block.index}
                                type="button"
                                onClick={() => handleBlockClick(block.index)}
                                disabled={!canSelect || isCreating}
                                className={`
                                  w-full aspect-square p-3 rounded-lg border-2 text-sm font-medium transition-all
                                  flex items-center justify-center text-center
                                  ${isSelected 
                                    ? 'bg-[#22C55E] text-white border-[#16A34A] shadow-md hover:bg-[#16A34A]' 
                                    : isAvailable && canSelect
                                      ? 'bg-white text-gray-700 border-gray-300 hover:border-[#22C55E] hover:bg-green-50 cursor-pointer'
                                      : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-50'
                                  }
                                `}
                              >
                                {horaFormateada}
                              </button>
                            )
                          })}
                        </div>
                        {selectedBlocks.length > 0 && (
                          <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-sm text-green-800">
                              <strong>Horario seleccionado:</strong>{' '}
                              {(() => {
                                const sorted = [...selectedBlocks].sort((a, b) => a - b)
                                const inicio = sorted[0] + 7
                                const fin = sorted[sorted.length - 1] + 8
                                const inicioFormato = inicio === 12 
                                  ? '12:00 PM' 
                                  : inicio > 12 
                                    ? `${inicio - 12}:00 PM`
                                    : `${inicio}:00 AM`
                                const finFormato = fin === 12 
                                  ? '12:00 PM' 
                                  : fin > 12 
                                    ? `${fin - 12}:00 PM`
                                    : `${fin}:00 AM`
                                return `${inicioFormato} - ${finFormato} (${sorted.length} hora${sorted.length > 1 ? 's' : ''})`
                              })()}
                            </p>
                          </div>
                        )}
                          {errors.horaInicio && (
                            <p className="text-sm text-red-600">{errors.horaInicio.message}</p>
                          )}
                          {errors.horaFin && (
                            <p className="text-sm text-red-600">{errors.horaFin.message}</p>
                          )}
                        <p className="text-xs text-gray-500">
                          Los bloques disponibles están en verde. Selecciona máximo 2 bloques consecutivos.
                        </p>
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
                            <p className="text-xs text-amber-600 mt-2 font-medium">
                              ⚠️ Selecciona máximo 2 bloques consecutivos (2 horas) | Una matrícula no puede tener más de una reserva activa al mismo tiempo
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
                  Reservas activas y futuras para este cubículo
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
                          </div>
                        </div>
                        <Badge 
                          variant="secondary" 
                          className={
                            (() => {
                              const now = new Date()
                              const inicio = new Date(reservation.inicio)
                              const fin = new Date(reservation.fin)
                              
                              // Si es realmente activa (en su horario)
                              if (reservation.status === 'active' && now >= inicio && now <= fin) {
                                return 'bg-[#DCFCE7] text-[#16A34A]' // Verde para activa
                              }
                              // Si es pendiente (futura)
                              if (inicio > now) {
                                return 'bg-[#FEF3C7] text-[#D97706]' // Amarillo para pendiente
                              }
                              // Si está cancelada
                              if (reservation.status === 'cancelled') {
                                return 'bg-[#FEE2E2] text-[#DC2626]' // Rojo para cancelada
                              }
                              // Si está completada (ya pasó)
                              return 'bg-[#E0E7FF] text-[#4F46E5]' // Azul para completada
                            })()
                          }
                        >
                          {(() => {
                            const now = new Date()
                            const inicio = new Date(reservation.inicio)
                            
                            if (reservation.status === 'active') {
                              // Verificar si está realmente activa o es futura
                              if (inicio > now) {
                                return 'Pendiente'
                              }
                              return 'Activa'
                            }
                            if (reservation.status === 'cancelled') {
                              return 'Cancelada'
                            }
                            // Si es "completed" pero la fecha es futura, mostrar "Pendiente"
                            if (inicio > now) {
                              return 'Pendiente'
                            }
                            return 'Completada'
                          })()}
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
