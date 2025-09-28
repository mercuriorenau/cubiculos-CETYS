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
import { ArrowLeft, Plus, Edit, Trash2, Calendar, Clock } from 'lucide-react'
import { toast } from 'sonner'

interface Blackout {
  id: string
  titulo: string
  descripcion?: string
  inicio: string
  fin: string
  activo: boolean
  created_at: string
  updated_at: string
}

export default function AdminBlackoutsPage() {
  const [blackouts, setBlackouts] = useState<Blackout[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingBlackout, setEditingBlackout] = useState<Blackout | null>(null)
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    inicio: '',
    fin: '',
  })
  const router = useRouter()

  useEffect(() => {
    loadBlackouts()
  }, [])

  const loadBlackouts = async () => {
    try {
      // Mock data - replace with actual API call
      const mockData: Blackout[] = [
        {
          id: '1',
          titulo: 'Mantenimiento General',
          descripcion: 'Mantenimiento programado de la biblioteca',
          inicio: '2024-12-25T00:00:00Z',
          fin: '2024-12-25T23:59:59Z',
          activo: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: '2',
          titulo: 'Día de Navidad',
          descripcion: 'Biblioteca cerrada por festividad',
          inicio: '2024-12-24T00:00:00Z',
          fin: '2024-12-24T23:59:59Z',
          activo: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]
      setBlackouts(mockData)
    } catch (error) {
      toast.error('Error al cargar los cierres')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingBlackout) {
        // Update existing blackout
        const updatedBlackouts = blackouts.map(blackout =>
          blackout.id === editingBlackout.id
            ? { ...blackout, ...formData, updated_at: new Date().toISOString() }
            : blackout
        )
        setBlackouts(updatedBlackouts)
        toast.success('Cierre actualizado exitosamente')
      } else {
        // Create new blackout
        const newBlackout: Blackout = {
          id: Date.now().toString(),
          ...formData,
          activo: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        setBlackouts([...blackouts, newBlackout])
        toast.success('Cierre creado exitosamente')
      }
      
      setIsDialogOpen(false)
      setEditingBlackout(null)
      setFormData({ titulo: '', descripcion: '', inicio: '', fin: '' })
    } catch (error) {
      toast.error('Error al guardar el cierre')
    }
  }

  const handleEdit = (blackout: Blackout) => {
    setEditingBlackout(blackout)
    setFormData({
      titulo: blackout.titulo,
      descripcion: blackout.descripcion || '',
      inicio: blackout.inicio.slice(0, 16), // Convert to datetime-local format
      fin: blackout.fin.slice(0, 16),
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (blackoutId: string) => {
    try {
      const updatedBlackouts = blackouts.filter(blackout => blackout.id !== blackoutId)
      setBlackouts(updatedBlackouts)
      toast.success('Cierre eliminado exitosamente')
    } catch (error) {
      toast.error('Error al eliminar el cierre')
    }
  }

  const toggleActive = async (blackoutId: string) => {
    try {
      const updatedBlackouts = blackouts.map(blackout =>
        blackout.id === blackoutId
          ? { ...blackout, activo: !blackout.activo, updated_at: new Date().toISOString() }
          : blackout
      )
      setBlackouts(updatedBlackouts)
      toast.success('Estado del cierre actualizado')
    } catch (error) {
      toast.error('Error al actualizar el estado')
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

  const activeBlackouts = blackouts.filter(blackout => blackout.activo)
  const inactiveBlackouts = blackouts.filter(blackout => !blackout.activo)

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando cierres...</p>
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
              Gestión de Cierres
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
                Total Cierres
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{blackouts.length}</div>
              <p className="text-xs text-muted-foreground">
                Programados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Activos
              </CardTitle>
              <Badge variant="default">{activeBlackouts.length}</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeBlackouts.length}</div>
              <p className="text-xs text-muted-foreground">
                Bloqueando reservas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Próximo Cierre
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {activeBlackouts.length > 0 ? '1' : '0'}
              </div>
              <p className="text-xs text-muted-foreground">
                En las próximas 24h
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-lg font-semibold text-gray-900">
            Lista de Cierres
          </h2>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingBlackout(null)
                setFormData({ titulo: '', descripcion: '', inicio: '', fin: '' })
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Cierre
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingBlackout ? 'Editar Cierre' : 'Nuevo Cierre'}
                </DialogTitle>
                <DialogDescription>
                  {editingBlackout 
                    ? 'Modifica la información del cierre' 
                    : 'Programa un nuevo cierre de biblioteca'
                  }
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="titulo">Título</Label>
                  <Input
                    id="titulo"
                    value={formData.titulo}
                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                    placeholder="Ej: Mantenimiento General"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descripcion">Descripción</Label>
                  <Input
                    id="descripcion"
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    placeholder="Descripción del cierre"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="inicio">Fecha y Hora de Inicio</Label>
                    <Input
                      id="inicio"
                      type="datetime-local"
                      value={formData.inicio}
                      onChange={(e) => setFormData({ ...formData, inicio: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fin">Fecha y Hora de Fin</Label>
                    <Input
                      id="fin"
                      type="datetime-local"
                      value={formData.fin}
                      onChange={(e) => setFormData({ ...formData, fin: e.target.value })}
                      required
                    />
                  </div>
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
                    {editingBlackout ? 'Actualizar' : 'Crear'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Blackouts Table */}
        <Card>
          <CardContent className="p-0">
            {blackouts.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No hay cierres programados
                </h3>
                <p className="text-gray-600 mb-4">
                  Comienza programando el primer cierre.
                </p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Programar Cierre
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Inicio</TableHead>
                    <TableHead>Fin</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Última Actualización</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {blackouts.map((blackout) => (
                    <TableRow key={blackout.id}>
                      <TableCell className="font-medium">
                        {blackout.titulo}
                      </TableCell>
                      <TableCell>
                        {blackout.descripcion || 'Sin descripción'}
                      </TableCell>
                      <TableCell>
                        {formatDate(blackout.inicio)}
                      </TableCell>
                      <TableCell>
                        {formatDate(blackout.fin)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={blackout.activo ? 'default' : 'secondary'}>
                          {blackout.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(blackout.updated_at).toLocaleDateString('es-ES')}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEdit(blackout)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => toggleActive(blackout.id)}
                            className={blackout.activo ? 'text-orange-600' : 'text-green-600'}
                          >
                            {blackout.activo ? 'Desactivar' : 'Activar'}
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDelete(blackout.id)}
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
