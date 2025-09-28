'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { getUserReservations, cancelReservation } from '@/lib/reservations'
import { Reservation } from '@/lib/reservations'
import { ArrowLeft, Calendar, Clock, MapPin, X, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const loadReservations = async () => {
      try {
        const reservationsData = await getUserReservations()
        setReservations(reservationsData)
      } catch (error) {
        toast.error('Error al cargar las reservas')
      } finally {
        setIsLoading(false)
      }
    }

    loadReservations()
  }, [])

  const handleCancelReservation = async (reservationId: string) => {
    setCancellingId(reservationId)
    try {
      await cancelReservation(reservationId)
      toast.success('Reserva cancelada exitosamente')
      
      // Update local state
      setReservations(prev => 
        prev.map(r => 
          r.id === reservationId 
            ? { ...r, status: 'cancelled' as const }
            : r
        )
      )
    } catch (error) {
      toast.error('Error al cancelar la reserva')
    } finally {
      setCancellingId(null)
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'default'
      case 'cancelled':
        return 'destructive'
      case 'completed':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Activa'
      case 'cancelled':
        return 'Cancelada'
      case 'completed':
        return 'Completada'
      default:
        return status
    }
  }

  const activeReservations = reservations.filter(r => r.status === 'active')
  const pastReservations = reservations.filter(r => r.status !== 'active')

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando reservas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Button 
              variant="ghost" 
              onClick={() => router.back()}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <h1 className="text-xl font-semibold text-gray-900">
              Mis Reservas
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Reservas Activas
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeReservations.length}</div>
              <p className="text-xs text-muted-foreground">
                Reservas pendientes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Reservas
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reservations.length}</div>
              <p className="text-xs text-muted-foreground">
                Todas las reservas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Próxima Reserva
              </CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {activeReservations.length > 0 ? '1' : '0'}
              </div>
              <p className="text-xs text-muted-foreground">
                Reservas próximas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Active Reservations */}
        {activeReservations.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Reservas Activas</CardTitle>
              <CardDescription>
                Tus reservas pendientes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeReservations.map((reservation) => (
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
                        <p className="text-xs text-gray-500">
                          Creada: {formatDate(reservation.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={getStatusColor(reservation.status)}>
                        {getStatusText(reservation.status)}
                      </Badge>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            disabled={cancellingId === reservation.id}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Cancelar
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Cancelar Reserva</DialogTitle>
                            <DialogDescription>
                              ¿Estás seguro de que quieres cancelar esta reserva?
                              <br />
                              <br />
                              <strong>{reservation.room?.nombre}</strong>
                              <br />
                              {formatDate(reservation.inicio)} - {formatDate(reservation.fin)}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="flex justify-end space-x-2">
                            <Button variant="outline">
                              No, mantener
                            </Button>
                            <Button 
                              variant="destructive"
                              onClick={() => handleCancelReservation(reservation.id)}
                              disabled={cancellingId === reservation.id}
                            >
                              {cancellingId === reservation.id ? 'Cancelando...' : 'Sí, cancelar'}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Past Reservations */}
        {pastReservations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Historial de Reservas</CardTitle>
              <CardDescription>
                Reservas anteriores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pastReservations.map((reservation) => (
                  <div key={reservation.id} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <Calendar className="h-5 w-5 text-gray-400" />
                      </div>
                      <div>
                        <p className="font-medium">{reservation.room?.nombre}</p>
                        <p className="text-sm text-gray-600">
                          {formatDate(reservation.inicio)} - {formatDate(reservation.fin)}
                        </p>
                        <p className="text-xs text-gray-500">
                          Creada: {formatDate(reservation.created_at)}
                        </p>
                      </div>
                    </div>
                    <Badge variant={getStatusColor(reservation.status)}>
                      {getStatusText(reservation.status)}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {reservations.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No tienes reservas
              </h3>
              <p className="text-gray-600 mb-4">
                Comienza reservando un cubículo disponible.
              </p>
              <Button onClick={() => router.push('/rooms')}>
                Ver Cubículos Disponibles
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
