import { NextRequest, NextResponse } from 'next/server'
import { createVerificationCode, getVerificationCode } from '@/lib/verification'

export async function POST(request: NextRequest) {
  try {
    const { matricula } = await request.json()
    
    if (!matricula || typeof matricula !== 'string') {
      return NextResponse.json(
        { error: 'Matrícula requerida' },
        { status: 400 }
      )
    }
    
    // Crear código de verificación
    // Nota: La verificación de reservas activas se hace en el cliente antes de llamar a esta API
    const { code, email } = createVerificationCode(matricula)
    
    // Enviar correo usando la API de envío
    try {
      const emailResponse = await fetch(`${request.nextUrl.origin}/api/verification/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: email,
          code,
          matricula
        })
      })
      
      const emailResult = await emailResponse.json()
      
      if (!emailResponse.ok) {
        console.error('Error enviando correo:', emailResult)
        
        // Si hay un código dev (desarrollo sin API key o modo testing), retornarlo
        if (emailResult.devCode || emailResult.testing) {
          return NextResponse.json({
            success: true,
            message: emailResult.message || 'Código generado (modo desarrollo)',
            code: emailResult.devCode || code,
            warning: emailResult.warning || 'El código se mostrará en pantalla para testing'
          })
        }
        
        // En producción, retornar error
        if (process.env.NODE_ENV === 'production') {
          return NextResponse.json(
            { error: emailResult.error || 'Error al enviar el correo. Por favor, intenta de nuevo.' },
            { status: 500 }
          )
        }
        
        // En desarrollo, si hay error pero no código dev, retornar el código de todos modos
        return NextResponse.json({
          success: true,
          message: 'Código generado (error en envío, modo desarrollo)',
          code: code,
          warning: 'Error al enviar correo, pero aquí está el código para testing'
        })
      }
      
      // Si se envió correctamente o hay código dev, retornar éxito
      return NextResponse.json({
        success: true,
        message: emailResult.message || 'Código de verificación enviado',
        // Incluir el código si está en modo testing/desarrollo
        ...(emailResult.devCode && { code: emailResult.devCode }),
        ...(emailResult.testing && { testing: true }),
        ...(emailResult.warning && { warning: emailResult.warning })
      })
    } catch (error) {
      console.error('Error en envío de correo:', error)
      
      // En desarrollo, retornar el código aunque falle
      if (process.env.NODE_ENV === 'development') {
        return NextResponse.json({
          success: true,
          message: 'Código generado (error en envío, modo desarrollo)',
          code: code,
          warning: 'Error al enviar correo, pero aquí está el código para testing'
        })
      }
      
      // En producción, retornar error
      return NextResponse.json(
        { error: 'Error al enviar el correo. Por favor, intenta de nuevo.' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error en send verification:', error)
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    )
  }
}

