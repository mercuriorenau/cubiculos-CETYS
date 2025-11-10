'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { AdminLoginSchema } from '@/lib/schemas'
import { toast } from 'sonner'
import { Shield, ArrowLeft } from 'lucide-react'
import { CETYS_CLASSES } from '@/lib/cetys-colors'
import Image from 'next/image'

type AdminLoginForm = z.infer<typeof AdminLoginSchema>

export default function AdminLoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AdminLoginForm>({
    resolver: zodResolver(AdminLoginSchema),
  })

  const onSubmit = async (data: AdminLoginForm) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Error de autenticación')
      }

      const result = await response.json()
      
      if (result.success) {
        toast.success('Inicio de sesión exitoso')
        router.push('/admin-dashboard')
      } else {
        throw new Error('Credenciales inválidas')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error inesperado')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/')}
            className="mb-4 text-black hover:bg-[#FFF4B3]"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al Inicio
          </Button>
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-[#FFCD00] mr-2" />
            <h1 className="text-2xl font-bold text-black">
              Panel de Administración CETYS
            </h1>
          </div>
          <p className="text-gray-600">
            Acceso exclusivo para administradores
          </p>
        </div>

        <Card className="border-[#FFCD00]">
          <CardHeader className="text-center">
            <CardTitle className="text-xl font-bold text-black">
              Iniciar Sesión
            </CardTitle>
            <CardDescription>
              Ingresa tus credenciales de administrador
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Usuario</Label>
                <Input
                  id="username"
                  placeholder="admin"
                  {...register('username')}
                  disabled={isLoading}
                />
                {errors.username && (
                  <p className="text-sm text-red-600">{errors.username.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  {...register('password')}
                  disabled={isLoading}
                />
                {errors.password && (
                  <p className="text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full bg-[#FFCD00] hover:bg-[#E6B800] text-black" disabled={isLoading}>
                {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </Button>
            </form>

            <div className="mt-6 p-4 bg-[#FFF4B3] border border-[#FFCD00] rounded-lg">
              <h4 className="text-sm font-medium text-black mb-2">
                Credenciales de Desarrollo
              </h4>
              <p className="text-sm text-black">
                Usuario: <code className="bg-[#FFCD00] px-1 rounded">admin</code>
              </p>
              <p className="text-sm text-black">
                Contraseña: <code className="bg-[#FFCD00] px-1 rounded">admin</code>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
