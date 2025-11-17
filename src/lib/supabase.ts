import { createClient } from '@supabase/supabase-js'

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zmkhzqxqbolcobmmfhqb.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpta2h6cXhxYm9sY29ibW1maHFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwNzc2MDAsImV4cCI6MjA3NDY1MzYwMH0.R8lZUAMWz-6pF9fqBEvTIThRqjqliQmeN7LDTYdEQco'

console.log('✅ Configuración de Supabase cargada')
console.log('🔗 URL:', supabaseUrl)
console.log('🔑 Key:', supabaseAnonKey.substring(0, 30) + '...')

// Crear cliente de Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Crear cliente admin (opcional, para operaciones administrativas)
export const supabaseAdmin = createClient(
  supabaseUrl,
  'dummy-service-key', // No necesario para operaciones básicas
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)