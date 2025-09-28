import { createClient } from '@supabase/supabase-js'

// Verificar si Supabase está configurado correctamente
const isSupabaseConfigured = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return url && key && 
         url !== 'your_supabase_project_url' && 
         url !== 'https://placeholder.supabase.co' &&
         url.startsWith('https://') &&
         key.startsWith('eyJ')
}

// Solo inicializar Supabase si está configurado correctamente
let supabase: any = null
let supabaseAdmin: any = null

if (isSupabaseConfigured()) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  
  supabase = createClient(supabaseUrl, supabaseAnonKey)
  
  supabaseAdmin = createClient(
    supabaseUrl,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
} else {
  console.warn('⚠️ Supabase no está configurado correctamente. Por favor, configura las variables de entorno en .env')
  
  // Crear clientes mock que muestren errores informativos
  supabase = {
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: { message: 'Supabase no configurado' } }),
      signInWithPassword: () => Promise.resolve({ data: null, error: { message: 'Supabase no configurado' } }),
      signUp: () => Promise.resolve({ data: null, error: { message: 'Supabase no configurado' } }),
      signOut: () => Promise.resolve({ error: { message: 'Supabase no configurado' } })
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: { message: 'Supabase no configurado' } })
        }),
        order: () => Promise.resolve({ data: [], error: { message: 'Supabase no configurado' } })
      }),
      insert: () => ({
        select: () => ({
          single: () => Promise.resolve({ data: null, error: { message: 'Supabase no configurado' } })
        })
      }),
      update: () => ({
        eq: () => ({
          select: () => ({
            single: () => Promise.resolve({ data: null, error: { message: 'Supabase no configurado' } })
          })
        })
      })
    })
  }
  
  supabaseAdmin = supabase
}

export { supabase, supabaseAdmin }
