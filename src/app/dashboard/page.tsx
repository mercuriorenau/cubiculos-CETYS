'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getCurrentUser, signOut } from '@/lib/auth'
import { getRooms, getUserReservations } from '@/lib/reservations'
import { Room, Reservation } from '@/lib/reservations'
import { Calendar, Clock, MapPin, LogOut, Plus } from 'lucide-react'
import { toast } from 'sonner'

export default function HomePage() {
  const [user, setUser] = useState<any>(null)
  const [rooms, setRooms] = useState<Room[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const loadData = async () => {
      try {
        const currentUser = await getCurrentUser()
        if (!currentUser) {
          router.push('/login')
          return
        }

        if (!currentUser.verified) {
          router.push('/onboarding')
          return
        }

        setUser(currentUser)

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
  }, [router])

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/login')
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Reserva de Cubículos
              </h1>
              <p className="text-sm text-gray-600">
                Bienvenido, {user?.email}
              </p>
            </div>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              onClick={() => router.push('/rooms')}
              className="flex-1"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nueva Reserva
            </Button>
            <Button 
              variant="outline"
              onClick={() => router.push('/reservations')}
              className="flex-1"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Mis Reservas
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Cubículos Disponibles
              </CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{rooms.length}</div>
              <p className="text-xs text-muted-foreground">
                Total de cubículos activos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Reservas Activas
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reservations.length}</div>
              <p className="text-xs text-muted-foreground">
                Tus reservas actuales
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Estado
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Badge variant="default" className="text-sm">
                Verificado
              </Badge>
              <p className="text-xs text-muted-foreground mt-1">
                Puedes hacer reservas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Reservations */}
        {reservations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Próximas Reservas</CardTitle>
              <CardDescription>
                Tus reservas más próximas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reservations.slice(0, 3).map((reservation) => (
                  <div key={reservation.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <MapPin className="h-5 w-5 text-gray-400" />
                      </div>
                      <div>
                        <p className="font-medium">{reservation.room?.nombre}</p>
                        <p className="text-sm text-gray-600">
                          {formatDate(reservation.inicio)} - {formatDate(reservation.fin)}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">
                      {reservation.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Available Rooms */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Cubículos Disponibles</CardTitle>
            <CardDescription>
              Haz clic en un cubículo para ver disponibilidad
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rooms.map((room) => (
                <div 
                  key={room.id} 
                  className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => router.push(`/rooms/${room.id}`)}
                >
                  <h3 className="font-medium">{room.nombre}</h3>
                  {room.descripcion && (
                    <p className="text-sm text-gray-600 mt-1">{room.descripcion}</p>
                  )}
                  <p className="text-sm text-gray-500 mt-2">
                    Capacidad: {room.capacidad} persona{room.capacidad > 1 ? 's' : ''}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
