import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

// Configurar transporter de Gmail SMTP
function createGmailTransporter() {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    return null
  }
  
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  })
}

// Template HTML para el correo de verificación
function getVerificationEmailTemplate(code: string, matricula: string) {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Código de Verificación</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #FFCD00 0%, #E6B800 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #000000; font-size: 28px; font-weight: bold;">
                CETYS Universidad
              </h1>
              <p style="margin: 8px 0 0; color: #000000; font-size: 16px;">
                Sistema de Reserva de Cubículos
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #1a1a1a; font-size: 24px; font-weight: 600;">
                Código de Verificación
              </h2>
              
              <p style="margin: 0 0 20px; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                Hola,
              </p>
              
              <p style="margin: 0 0 30px; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                Has solicitado un código de verificación para realizar una reserva de cubículo. 
                Utiliza el siguiente código para completar tu reserva:
              </p>
              
              <!-- Code Box -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 30px;">
                <tr>
                  <td align="center" style="padding: 0;">
                    <div style="background-color: #f8f9fa; border: 2px dashed #FFCD00; border-radius: 8px; padding: 30px; text-align: center;">
                      <div style="font-size: 42px; font-weight: bold; letter-spacing: 8px; color: #1a1a1a; font-family: 'Courier New', monospace;">
                        ${code}
                      </div>
                    </div>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0 0 20px; color: #4a4a4a; font-size: 14px; line-height: 1.6;">
                <strong>⚠️ Importante:</strong>
              </p>
              <ul style="margin: 0 0 30px; padding-left: 20px; color: #4a4a4a; font-size: 14px; line-height: 1.8;">
                <li>Este código expira en <strong>10 minutos</strong></li>
                <li>No compartas este código con nadie</li>
                <li>Si no solicitaste este código, ignora este correo</li>
              </ul>
              
              <p style="margin: 0; color: #6a6a6a; font-size: 12px; line-height: 1.6;">
                Matrícula: <strong>${matricula}</strong>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0 0 10px; color: #6a6a6a; font-size: 12px;">
                CETYS Universidad - Biblioteca
              </p>
              <p style="margin: 0; color: #9a9a9a; font-size: 11px;">
                Este es un correo automático, por favor no respondas a este mensaje.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}

export async function POST(request: NextRequest) {
  try {
    const { to, code, matricula } = await request.json()
    
    if (!to || !code) {
      return NextResponse.json(
        { error: 'Email y código requeridos' },
        { status: 400 }
      )
    }
    
    // Intentar enviar con Gmail SMTP
    const gmailTransporter = createGmailTransporter()
    if (gmailTransporter) {
      try {
        const fromEmail = process.env.GMAIL_USER || 'noreply@localhost'
        const fromName = process.env.GMAIL_FROM_NAME || 'Sistema de Reservas'
        
        await gmailTransporter.sendMail({
          from: `"${fromName}" <${fromEmail}>`,
          to: to,
          subject: 'Código de Verificación - Reserva de Cubículos CETYS',
          html: getVerificationEmailTemplate(code, matricula),
        })
        
        console.log('Correo de verificación enviado correctamente')
        
        return NextResponse.json({
          success: true,
          message: 'Correo enviado exitosamente'
        })
      } catch (gmailError: any) {
        console.error('Error enviando correo con Gmail SMTP:', gmailError)
        return NextResponse.json(
          { error: 'Error al enviar el correo: ' + (gmailError.message || 'Error desconocido') },
          { status: 500 }
        )
      }
    }
    
    // Si no hay Gmail configurado, mostrar código en pantalla (modo desarrollo)
    console.log('📧 [DEV MODE] Gmail SMTP no configurado')
    console.log('📧 [DEV MODE] Código de verificación:', code)
    console.log('📧 [DEV MODE] Configura GMAIL_USER y GMAIL_APP_PASSWORD en .env.local')
    
    return NextResponse.json({
      success: true,
      message: 'Modo desarrollo: El código se mostrará en pantalla',
      devCode: code,
      testing: true,
      suggestion: 'Configura GMAIL_USER y GMAIL_APP_PASSWORD en .env.local para enviar correos reales'
    })
  } catch (error: any) {
    console.error('Error en email route:', error)
    return NextResponse.json(
      { error: 'Error al procesar la solicitud de correo' },
      { status: 500 }
    )
  }
}

