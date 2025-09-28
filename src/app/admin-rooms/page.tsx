'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ArrowLeft, Plus, Edit, Trash2, MapPin, Users } from 'lucide-react'
import { toast } from 'sonner'

interface Room {
  id: string
  nombre: string
  descripcion?: string
  capacidad: number
  activo: boolean
  created_at: string
  updated_at: string
}

export default function AdminRoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingRoom, setEditingRoom] = useState<Room | null>(null)
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    capacidad: 1,
  })
  const router = useRouter()

  useEffect(() => {
    loadRooms()
  }, [])

  const loadRooms = async () => {
    try {
      // Mock data - replace with actual API call
      const mockData: Room[] = [
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
          nombre: 'Sala de Estudio A',
          descripcion: 'Sala para 4 personas con mesa grande',
          capacidad: 4,
          activo: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]
      setRooms(mockData)
    } catch (error) {
      toast.error('Error al cargar los cubículos')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingRoom) {
        // Update existing room
        const updatedRooms = rooms.map(room =>
          room.id === editingRoom.id
            ? { ...room, ...formData, updated_at: new Date().toISOString() }
            : room
        )
        setRooms(updatedRooms)
        toast.success('Cubículo actualizado exitosamente')
      } else {
        // Create new room
        const newRoom: Room = {
          id: Date.now().toString(),
          ...formData,
          activo: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        setRooms([...rooms, newRoom])
        toast.success('Cubículo creado exitosamente')
      }
      
      setIsDialogOpen(false)
      setEditingRoom(null)
      setFormData({ nombre: '', descripcion: '', capacidad: 1 })
    } catch (error) {
      toast.error('Error al guardar el cubículo')
    }
  }

  const handleEdit = (room: Room) => {
    setEditingRoom(room)
    setFormData({
      nombre: room.nombre,
      descripcion: room.descripcion || '',
      capacidad: room.capacidad,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (roomId: string) => {
    try {
      const updatedRooms = rooms.filter(room => room.id !== roomId)
      setRooms(updatedRooms)
      toast.success('Cubículo eliminado exitosamente')
    } catch (error) {
      toast.error('Error al eliminar el cubículo')
    }
  }

  const toggleActive = async (roomId: string) => {
    try {
      const updatedRooms = rooms.map(room =>
        room.id === roomId
          ? { ...room, activo: !room.activo, updated_at: new Date().toISOString() }
          : room
      )
      setRooms(updatedRooms)
      toast.success('Estado del cubículo actualizado')
    } catch (error) {
      toast.error('Error al actualizar el estado')
    }
  }

  const activeRooms = rooms.filter(room => room.activo)
  const inactiveRooms = rooms.filter(room => !room.activo)

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando cubículos...</p>
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
              Gestión de Cubículos
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
                Total Cubículos
              </CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{rooms.length}</div>
              <p className="text-xs text-muted-foreground">
                En el sistema
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Activos
              </CardTitle>
              <Badge variant="default">{activeRooms.length}</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeRooms.length}</div>
              <p className="text-xs text-muted-foreground">
                Disponibles para reserva
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Capacidad Total
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {activeRooms.reduce((sum, room) => sum + room.capacidad, 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Personas simultáneas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-lg font-semibold text-gray-900">
            Lista de Cubículos
          </h2>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingRoom(null)
                setFormData({ nombre: '', descripcion: '', capacidad: 1 })
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Cubículo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingRoom ? 'Editar Cubículo' : 'Nuevo Cubículo'}
                </DialogTitle>
                <DialogDescription>
                  {editingRoom 
                    ? 'Modifica la información del cubículo' 
                    : 'Agrega un nuevo cubículo al sistema'
                  }
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Ej: Cubículo 1"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descripcion">Descripción</Label>
                  <Input
                    id="descripcion"
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    placeholder="Descripción del cubículo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capacidad">Capacidad</Label>
                  <Input
                    id="capacidad"
                    type="number"
                    min="1"
                    max="10"
                    value={formData.capacidad}
                    onChange={(e) => setFormData({ ...formData, capacidad: parseInt(e.target.value) })}
                    required
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingRoom ? 'Actualizar' : 'Crear'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Rooms Table */}
        <Card>
          <CardContent className="p-0">
            {rooms.length === 0 ? (
              <div className="text-center py-12">
                <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No hay cubículos
                </h3>
                <p className="text-gray-600 mb-4">
                  Comienza agregando el primer cubículo.
                </p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Cubículo
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Capacidad</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Última Actualización</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rooms.map((room) => (
                    <TableRow key={room.id}>
                      <TableCell className="font-medium">
                        {room.nombre}
                      </TableCell>
                      <TableCell>
                        {room.descripcion || 'Sin descripción'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1 text-gray-400" />
                          {room.capacidad} persona{room.capacidad > 1 ? 's' : ''}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={room.activo ? 'default' : 'secondary'}>
                          {room.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(room.updated_at).toLocaleDateString('es-ES')}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEdit(room)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => toggleActive(room.id)}
                            className={room.activo ? 'text-orange-600' : 'text-green-600'}
                          >
                            {room.activo ? 'Desactivar' : 'Activar'}
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDelete(room.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
