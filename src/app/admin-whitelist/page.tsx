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
import { ArrowLeft, Upload, Download, Search, Plus, X, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface WhitelistEntry {
  id: string
  matricula: string
  nombre?: string
  activo: boolean
  created_at: string
  updated_at: string
}

interface DryRunResult {
  toInsert: Array<{ matricula: string; nombre?: string }>
  toUpdate: Array<{ id: string; matricula: string; nombre?: string }>
  toDeactivate: Array<{ id: string; matricula: string }>
  errors: string[]
}

export default function WhitelistPage() {
  const [entries, setEntries] = useState<WhitelistEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [dryRunResult, setDryRunResult] = useState<DryRunResult | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const router = useRouter()

  useEffect(() => {
    loadWhitelist()
  }, [])

  const loadWhitelist = async () => {
    try {
      // This would be replaced with actual API call
      // For now, using mock data
      const mockData: WhitelistEntry[] = [
        {
          id: '1',
          matricula: '2024001234',
          nombre: 'Juan Pérez García',
          activo: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: '2',
          matricula: '2024001235',
          nombre: 'María López Rodríguez',
          activo: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]
      setEntries(mockData)
    } catch (error) {
      toast.error('Error al cargar la lista de matrículas')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = async (file: File) => {
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      // Call dry-run Edge Function
      const response = await fetch('/api/whitelist/dryrun', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Error en el procesamiento del archivo')
      }

      const result = await response.json()
      setDryRunResult(result)
      setIsDialogOpen(true)
    } catch (error) {
      toast.error('Error al procesar el archivo')
    } finally {
      setIsUploading(false)
    }
  }

  const applyChanges = async () => {
    if (!dryRunResult) return

    try {
      const response = await fetch('/api/whitelist/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...dryRunResult,
          mode: 'full-sync',
        }),
      })

      if (!response.ok) {
        throw new Error('Error al aplicar los cambios')
      }

      toast.success('Cambios aplicados exitosamente')
      setIsDialogOpen(false)
      setDryRunResult(null)
      loadWhitelist()
    } catch (error) {
      toast.error('Error al aplicar los cambios')
    }
  }

  const filteredEntries = entries.filter(entry =>
    entry.matricula.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const activeEntries = filteredEntries.filter(entry => entry.activo)
  const inactiveEntries = filteredEntries.filter(entry => !entry.activo)

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando lista de matrículas...</p>
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
              Gestión de Matrículas
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
                Total Matrículas
              </CardTitle>
              <Badge variant="outline">{entries.length}</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{entries.length}</div>
              <p className="text-xs text-muted-foreground">
                En la base de datos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Activas
              </CardTitle>
              <Badge variant="default">{activeEntries.length}</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeEntries.length}</div>
              <p className="text-xs text-muted-foreground">
                Pueden reservar
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Inactivas
              </CardTitle>
              <Badge variant="secondary">{inactiveEntries.length}</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inactiveEntries.length}</div>
              <p className="text-xs text-muted-foreground">
                Bloqueadas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por matrícula o nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Upload className="h-4 w-4 mr-2" />
                  Subir Archivo
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Subir Lista de Matrículas</DialogTitle>
                  <DialogDescription>
                    Selecciona un archivo Excel (.xlsx) o CSV (.csv) con las matrículas
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="file">Archivo</Label>
                    <Input
                      id="file"
                      type="file"
                      accept=".xlsx,.csv"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          setSelectedFile(file)
                        }
                      }}
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline">Cancelar</Button>
                    <Button 
                      onClick={() => selectedFile && handleFileUpload(selectedFile)}
                      disabled={!selectedFile || isUploading}
                    >
                      {isUploading ? 'Procesando...' : 'Procesar'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Dry Run Results Dialog */}
        {dryRunResult && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Vista Previa de Cambios</DialogTitle>
                <DialogDescription>
                  Revisa los cambios antes de aplicarlos a la base de datos
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Summary */}
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-2xl font-bold text-green-600">
                        {dryRunResult.toInsert.length}
                      </div>
                      <p className="text-sm text-gray-600">Nuevas matrículas</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-2xl font-bold text-blue-600">
                        {dryRunResult.toUpdate.length}
                      </div>
                      <p className="text-sm text-gray-600">Actualizaciones</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-2xl font-bold text-orange-600">
                        {dryRunResult.toDeactivate.length}
                      </div>
                      <p className="text-sm text-gray-600">Desactivaciones</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Details */}
                {dryRunResult.toInsert.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Nuevas Matrículas</h4>
                    <div className="max-h-32 overflow-y-auto">
                      {dryRunResult.toInsert.map((item, index) => (
                        <div key={index} className="text-sm text-gray-600 py-1">
                          {item.matricula} - {item.nombre || 'Sin nombre'}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {dryRunResult.errors.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2 text-red-600">Errores</h4>
                    <div className="max-h-32 overflow-y-auto">
                      {dryRunResult.errors.map((error, index) => (
                        <div key={index} className="text-sm text-red-600 py-1">
                          {error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={applyChanges}>
                    Aplicar Cambios
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Whitelist Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Matrículas</CardTitle>
            <CardDescription>
              Gestión de estudiantes autorizados para reservar cubículos
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredEntries.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No se encontraron matrículas
                </h3>
                <p className="text-gray-600">
                  {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Sube un archivo para comenzar'}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Matrícula</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Última Actualización</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">
                        {entry.matricula}
                      </TableCell>
                      <TableCell>
                        {entry.nombre || 'Sin nombre'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={entry.activo ? 'default' : 'secondary'}>
                          {entry.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(entry.updated_at).toLocaleDateString('es-ES')}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            Editar
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className={entry.activo ? 'text-red-600' : 'text-green-600'}
                          >
                            {entry.activo ? 'Desactivar' : 'Activar'}
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
