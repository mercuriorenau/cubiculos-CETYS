'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getRooms, getUserReservations } from '@/lib/reservations'
import { Room, Reservation } from '@/lib/reservations'
import { Calendar, Clock, MapPin, LogOut, Plus, Users, Settings, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { CETYS_CLASSES } from '@/lib/cetys-colors'
import Image from 'next/image'

export default function AdminDashboard() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const loadData = async () => {
      try {
        const [roomsData, reservationsData] = await Promise.all([
          getRooms(),
          getUserReservations()
        ])

        setRooms(roomsData)
        setReservations(reservationsData.filter(r => r.status === 'active'))
      } catch (error) {
        toast.error('Error al cargar los datos')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  const handleSignOut = async () => {
    try {
      // Simular logout de admin
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
      hour: '2-digit',
      minute: '2-digit'
    })
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
                  className="object-contain"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-black">
                  Panel de Administración
                </h1>
                <p className="text-sm text-gray-600">
                  Sistema de reservas CETYS
                </p>
              </div>
            </div>
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
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions */}
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Button
              onClick={() => router.push('/admin-whitelist')}
              className="h-16 bg-[#FFCD00] hover:bg-[#E6B800] text-black"
            >
              <Users className="h-5 w-5 mr-2" />
              Gestión de Estudiantes
            </Button>
            <Button
              onClick={() => router.push('/admin-rooms')}
              className="h-16 bg-black hover:bg-gray-800 text-white"
            >
              <MapPin className="h-5 w-5 mr-2" />
              Gestión de Cubículos
            </Button>
            <Button
              onClick={() => router.push('/admin-blackouts')}
              className="h-16 bg-[#FFCD00] hover:bg-[#E6B800] text-black"
            >
              <Calendar className="h-5 w-5 mr-2" />
              Horarios y Cierres
            </Button>
            <Button
              onClick={() => router.push('/reservations')}
              className="h-16 bg-black hover:bg-gray-800 text-white"
            >
              <FileText className="h-5 w-5 mr-2" />
              Ver Todas las Reservas
            </Button>
          </div>
        </div>

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
                Cubículos Ocupados
              </CardTitle>
              <div className="h-4 w-4 bg-[#EF4444] rounded-full"></div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#EF4444]">
                {rooms.filter(room => !getRoomAvailability(room.id)).length}
              </div>
              <p className="text-xs text-gray-500">
                Ocupados ahora
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
              <div className="text-3xl font-bold text-black">{reservations.length}</div>
              <p className="text-xs text-gray-500">
                Reservas en curso
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Reservations */}
        {reservations.length > 0 && (
          <Card className="mb-8 border-[#FFCD00]">
            <CardHeader>
              <CardTitle className="text-black">Reservas Recientes</CardTitle>
              <CardDescription>
                Últimas reservas creadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reservations.slice(0, 5).map((reservation) => (
                  <div key={reservation.id} className="flex items-center justify-between p-4 border border-[#FFCD00] rounded-lg bg-[#FFF4B3]">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <MapPin className="h-5 w-5 text-[#FFCD00]" />
                      </div>
                      <div>
                        <p className="font-medium text-black">{reservation.room?.nombre}</p>
                        <p className="text-sm text-gray-600">
                          {formatDate(reservation.inicio)} - {formatDate(reservation.fin)}
                        </p>
                        <p className="text-sm text-gray-600">
                          Matrícula: {(reservation as any).matricula || 'N/A'}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-[#FFCD00] text-black">
                      {reservation.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Room Status Overview */}
        <Card className="border-[#FFCD00]">
          <CardHeader>
            <CardTitle className="text-black">Estado de Cubículos</CardTitle>
            <CardDescription>
              Vista general de disponibilidad
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {rooms.map((room) => {
                const isAvailable = getRoomAvailability(room.id)
                const isLargeRoom = room.capacidad > 1
                
                return (
                  <div
                    key={room.id}
                    className={`p-4 border-2 rounded-lg transition-colors ${
                      isAvailable 
                        ? 'border-[#22C55E] bg-[#DCFCE7] hover:bg-[#BBF7D0]' 
                        : 'border-[#EF4444] bg-[#FEE2E2] hover:bg-[#FECACA]'
                    } ${isLargeRoom ? 'md:col-span-2' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-black">{room.nombre}</h3>
                      <div className={`h-3 w-3 rounded-full ${
                        isAvailable ? 'bg-[#22C55E]' : 'bg-[#EF4444]'
                      }`}></div>
                    </div>
                    {room.descripcion && (
                      <p className="text-sm text-gray-600 mb-2">{room.descripcion}</p>
                    )}
                    <div className="flex items-center text-sm text-gray-500 mb-2">
                      <Users className="h-4 w-4 mr-1" />
                      Capacidad: {room.capacidad} persona{room.capacidad > 1 ? 's' : ''}
                    </div>
                    <Badge 
                      variant="secondary" 
                      className={`${
                        isAvailable 
                          ? 'bg-[#DCFCE7] text-[#16A34A]' 
                          : 'bg-[#FEE2E2] text-[#DC2626]'
                      }`}
                    >
                      {isAvailable ? 'Disponible' : 'Ocupado'}
                    </Badge>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}