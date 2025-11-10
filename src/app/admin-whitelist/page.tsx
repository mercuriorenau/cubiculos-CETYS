'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AdminAuthGuard } from '@/components/admin-auth-guard'
import { ArrowLeft, Upload, Download, Search, Plus, X, AlertCircle, Edit, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'

interface Student {
  matricula: number
  nombre_abr?: string
  cve_nivel?: string
  cve_programa?: string
  cve_departamento?: string
  activo: boolean
}

interface ProcessFileResult {
  toInsert: Array<{ matricula: string | number; nombre_abr?: string; nombre?: string }>
  toUpdate: Array<{ matricula: number; updates: any }>
  toDeactivate: Array<{ matricula: number }>
  errors: string[]
}

const studentSchema = z.object({
  matricula: z.string().min(1, 'La matrícula es requerida'),
  nombre_abr: z.string().optional(),
  cve_nivel: z.string().optional(),
  cve_programa: z.string().optional(),
  cve_departamento: z.string().optional(),
  activo: z.boolean().optional(),
})

type StudentForm = z.infer<typeof studentSchema>

export default function WhitelistPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [minMatricula, setMinMatricula] = useState<string>('')
  const [maxMatricula, setMaxMatricula] = useState<string>('')
  const [selectedStudents, setSelectedStudents] = useState<number[]>([])
  const [dryRunResult, setDryRunResult] = useState<ProcessFileResult | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue
  } = useForm<StudentForm>({
    resolver: zodResolver(studentSchema),
  })

  useEffect(() => {
    loadStudents()
  }, [])

  const loadStudents = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/students')
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al cargar estudiantes')
      }
      const result = await response.json()
      const loadedStudents = result.data || []
      setStudents(loadedStudents)
      console.log(`✅ Cargados ${loadedStudents.length} estudiantes`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al cargar la lista de estudiantes')
      console.error('Error cargando estudiantes:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = async (file: File) => {
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/students/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error en el procesamiento del archivo')
      }

      const result = await response.json()
      setDryRunResult(result)
      setIsDialogOpen(true)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al procesar el archivo')
    } finally {
      setIsUploading(false)
    }
  }

  const applyChanges = async () => {
    if (!dryRunResult) return

    try {
      const response = await fetch('/api/students/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dryRunResult),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al aplicar los cambios')
      }

      const result = await response.json()
      toast.success(`Cambios aplicados: ${result.inserted} insertados, ${result.updated} actualizados, ${result.deactivated} desactivados`)
      setIsDialogOpen(false)
      setDryRunResult(null)
      setSelectedFile(null)
      loadStudents()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al aplicar los cambios')
    }
  }

  const onSubmit = async (data: StudentForm) => {
    try {
      const url = editingStudent ? '/api/students' : '/api/students'
      const method = editingStudent ? 'PUT' : 'POST'
      
      // Preparar el body, convirtiendo activo a boolean si existe
      const body: any = editingStudent 
        // Nota: `data` también puede incluir `matricula` (aunque esté disabled), así que
        // ponemos `matricula` al final para evitar duplicados y asegurar el valor correcto.
        ? { ...data, matricula: editingStudent.matricula }
        : { ...data, activo: data.activo ?? true } // Por defecto activo al crear
      
      // Asegurar que activo sea boolean
      if (body.activo !== undefined) {
        body.activo = body.activo === true || body.activo === 'true'
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al guardar el estudiante')
      }

      toast.success(editingStudent ? 'Estudiante actualizado exitosamente' : 'Estudiante agregado exitosamente')
      setIsAddDialogOpen(false)
      setIsEditDialogOpen(false)
      setEditingStudent(null)
      reset()
      loadStudents()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al guardar el estudiante')
    }
  }

  const handleEdit = (student: Student) => {
    setEditingStudent(student)
    setValue('matricula', student.matricula.toString())
    setValue('nombre_abr', student.nombre_abr || '')
    setValue('cve_nivel', student.cve_nivel || '')
    setValue('cve_programa', student.cve_programa || '')
    setValue('cve_departamento', student.cve_departamento || '')
    setIsEditDialogOpen(true)
  }

  const handleToggleActive = async (student: Student) => {
    try {
      const response = await fetch('/api/students', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          matricula: student.matricula,
          activo: !student.activo
        }),
      })

      if (!response.ok) {
        throw new Error('Error al cambiar el estado')
      }

      toast.success(`Estudiante ${!student.activo ? 'activado' : 'desactivado'} exitosamente`)
      loadStudents()
    } catch (error) {
      toast.error('Error al cambiar el estado del estudiante')
    }
  }

  const handleDelete = async (student: Student) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar al estudiante con matrícula ${student.matricula}?`)) {
      return
    }

    try {
      const response = await fetch(`/api/students?matricula=${student.matricula}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Error al eliminar el estudiante')
      }

      toast.success('Estudiante eliminado exitosamente')
      loadStudents()
    } catch (error) {
      toast.error('Error al eliminar el estudiante')
    }
  }

  const handleExport = () => {
    try {
      // Crear CSV
      const headers = ['Matrícula', 'Nombre', 'Nivel', 'Programa', 'Departamento', 'Activo']
      const rows = students.map(s => [
        s.matricula,
        s.nombre_abr || '',
        s.cve_nivel || '',
        s.cve_programa || '',
        s.cve_departamento || '',
        s.activo ? 'Sí' : 'No'
      ])

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `estudiantes_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast.success('Archivo exportado exitosamente')
    } catch (error) {
      toast.error('Error al exportar el archivo')
    }
  }

  const filteredStudents = students.filter(student => {
    // Filtro por búsqueda de texto
    const matchesSearch = searchTerm === '' || 
      student.matricula.toString().includes(searchTerm) ||
      student.nombre_abr?.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Filtro por matrícula mínima
    const matchesMinMatricula = minMatricula === '' || 
      (minMatricula !== '' && !isNaN(parseInt(minMatricula)) && student.matricula >= parseInt(minMatricula))
    
    // Filtro por matrícula máxima
    const matchesMaxMatricula = maxMatricula === '' || 
      (maxMatricula !== '' && !isNaN(parseInt(maxMatricula)) && student.matricula <= parseInt(maxMatricula))
    
    return matchesSearch && matchesMinMatricula && matchesMaxMatricula
  })

  const handleToggleStudent = (matricula: number) => {
    setSelectedStudents(prev => 
      prev.includes(matricula)
        ? prev.filter(m => m !== matricula)
        : [...prev, matricula]
    )
  }

  const handleSelectAll = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([])
    } else {
      setSelectedStudents(filteredStudents.map(s => s.matricula))
    }
  }

  const handleToggleAllSelected = async (activo: boolean) => {
    if (selectedStudents.length === 0) {
      toast.error('No hay estudiantes seleccionados')
      return
    }

    try {
      const { toggleStudentActive } = await import('@/lib/students')
      let successCount = 0
      let errorCount = 0

      for (const matricula of selectedStudents) {
        try {
          await toggleStudentActive(matricula, activo)
          successCount++
        } catch (error) {
          console.error(`Error actualizando estudiante ${matricula}:`, error)
          errorCount++
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} estudiante(s) ${activo ? 'activado(s)' : 'desactivado(s)'} exitosamente`)
      }
      if (errorCount > 0) {
        toast.error(`Error al actualizar ${errorCount} estudiante(s)`)
      }

      setSelectedStudents([])
      loadStudents()
    } catch (error) {
      toast.error('Error al actualizar los estudiantes')
    }
  }

  const handleDeleteSelected = async () => {
    if (selectedStudents.length === 0) {
      toast.error('No hay estudiantes seleccionados')
      return
    }

    if (!confirm(`¿Estás seguro de que deseas eliminar ${selectedStudents.length} estudiante(s)? Esta acción no se puede deshacer.`)) {
      return
    }

    try {
      let successCount = 0
      let errorCount = 0

      for (const matricula of selectedStudents) {
        try {
          const response = await fetch(`/api/students?matricula=${matricula}`, {
            method: 'DELETE',
          })

          if (!response.ok) {
            throw new Error('Error al eliminar el estudiante')
          }

          successCount++
        } catch (error) {
          console.error(`Error eliminando estudiante ${matricula}:`, error)
          errorCount++
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} estudiante(s) eliminado(s) exitosamente`)
      }
      if (errorCount > 0) {
        toast.error(`Error al eliminar ${errorCount} estudiante(s)`)
      }

      setSelectedStudents([])
      loadStudents()
    } catch (error) {
      toast.error('Error al eliminar los estudiantes')
    }
  }

  const activeStudents = filteredStudents.filter(s => s.activo)
  const inactiveStudents = filteredStudents.filter(s => !s.activo)

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FFCD00] mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando lista de estudiantes...</p>
        </div>
      </div>
    )
  }

  return (
    <AdminAuthGuard>
      <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-20">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => router.push('/admin-dashboard')}
                className="mr-4 text-black hover:bg-gray-100"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
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
                  Gestión de Estudiantes
                </h1>
                <p className="text-sm text-gray-600">
                  Administrar lista de estudiantes autorizados
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Estudiantes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-black">{students.length}</div>
              <p className="text-xs text-gray-500">
                En la base de datos
              </p>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Activos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#22C55E]">{activeStudents.length}</div>
              <p className="text-xs text-gray-500">
                Pueden reservar
              </p>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Inactivos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#EF4444]">{inactiveStudents.length}</div>
              <p className="text-xs text-gray-500">
                Bloqueados
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
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
            <div className="w-full sm:w-48">
              <Input
                type="number"
                placeholder="Matrícula mínima"
                value={minMatricula}
                onChange={(e) => setMinMatricula(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-48">
              <Input
                type="number"
                placeholder="Matrícula máxima"
                value={maxMatricula}
                onChange={(e) => setMaxMatricula(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            {selectedStudents.length > 0 && (
              <>
                <Button
                  variant="outline"
                  onClick={() => handleToggleAllSelected(true)}
                  className="border-green-500 text-green-500 hover:bg-green-500 hover:text-white"
                >
                  Activar ({selectedStudents.length})
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleToggleAllSelected(false)}
                  className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                >
                  Desactivar ({selectedStudents.length})
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDeleteSelected}
                  className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar ({selectedStudents.length})
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelectedStudents([])}
                  className="border-gray-500 text-gray-500 hover:bg-gray-500 hover:text-white"
                >
                  Limpiar selección
                </Button>
              </>
            )}
            <div className="flex gap-2 ml-auto">
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#FFCD00] hover:bg-[#E6B800] text-black">
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Estudiante
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Agregar Estudiante</DialogTitle>
                  <DialogDescription>
                    Agregar un nuevo estudiante a la base de datos
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="matricula">Matrícula *</Label>
                    <Input
                      id="matricula"
                      placeholder="Ej: 13664"
                      {...register('matricula')}
                    />
                    {errors.matricula && (
                      <p className="text-sm text-red-600">{errors.matricula.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nombre_abr">Nombre</Label>
                    <Input
                      id="nombre_abr"
                      placeholder="Ej: PÉREZ GARCÍA, JUAN"
                      {...register('nombre_abr')}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cve_nivel">Nivel</Label>
                      <Input
                        id="cve_nivel"
                        placeholder="Ej: PROF"
                        {...register('cve_nivel')}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cve_programa">Programa</Label>
                      <Input
                        id="cve_programa"
                        placeholder="Ej: LAE"
                        {...register('cve_programa')}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cve_departamento">Departamento</Label>
                    <Input
                      id="cve_departamento"
                      placeholder="Ej: ECA"
                      {...register('cve_departamento')}
                    />
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsAddDialogOpen(false)
                        reset()
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" className="bg-[#FFCD00] hover:bg-[#E6B800] text-black">
                      Agregar
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Subir Excel
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Subir Lista de Estudiantes</DialogTitle>
                  <DialogDescription>
                    Selecciona un archivo Excel (.xlsx, .xls) o CSV (.csv) con los estudiantes.
                    El archivo debe tener una columna "matricula" o "matrícula".
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="file">Archivo</Label>
                    <Input
                      id="file"
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          setSelectedFile(file)
                        }
                      }}
                    />
                    <p className="text-xs text-gray-500">
                      Formatos soportados: Excel (.xlsx, .xls) o CSV (.csv)
                    </p>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setSelectedFile(null)}>
                      Cancelar
                    </Button>
                    <Button 
                      onClick={() => selectedFile && handleFileUpload(selectedFile)}
                      disabled={!selectedFile || isUploading}
                      className="bg-[#FFCD00] hover:bg-[#E6B800] text-black"
                    >
                      {isUploading ? 'Procesando...' : 'Procesar'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

              <Button variant="outline" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
            </div>
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
                      <p className="text-sm text-gray-600">Nuevos estudiantes</p>
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
                    <h4 className="font-medium mb-2">Nuevos Estudiantes ({dryRunResult.toInsert.length})</h4>
                    <div className="max-h-32 overflow-y-auto border rounded p-2">
                      {dryRunResult.toInsert.slice(0, 10).map((item, index) => (
                        <div key={index} className="text-sm text-gray-600 py-1">
                          Matrícula: {item.matricula} - {item.nombre_abr || item.nombre || 'Sin nombre'}
                        </div>
                      ))}
                      {dryRunResult.toInsert.length > 10 && (
                        <div className="text-sm text-gray-500 italic">
                          ... y {dryRunResult.toInsert.length - 10} más
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {dryRunResult.toUpdate.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Actualizaciones ({dryRunResult.toUpdate.length})</h4>
                    <div className="max-h-32 overflow-y-auto border rounded p-2">
                      {dryRunResult.toUpdate.slice(0, 10).map((item, index) => (
                        <div key={index} className="text-sm text-gray-600 py-1">
                          Matrícula: {item.matricula}
                        </div>
                      ))}
                      {dryRunResult.toUpdate.length > 10 && (
                        <div className="text-sm text-gray-500 italic">
                          ... y {dryRunResult.toUpdate.length - 10} más
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {dryRunResult.toDeactivate.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2 text-orange-600">Desactivaciones ({dryRunResult.toDeactivate.length})</h4>
                    <div className="max-h-32 overflow-y-auto border rounded p-2">
                      {dryRunResult.toDeactivate.slice(0, 10).map((item, index) => (
                        <div key={index} className="text-sm text-gray-600 py-1">
                          Matrícula: {item.matricula}
                        </div>
                      ))}
                      {dryRunResult.toDeactivate.length > 10 && (
                        <div className="text-sm text-gray-500 italic">
                          ... y {dryRunResult.toDeactivate.length - 10} más
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {dryRunResult.errors.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2 text-red-600">Errores ({dryRunResult.errors.length})</h4>
                    <div className="max-h-32 overflow-y-auto border border-red-200 rounded p-2 bg-red-50">
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
                  <Button 
                    onClick={applyChanges}
                    className="bg-[#FFCD00] hover:bg-[#E6B800] text-black"
                  >
                    Aplicar Cambios
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Estudiante</DialogTitle>
              <DialogDescription>
                Modificar los datos del estudiante
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit_matricula">Matrícula *</Label>
                <Input
                  id="edit_matricula"
                  placeholder="Ej: 13664"
                  {...register('matricula')}
                  disabled
                />
                <p className="text-xs text-gray-500">La matrícula no se puede modificar</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_nombre_abr">Nombre</Label>
                <Input
                  id="edit_nombre_abr"
                  placeholder="Ej: PÉREZ GARCÍA, JUAN"
                  {...register('nombre_abr')}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_cve_nivel">Nivel</Label>
                  <Input
                    id="edit_cve_nivel"
                    placeholder="Ej: PROF"
                    {...register('cve_nivel')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit_cve_programa">Programa</Label>
                  <Input
                    id="edit_cve_programa"
                    placeholder="Ej: LAE"
                    {...register('cve_programa')}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_cve_departamento">Departamento</Label>
                <Input
                  id="edit_cve_departamento"
                  placeholder="Ej: ECA"
                  {...register('cve_departamento')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_activo">Estado</Label>
                <Select
                  defaultValue={editingStudent?.activo ? 'true' : 'false'}
                  onValueChange={(value) => setValue('activo', value === 'true')}
                >
                  <SelectTrigger id="edit_activo">
                    <SelectValue placeholder="Selecciona el estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Activo</SelectItem>
                    <SelectItem value="false">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  Los estudiantes inactivos no pueden reservar cubículos
                </p>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditDialogOpen(false)
                    setEditingStudent(null)
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

        {/* Students Table */}
        <Card className="border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-black">Lista de Estudiantes</CardTitle>
            <CardDescription>
              Gestión de estudiantes autorizados para reservar cubículos
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredStudents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No se encontraron estudiantes
                </h3>
                <p className="text-gray-600">
                  {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Agrega estudiantes o sube un archivo para comenzar'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <input
                          type="checkbox"
                          checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0}
                          onChange={handleSelectAll}
                          className="w-4 h-4 text-[#22C55E] bg-gray-100 border-gray-300 rounded focus:ring-[#22C55E] focus:ring-2 cursor-pointer"
                        />
                      </TableHead>
                      <TableHead>Matrícula</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Nivel</TableHead>
                      <TableHead>Programa</TableHead>
                      <TableHead>Departamento</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((student) => (
                      <TableRow key={student.matricula}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedStudents.includes(student.matricula)}
                            onChange={() => handleToggleStudent(student.matricula)}
                            className="w-4 h-4 text-[#22C55E] bg-gray-100 border-gray-300 rounded focus:ring-[#22C55E] focus:ring-2 cursor-pointer"
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {student.matricula}
                        </TableCell>
                        <TableCell>
                          {student.nombre_abr || 'Sin nombre'}
                        </TableCell>
                        <TableCell>
                          {student.cve_nivel || '-'}
                        </TableCell>
                        <TableCell>
                          {student.cve_programa || '-'}
                        </TableCell>
                        <TableCell>
                          {student.cve_departamento || '-'}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="secondary" 
                            className={
                              student.activo 
                                ? 'bg-[#DCFCE7] text-[#16A34A]' 
                                : 'bg-[#FEE2E2] text-[#DC2626]'
                            }
                          >
                            {student.activo ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(student)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4 text-blue-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleActive(student)}
                              className={`h-8 w-8 p-0 ${student.activo ? 'text-orange-600' : 'text-green-600'}`}
                            >
                              {student.activo ? '🚫' : '✅'}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(student)}
                              className="h-8 w-8 p-0"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
    </AdminAuthGuard>
  )
}
