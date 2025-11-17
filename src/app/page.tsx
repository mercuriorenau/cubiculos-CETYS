'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getRooms, getUserReservations } from '@/lib/reservations'
import { Room, Reservation } from '@/lib/reservations'
import { Users, MapPin, Calendar, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { CETYS_CLASSES } from '@/lib/cetys-colors'
import Image from 'next/image'

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

// Función para obtener el estado actual de la biblioteca
const getLibraryStatus = () => {
  const hoy = new Date()
  const horaActual = hoy.getHours()
  
  if (isSunday()) {
    return {
      isOpen: false,
      message: "Cerrado - Domingo",
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200"
    }
  }
  
  if (horaActual >= 7 && horaActual < 21) {
    return {
      isOpen: true,
      message: "Abierto",
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200"
    }
  } else {
    return {
      isOpen: false,
      message: "Cerrado",
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200"
    }
  }
}

export default function StudentView() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [configError, setConfigError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const loadData = async () => {
      try {
        // Obtener cubículos (síncrono) y reservas (asíncrono)
        const roomsData = getRooms()
        const reservationsData = await getUserReservations()

        setRooms(roomsData)
        setReservations(reservationsData.filter(r => r.status === 'active'))
      } catch (error: any) {
        if (error.message?.includes('Supabase no configurado')) {
          setConfigError('Supabase no está configurado correctamente')
        } else {
          toast.error('Error al cargar los datos')
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

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
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FFCD00] mx-auto"></div>
          <p className="mt-2 text-black">Cargando cubículos...</p>
        </div>
      </div>
    )
  }

  if (configError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="max-w-md w-full">
          <Card className="border-red-200 shadow-lg">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <Calendar className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-xl text-red-600">Configuración Requerida</CardTitle>
              <CardDescription className="text-gray-600">
                {configError}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-800 mb-2">Pasos para configurar:</h4>
                <ol className="text-sm text-yellow-700 space-y-1">
                  <li>1. Ve a tu panel de Supabase</li>
                  <li>2. Obtén las claves de API</li>
                  <li>3. Reemplaza los valores en el archivo <code className="bg-yellow-100 px-1 rounded">.env</code></li>
                  <li>4. Reinicia el servidor</li>
                </ol>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <p className="text-sm text-gray-600">
                  <strong>Archivo .env:</strong>
                </p>
                <code className="text-xs text-gray-500 block mt-1">
                  NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_real<br/>
                  SUPABASE_SERVICE_ROLE_KEY=tu_clave_real
                </code>
              </div>
              <Button 
                onClick={() => window.location.reload()} 
                className="w-full bg-[#FFCD00] hover:bg-[#E6B800] text-black"
              >
                Reintentar
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const availableRooms = rooms.filter(room => getRoomAvailability(room.id))
  const occupiedRooms = rooms.filter(room => !getRoomAvailability(room.id))

  return (
    <div className="min-h-screen bg-white">
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
                  Reserva de Cubículos
                </h1>
                <p className="text-sm text-gray-600">
                  Sistema de reservas CETYS
                </p>
              </div>
            </div>
            <Button 
              variant="outline"
              onClick={() => router.push('/admin-login')}
              className="border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-2"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Panel Admin
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Disponibles
              </CardTitle>
              <div className="h-4 w-4 bg-[#22C55E] rounded-full"></div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#22C55E]">{availableRooms.length}</div>
              <p className="text-xs text-gray-500">
                Cubículos libres
              </p>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Ocupados
              </CardTitle>
              <div className="h-4 w-4 bg-[#EF4444] rounded-full"></div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#EF4444]">{occupiedRooms.length}</div>
              <p className="text-xs text-gray-500">
                Cubículos ocupados
              </p>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Estado Biblioteca
              </CardTitle>
              <Clock className="h-4 w-4 text-[#FFCD00]" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getLibraryStatus().color}`}>
                {getLibraryStatus().message}
              </div>
              <p className="text-xs text-gray-500">
                7:00 AM - 9:00 PM (L-S) | Dom: Cerrado
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Cubículos */}
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="bg-gray-50 rounded-t-lg">
            <CardTitle className="text-xl font-semibold text-black">Cubículos de Estudio</CardTitle>
            <CardDescription className="text-gray-600">
              Haz clic en un cubículo disponible para hacer una reserva
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {rooms.map((room) => {
                const isAvailable = getRoomAvailability(room.id)
                const isLargeRoom = room.capacidad > 1
                
                return (
                  <div 
                    key={room.id} 
                    className={`p-4 border-2 rounded-xl transition-all duration-200 hover:shadow-md ${
                      isAvailable 
                        ? 'border-[#22C55E] bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 cursor-pointer' 
                        : 'border-[#EF4444] bg-gradient-to-br from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 cursor-not-allowed opacity-75'
                    } ${isLargeRoom ? 'md:col-span-2' : ''}`}
                    onClick={() => isAvailable ? router.push(`/rooms/${room.id}`) : null}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-black text-lg">{room.nombre}</h3>
                      <div className={`h-4 w-4 rounded-full ${
                        isAvailable ? 'bg-[#22C55E]' : 'bg-[#EF4444]'
                      }`}></div>
                    </div>
                    
                    {room.descripcion && (
                      <p className="text-sm text-gray-600 mb-3 leading-relaxed">{room.descripcion}</p>
                    )}
                    
                    <div className="flex items-center text-sm text-gray-500 mb-3">
                      <Users className="h-4 w-4 mr-2" />
                      <span className="font-medium">{room.capacidad} persona{room.capacidad > 1 ? 's' : ''}</span>
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