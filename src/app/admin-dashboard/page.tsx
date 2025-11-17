'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getRooms, getReservations, createReservation, updateReservation, cancelReservation, checkReservationConflicts } from '@/lib/reservations'
import { Room, Reservation } from '@/lib/reservations'
import { Calendar, Clock, MapPin, LogOut, Plus, Edit, Trash2, X, FileText, Users } from 'lucide-react'
import { toast } from 'sonner'
import { CETYS_CLASSES } from '@/lib/cetys-colors'
import Image from 'next/image'

const reservationSchema = z.object({
  matricula: z.string().min(1, 'La matrícula es requerida'),
  cantidadPersonas: z.number().int().min(1, 'Mínimo 1 persona').max(10, 'Máximo 10 personas'),
  horaInicio: z.string().min(1, 'Hora de inicio requerida'),
  horaFin: z.string().min(1, 'Hora de fin requerida'),
  room_id: z.string().min(1, 'Debe seleccionar un cubículo'),
}).refine((data) => {
  return data.horaFin > data.horaInicio
}, {
  message: "La hora de fin debe ser posterior a la de inicio",
  path: ["horaFin"]
}).refine((data) => {
  const inicio = new Date(`2000-01-01T${data.horaInicio}`)
  const fin = new Date(`2000-01-01T${data.horaFin}`)
  const duracionHoras = (fin.getTime() - inicio.getTime()) / (1000 * 60 * 60)
  return duracionHoras <= 2
}, {
  message: "La reserva no puede exceder 2 horas",
  path: ["horaFin"]
})

type ReservationForm = z.infer<typeof reservationSchema>

export default function AdminDashboard() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [studentNames, setStudentNames] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<ReservationForm>({
    resolver: zodResolver(reservationSchema),
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const roomsData = await getRooms()
      setRooms(roomsData)
      
      // Obtener todas las reservas (activas y canceladas) desde cubiculos
      const { getAllReservations: getAllCubiculosReservations } = await import('@/lib/cubiculos')
      const allCubiculosReservations = getAllCubiculosReservations()
      
      // Convertir a formato Reservation
      const allReservations = allCubiculosReservations.map(reservation => ({
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
          nombre: roomsData.find(r => r.id === reservation.room_id)?.nombre || 'Cubículo',
          capacidad: roomsData.find(r => r.id === reservation.room_id)?.capacidad || 1
        }
      }))
      
      setReservations(allReservations)

      // Cargar nombres de estudiantes
      const namesMap: Record<string, string> = {}
      const { getStudentName } = await import('@/lib/auth')
      
      for (const reservation of allReservations) {
        if (reservation.matricula) {
          const name = await getStudentName(reservation.matricula)
          if (name) {
            namesMap[reservation.matricula] = name
          }
        }
      }
      
      setStudentNames(namesMap)
    } catch (error) {
      toast.error('Error al cargar los datos')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      toast.success('Sesión cerrada')
      router.push('/')
    } catch (error) {
      toast.error('Error al cerrar sesión')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getDateFromDateTime = (dateString: string) => {
    return new Date(dateString).toISOString().split('T')[0]
  }

  const getTimeFromDateTime = (dateString: string) => {
    const date = new Date(dateString)
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${hours}:${minutes}`
  }

  const onSubmit = async (data: ReservationForm) => {
    try {
      // Crear fechas completas usando la fecha actual + hora seleccionada
      const hoy = new Date()
      const [horaInicio, minutoInicio] = data.horaInicio.split(':').map(Number)
      const [horaFin, minutoFin] = data.horaFin.split(':').map(Number)
      
      const inicio = new Date(hoy)
      inicio.setHours(horaInicio, minutoInicio, 0, 0)
      
      const fin = new Date(hoy)
      fin.setHours(horaFin, minutoFin, 0, 0)

      // Verificar conflictos
      const conflicts = await checkReservationConflicts(data.room_id, inicio.toISOString(), fin.toISOString())
      if (conflicts.length > 0 && !editingReservation) {
        toast.error('Ya existe una reserva en ese horario')
        return
      }

      if (editingReservation) {
        // Actualizar reserva existente
        const updated = await updateReservation(editingReservation.id, {
          room_id: data.room_id,
          matricula: data.matricula,
          nombreCompleto: '',
          cantidadPersonas: data.cantidadPersonas,
          inicio: inicio.toISOString(),
          fin: fin.toISOString(),
        })

        if (updated) {
          toast.success('Reserva actualizada exitosamente')
          setIsEditDialogOpen(false)
          setEditingReservation(null)
          reset()
          loadData()
        } else {
          toast.error('Error al actualizar la reserva')
        }
      } else {
        // Crear nueva reserva
        const nuevaReserva = await createReservation(
          data.room_id,
          data.matricula,
          '',
          data.cantidadPersonas,
          inicio.toISOString(),
          fin.toISOString()
        )

        toast.success('Reserva creada exitosamente')
        setIsDialogOpen(false)
        reset()
        loadData()
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al procesar la reserva')
    }
  }

  const handleEdit = (reservation: Reservation) => {
    setEditingReservation(reservation)
    setValue('room_id', reservation.room_id)
    setValue('matricula', reservation.matricula || '')
    setValue('cantidadPersonas', reservation.cantidadPersonas || 1)
    setValue('horaInicio', getTimeFromDateTime(reservation.inicio))
    setValue('horaFin', getTimeFromDateTime(reservation.fin))
    setIsEditDialogOpen(true)
  }

  const handleCancel = async (reservationId: string) => {
    if (!confirm('¿Estás seguro de que deseas cancelar esta reserva?')) {
      return
    }

    try {
      await cancelReservation(reservationId)
      toast.success('Reserva cancelada exitosamente')
      loadData()
    } catch (error) {
      toast.error('Error al cancelar la reserva')
    }
  }

  const getRoomAvailability = (roomId: string) => {
    const now = new Date()
    const activeReservations = reservations.filter(r => 
      r.room_id === roomId && 
      r.status === 'active' &&
      new Date(r.inicio) <= now &&
      new Date(r.fin) >= now
    )
    return activeReservations.length === 0
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FFCD00] mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    )
  }

  const selectedRoomId = watch('room_id')
  const selectedRoom = rooms.find(r => r.id === selectedRoomId)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              <div className="relative w-16 h-16">
                <Image
                  src="/cetys-logo.jpg"
                  alt="CETYS Universidad"
                  fill
                  sizes="64px"
                  className="object-contain"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-black">
                  Panel de Administración
                </h1>
                <p className="text-sm text-gray-600">
                  Gestión de Reservas CETYS
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                variant="outline" 
                onClick={() => router.push('/admin-whitelist')}
                className="border-[#FFCD00] text-black hover:bg-[#FFCD00] px-6 py-2"
              >
                <Users className="h-4 w-4 mr-2" />
                Gestión de Estudiantes
              </Button>
              <Button 
                variant="outline" 
                onClick={handleSignOut}
                className="border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-2"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Cubículos
              </CardTitle>
              <MapPin className="h-4 w-4 text-[#FFCD00]" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-black">{rooms.length}</div>
              <p className="text-xs text-gray-500">
                Cubículos registrados
              </p>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Cubículos Disponibles
              </CardTitle>
              <div className="h-4 w-4 bg-[#22C55E] rounded-full"></div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#22C55E]">
                {rooms.filter(room => getRoomAvailability(room.id)).length}
              </div>
              <p className="text-xs text-gray-500">
                Disponibles ahora
              </p>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Reservas Activas
              </CardTitle>
              <Calendar className="h-4 w-4 text-[#FFCD00]" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-black">
                {reservations.filter(r => r.status === 'active').length}
              </div>
              <p className="text-xs text-gray-500">
                Reservas en curso
              </p>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Reservas
              </CardTitle>
              <FileText className="h-4 w-4 text-[#FFCD00]" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-black">{reservations.length}</div>
              <p className="text-xs text-gray-500">
                Todas las reservas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-black">Reservas</h2>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#FFCD00] hover:bg-[#E6B800] text-black">
                <Plus className="h-4 w-4 mr-2" />
                Nueva Reserva
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Nueva Reserva</DialogTitle>
                <DialogDescription>
                  Crear una nueva reserva de cubículo
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="room_id">Cubículo</Label>
                  <Select onValueChange={(value) => setValue('room_id', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un cubículo" />
                    </SelectTrigger>
                    <SelectContent>
                      {rooms.map((room) => (
                        <SelectItem key={room.id} value={room.id}>
                          {room.nombre} (Capacidad: {room.capacidad})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.room_id && (
                    <p className="text-sm text-red-600">{errors.room_id.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="matricula">Matrícula</Label>
                  <Input
                    id="matricula"
                    placeholder="Ej: 2024001234"
                    {...register('matricula')}
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
                    max={selectedRoom?.capacidad || 10}
                    placeholder="1"
                    {...register('cantidadPersonas', { valueAsNumber: true })}
                  />
                  {errors.cantidadPersonas && (
                    <p className="text-sm text-red-600">{errors.cantidadPersonas.message}</p>
                  )}
                  {selectedRoom && (
                    <p className="text-xs text-gray-500">
                      Capacidad máxima: {selectedRoom.capacidad} personas
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="horaInicio">Hora de Inicio</Label>
                    <Input
                      id="horaInicio"
                      type="time"
                      {...register('horaInicio')}
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
                    />
                    {errors.horaFin && (
                      <p className="text-sm text-red-600">{errors.horaFin.message}</p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false)
                      reset()
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-[#FFCD00] hover:bg-[#E6B800] text-black">
                    Crear Reserva
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Reservations Table */}
        <Card className="border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-black">Todas las Reservas</CardTitle>
            <CardDescription>
              Lista completa de reservas (activas y canceladas)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {reservations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No hay reservas registradas
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Cubículo</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Matrícula</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Nombre</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Personas</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Inicio</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Fin</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Estado</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reservations.map((reservation) => (
                      <tr key={reservation.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm text-gray-900">
                          {reservation.room?.nombre || 'N/A'}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-900">
                          {reservation.matricula || 'N/A'}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-900">
                          {reservation.matricula && studentNames[reservation.matricula] 
                            ? studentNames[reservation.matricula] 
                            : reservation.nombreCompleto || 'N/A'}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-900">
                          {reservation.cantidadPersonas || 'N/A'}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-900">
                          {formatDate(reservation.inicio)}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-900">
                          {formatDate(reservation.fin)}
                        </td>
                        <td className="py-3 px-4">
                          <Badge 
                            variant="secondary" 
                            className={
                              reservation.status === 'active' 
                                ? 'bg-[#DCFCE7] text-[#16A34A]' 
                                : 'bg-[#FEE2E2] text-[#DC2626]'
                            }
                          >
                            {reservation.status === 'active' ? 'Activa' : 'Cancelada'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-2">
                            {reservation.status === 'active' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(reservation)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Edit className="h-4 w-4 text-blue-600" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleCancel(reservation.id)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Reserva</DialogTitle>
              <DialogDescription>
                Modificar los datos de la reserva
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit_room_id">Cubículo</Label>
                <Select 
                  value={watch('room_id')} 
                  onValueChange={(value) => setValue('room_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un cubículo" />
                  </SelectTrigger>
                  <SelectContent>
                    {rooms.map((room) => (
                      <SelectItem key={room.id} value={room.id}>
                        {room.nombre} (Capacidad: {room.capacidad})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.room_id && (
                  <p className="text-sm text-red-600">{errors.room_id.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_matricula">Matrícula</Label>
                <Input
                  id="edit_matricula"
                  placeholder="Ej: 2024001234"
                  {...register('matricula')}
                  className="uppercase"
                />
                {errors.matricula && (
                  <p className="text-sm text-red-600">{errors.matricula.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_cantidadPersonas">Cantidad de Personas</Label>
                <Input
                  id="edit_cantidadPersonas"
                  type="number"
                  min="1"
                  max={selectedRoom?.capacidad || 10}
                  placeholder="1"
                  {...register('cantidadPersonas', { valueAsNumber: true })}
                />
                {errors.cantidadPersonas && (
                  <p className="text-sm text-red-600">{errors.cantidadPersonas.message}</p>
                )}
                {selectedRoom && (
                  <p className="text-xs text-gray-500">
                    Capacidad máxima: {selectedRoom.capacidad} personas
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_horaInicio">Hora de Inicio</Label>
                  <Input
                    id="edit_horaInicio"
                    type="time"
                    {...register('horaInicio')}
                  />
                  {errors.horaInicio && (
                    <p className="text-sm text-red-600">{errors.horaInicio.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit_horaFin">Hora de Fin</Label>
                  <Input
                    id="edit_horaFin"
                    type="time"
                    {...register('horaFin')}
                  />
                  {errors.horaFin && (
                    <p className="text-sm text-red-600">{errors.horaFin.message}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditDialogOpen(false)
                    setEditingReservation(null)
                    reset()
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" className="bg-[#FFCD00] hover:bg-[#E6B800] text-black">
                  Guardar Cambios
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
