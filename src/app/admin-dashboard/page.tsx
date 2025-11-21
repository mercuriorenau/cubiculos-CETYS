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

// Función para verificar si es domingo
const isSunday = () => {
  const hoy = new Date()
  return hoy.getDay() === 0 // 0 = domingo
}

export default function AdminDashboard() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [allReservations, setAllReservations] = useState<Reservation[]>([]) // Todas las reservas sin filtrar
  const [studentNames, setStudentNames] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null)
  const [fechaInicio, setFechaInicio] = useState<string>('')
  const [fechaFin, setFechaFin] = useState<string>('')
  const [selectedBlocks, setSelectedBlocks] = useState<number[]>([]) // Índices de bloques seleccionados
  const [selectedRoomId, setSelectedRoomId] = useState<string>('') // Cubículo seleccionado para el grid
  const [selectedReservations, setSelectedReservations] = useState<string[]>([]) // IDs de reservas seleccionadas para borrar
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

  const watchedRoomId = watch('room_id')

  useEffect(() => {
    loadData()
    
    // Actualizar estados de reservas cada minuto
    const interval = setInterval(() => {
      loadData()
    }, 60000) // 60 segundos
    
    return () => clearInterval(interval)
  }, [])

  const loadData = async () => {
    try {
      const roomsData = await getRooms()
      setRooms(roomsData)
      
      // Obtener todas las reservas (activas, canceladas y completadas) desde cubiculos
      // getAllReservations ya actualiza los estados automáticamente
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
      
      // Ordenar por fecha de creación descendente (más recientes primero)
      const sortedReservations = allReservations.sort((a, b) => {
        const dateA = new Date(a.created_at).getTime()
        const dateB = new Date(b.created_at).getTime()
        return dateB - dateA // Orden descendente
      })
      
      setAllReservations(sortedReservations)
      // Aplicar filtros iniciales
      if (fechaInicio || fechaFin) {
        applyFilters(sortedReservations)
      } else {
        setReservations(sortedReservations)
      }

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
      // Verificar que se hayan seleccionado bloques (solo para nuevas reservas)
      if (!editingReservation && selectedBlocks.length === 0) {
        toast.error('Por favor selecciona al menos un bloque horario')
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
        return
      }

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
          cantidadPersonas: 1, // Valor por defecto (ya no se usa pero se mantiene para compatibilidad)
          inicio: inicio.toISOString(),
          fin: fin.toISOString(),
        })

        if (updated) {
          toast.success('Reserva actualizada exitosamente')
          setIsEditDialogOpen(false)
          setEditingReservation(null)
          setSelectedBlocks([])
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
          1, // Valor por defecto (ya no se usa pero se mantiene para compatibilidad)
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

  const handleToggleReservation = (reservationId: string) => {
    setSelectedReservations(prev => 
      prev.includes(reservationId)
        ? prev.filter(id => id !== reservationId)
        : [...prev, reservationId]
    )
  }

  const handleSelectAll = () => {
    if (selectedReservations.length === reservations.length) {
      setSelectedReservations([])
    } else {
      setSelectedReservations(reservations.map(r => r.id))
    }
  }

  const handleDeleteSelected = async () => {
    if (selectedReservations.length === 0) {
      toast.error('No hay reservas seleccionadas')
      return
    }

    if (!confirm(`¿Estás seguro de que deseas eliminar ${selectedReservations.length} reserva(s)? Esta acción no se puede deshacer.`)) {
      return
    }

    try {
      const { deleteReservation } = await import('@/lib/cubiculos')
      for (const reservationId of selectedReservations) {
        // Eliminar de localStorage
        deleteReservation(reservationId)
      }
      toast.success(`${selectedReservations.length} reserva(s) eliminada(s) exitosamente`)
      setSelectedReservations([])
      loadData()
    } catch (error) {
      toast.error('Error al eliminar las reservas')
    }
  }

  // Aplicar filtros de fecha
  const applyFilters = (reservationsToFilter: Reservation[]) => {
    let filtered = [...reservationsToFilter]
    
    if (fechaInicio) {
      // Crear fecha de inicio del filtro al inicio del día (00:00:00)
      const inicioDate = new Date(fechaInicio + 'T00:00:00')
      filtered = filtered.filter(r => {
        // Incluir reservas que terminan en o después del día de inicio del filtro
        // Comparar solo las fechas (sin horas) para incluir todo el día
        const reservaFin = new Date(r.fin)
        const reservaFinDate = new Date(reservaFin.getFullYear(), reservaFin.getMonth(), reservaFin.getDate())
        const inicioDateOnly = new Date(inicioDate.getFullYear(), inicioDate.getMonth(), inicioDate.getDate())
        return reservaFinDate >= inicioDateOnly
      })
    }
    
    if (fechaFin) {
      // Crear fecha de fin del filtro al final del día (23:59:59.999)
      const finDate = new Date(fechaFin + 'T23:59:59.999')
      filtered = filtered.filter(r => {
        // Incluir reservas que empiezan en o antes del día de fin del filtro
        // Comparar solo las fechas (sin horas) para incluir todo el día
        const reservaInicio = new Date(r.inicio)
        const reservaInicioDate = new Date(reservaInicio.getFullYear(), reservaInicio.getMonth(), reservaInicio.getDate())
        const finDateOnly = new Date(finDate.getFullYear(), finDate.getMonth(), finDate.getDate())
        return reservaInicioDate <= finDateOnly
      })
    }
    
    setReservations(filtered)
  }

  // Efecto para aplicar filtros cuando cambian las fechas
  useEffect(() => {
    if (allReservations.length > 0) {
      applyFilters(allReservations)
    }
  }, [fechaInicio, fechaFin])

  // Limpiar selección cuando se abre/cierra el diálogo o cambia el cubículo
  useEffect(() => {
    if (isDialogOpen) {
      setSelectedBlocks([])
      setSelectedRoomId('')
      setValue('horaInicio', '')
      setValue('horaFin', '')
    }
  }, [isDialogOpen, setValue])

  // Actualizar selectedRoomId cuando cambia el cubículo seleccionado
  useEffect(() => {
    if (watchedRoomId) {
      setSelectedRoomId(watchedRoomId)
      setSelectedBlocks([])
      setValue('horaInicio', '')
      setValue('horaFin', '')
    }
  }, [watchedRoomId, setValue])

  // Función para exportar a CSV
  const handleExportCSV = async () => {
    try {
      const { getStudentByMatricula } = await import('@/lib/students')
      
      const headers = [
        'ID Reserva',
        'Cubículo',
        'Matrícula',
        'Nombre Estudiante',
        'Nivel',
        'Programa',
        'Departamento',
        'Estado Estudiante',
        'Fecha Inicio',
        'Hora Inicio',
        'Fecha Fin',
        'Hora Fin',
        'Duración',
        'Estado Reserva',
        'Fecha Creación'
      ]
      
      // Obtener información completa de estudiantes para todas las reservas
      const rows = await Promise.all(reservations.map(async r => {
        const inicioDate = new Date(r.inicio)
        const finDate = new Date(r.fin)
        const createdDate = new Date(r.created_at)
        
        // Obtener información completa del estudiante
        let studentInfo = {
          nivel: 'N/A',
          programa: 'N/A',
          departamento: 'N/A',
          estadoEstudiante: 'N/A'
        }
        
        if (r.matricula) {
          try {
            const student = await getStudentByMatricula(r.matricula)
            if (student) {
              studentInfo = {
                nivel: student.cve_nivel || 'N/A',
                programa: student.cve_programa || 'N/A',
                departamento: student.cve_departamento || 'N/A',
                estadoEstudiante: student.activo ? 'Activo' : 'Inactivo'
              }
            }
          } catch (error) {
            console.error(`Error obteniendo información del estudiante ${r.matricula}:`, error)
          }
        }
        
        // Calcular duración en horas y minutos
        const duracionMs = finDate.getTime() - inicioDate.getTime()
        const duracionMinutos = Math.floor(duracionMs / (1000 * 60))
        const horas = Math.floor(duracionMinutos / 60)
        const minutos = duracionMinutos % 60
        const duracionTexto = horas > 0 
          ? `${horas} hora${horas > 1 ? 's' : ''} ${minutos > 0 ? `${minutos} minuto${minutos > 1 ? 's' : ''}` : ''}`.trim()
          : `${minutos} minuto${minutos > 1 ? 's' : ''}`
        
        return [
          r.id,
          r.room?.nombre || 'N/A',
          r.matricula || 'N/A',
          (r.matricula && studentNames[r.matricula]) || r.nombreCompleto || 'N/A',
          studentInfo.nivel,
          studentInfo.programa,
          studentInfo.departamento,
          studentInfo.estadoEstudiante,
          inicioDate.toLocaleDateString('es-ES'),
          inicioDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
          finDate.toLocaleDateString('es-ES'),
          finDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
          duracionTexto,
          (() => {
            if (r.status === 'active') return 'Activa'
            if (r.status === 'cancelled') return 'Cancelada'
            // Si es "completed" pero la fecha de inicio es futura, es una reserva pendiente
            const now = new Date()
            const inicio = new Date(r.inicio)
            return inicio > now ? 'Pendiente' : 'Completada'
          })(),
          createdDate.toLocaleString('es-ES')
        ]
      }))

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n')

      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      
      const fechaInicioStr = fechaInicio ? `_desde_${fechaInicio}` : ''
      const fechaFinStr = fechaFin ? `_hasta_${fechaFin}` : ''
      link.setAttribute('download', `reservas${fechaInicioStr}${fechaFinStr}_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast.success(`Archivo exportado exitosamente (${reservations.length} reservas)`)
    } catch (error) {
      console.error('Error al exportar:', error)
      toast.error('Error al exportar el archivo')
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

  const selectedRoom = rooms.find(r => r.id === watchedRoomId)
  
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

  // Obtener reservas del cubículo seleccionado para verificar disponibilidad
  const getRoomReservations = (roomId: string): Reservation[] => {
    return allReservations.filter(r => r.room_id === roomId && r.status === 'active')
  }

  // Verificar si un bloque está disponible
  const isBlockAvailable = (blockIndex: number, roomId: string): boolean => {
    if (isSunday()) return false
    
    const hoy = new Date()
    const horaActual = hoy.getHours()
    const horaBloque = blockIndex + 7
    
    // No permitir bloques en el pasado
    if (horaBloque < horaActual) return false
    
    // Verificar conflictos con reservas existentes del cubículo
    const horaInicio = `${horaBloque.toString().padStart(2, '0')}:00`
    const horaFin = `${(horaBloque + 1).toString().padStart(2, '0')}:00`
    
    const hoyISO = hoy.toISOString().split('T')[0]
    const inicioISO = `${hoyISO}T${horaInicio}:00`
    const finISO = `${hoyISO}T${horaFin}:00`
    
    const roomReservations = getRoomReservations(roomId)
    
    // Verificar si hay reservas que se solapen con este bloque
    const hasConflict = roomReservations.some(reservation => {
      const resInicio = new Date(reservation.inicio)
      const resFin = new Date(reservation.fin)
      const blockInicio = new Date(inicioISO)
      const blockFin = new Date(finISO)
      
      // Verificar solapamiento
      return (blockInicio < resFin && blockFin > resInicio)
    })
    
    return !hasConflict
  }

  // Verificar si un bloque puede ser seleccionado
  const canSelectBlock = (blockIndex: number): boolean => {
    if (!selectedRoomId) return false
    if (!isBlockAvailable(blockIndex, selectedRoomId)) return false
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
    if (!selectedRoomId) return
    if (!isBlockAvailable(blockIndex, selectedRoomId)) return
    
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
                {reservations.filter(r => {
                  // Solo contar como "activas" las que están en su horario actual
                  if (r.status !== 'active') return false
                  const now = new Date()
                  const inicio = new Date(r.inicio)
                  const fin = new Date(r.fin)
                  return now >= inicio && now <= fin
                }).length}
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
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-2xl font-bold text-black">Reservas</h2>
          <div className="flex flex-wrap items-end gap-3">
            {/* Filtros de fecha */}
            <div className="flex gap-2 items-end">
              <div className="flex flex-col">
                <Label htmlFor="fechaInicio" className="text-xs text-gray-500 mb-1">Desde</Label>
                <Input
                  id="fechaInicio"
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="w-40"
                />
              </div>
              <div className="flex flex-col">
                <Label htmlFor="fechaFin" className="text-xs text-gray-500 mb-1">Hasta</Label>
                <Input
                  id="fechaFin"
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  className="w-40"
                />
              </div>
              {(fechaInicio || fechaFin) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFechaInicio('')
                    setFechaFin('')
                  }}
                >
                  Limpiar
                </Button>
              )}
            </div>
            {/* Botón exportar CSV */}
            <Button
              variant="outline"
              onClick={handleExportCSV}
              className="border-[#22C55E] text-[#22C55E] hover:bg-[#22C55E] hover:text-white"
              disabled={reservations.length === 0}
            >
              <FileText className="h-4 w-4 mr-2" />
              Exportar CSV ({reservations.length})
            </Button>
            {/* Botón borrar seleccionadas */}
            {selectedReservations.length > 0 && (
              <Button
                variant="outline"
                onClick={handleDeleteSelected}
                className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Borrar ({selectedReservations.length})
              </Button>
            )}
            {/* Botón nueva reserva */}
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


                {/* Grid de bloques horarios - solo se muestra si hay un cubículo seleccionado */}
                {selectedRoomId && (
                <div className="space-y-2">
                    <Label>Selecciona el horario (máximo 2 horas consecutivas)</Label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                      {generateTimeBlocks().map((block) => {
                        const isAvailable = isBlockAvailable(block.index, selectedRoomId)
                        const isSelected = selectedBlocks.includes(block.index)
                        const canSelect = canSelectBlock(block.index)

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
                            disabled={!canSelect}
                            className={`
                              w-full aspect-square flex items-center justify-center text-center
                              p-3 rounded-lg border-2 text-sm font-medium transition-all
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
                      <div className="mt-2 text-sm text-gray-700">
                        <p className="font-medium">Horario seleccionado:</p>
                        <p>
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
                    {(errors.horaInicio || errors.horaFin) && (
                      <p className="text-sm text-red-600">
                        {errors.horaInicio?.message || errors.horaFin?.message || 'Selecciona un horario válido.'}
                    </p>
                  )}
                    <p className="text-xs text-gray-500">
                      Los bloques disponibles están en verde. Selecciona máximo 2 bloques consecutivos.
                    </p>
                </div>
                )}

                {/* Campos ocultos para mantener compatibilidad con el formulario */}
                <input type="hidden" {...register('horaInicio')} />
                <input type="hidden" {...register('horaFin')} />

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
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 w-12">
                        <input
                          type="checkbox"
                          checked={selectedReservations.length === reservations.length && reservations.length > 0}
                          onChange={handleSelectAll}
                          className="w-4 h-4 text-[#22C55E] bg-gray-100 border-gray-300 rounded focus:ring-[#22C55E] focus:ring-2 cursor-pointer"
                        />
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Cubículo</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Matrícula</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Nombre</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Inicio</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Fin</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Estado</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reservations.map((reservation) => (
                      <tr key={reservation.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <input
                            type="checkbox"
                            checked={selectedReservations.includes(reservation.id)}
                            onChange={() => handleToggleReservation(reservation.id)}
                            className="w-4 h-4 text-[#22C55E] bg-gray-100 border-gray-300 rounded focus:ring-[#22C55E] focus:ring-2 cursor-pointer"
                          />
                        </td>
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
                                : reservation.status === 'cancelled'
                                  ? 'bg-[#FEE2E2] text-[#DC2626]'
                                  : (() => {
                                      // Si es "completed" pero la fecha de inicio es futura, es una reserva pendiente
                                      const now = new Date()
                                      const inicio = new Date(reservation.inicio)
                                      const isPending = inicio > now
                                      return isPending 
                                        ? 'bg-[#FEF3C7] text-[#D97706]' // Amarillo para pendiente
                                        : 'bg-[#E0E7FF] text-[#4F46E5]' // Azul para completada
                                    })()
                            }
                          >
                            {reservation.status === 'active' 
                              ? 'Activa' 
                              : reservation.status === 'cancelled' 
                                ? 'Cancelada' 
                                : (() => {
                                    // Si es "completed" pero la fecha de inicio es futura, mostrar "Pendiente"
                                    const now = new Date()
                                    const inicio = new Date(reservation.inicio)
                                    return inicio > now ? 'Pendiente' : 'Completada'
                                  })()}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-2">
                            {(() => {
                              // Solo mostrar acciones si la reserva está realmente activa (en su horario)
                              // o si es una reserva pendiente (futura)
                              if (reservation.status === 'cancelled') return null
                              
                              const now = new Date()
                              const inicio = new Date(reservation.inicio)
                              const fin = new Date(reservation.fin)
                              const isActive = reservation.status === 'active' && now >= inicio && now <= fin
                              const isPending = inicio > now // Reserva futura
                              
                              // Permitir editar/cancelar reservas activas o pendientes
                              if (isActive || isPending) {
                                return (
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
                                      title="Cancelar reserva"
                                >
                                      <X className="h-4 w-4 text-orange-600" />
                                </Button>
                              </>
                                )
                              }
                              return null
                            })()}
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
