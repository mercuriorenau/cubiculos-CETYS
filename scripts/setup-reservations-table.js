const { createClient } = require('@supabase/supabase-js')

// Configuración de Supabase
const supabaseUrl = 'https://zmkhzqxqbolcobmmfhqb.supabase.co'
const supabaseKey = 'sb_publishable_2kaKTApul0Vdq2ZWd2uh3A_pIti2cXT'

const supabase = createClient(supabaseUrl, supabaseKey)

async function createReservationsTable() {
  console.log('🏗️ Creando tabla reservations...')
  
  // SQL para crear la tabla reservations
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS reservations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      room_id TEXT NOT NULL,
      matricula TEXT NOT NULL,
      nombre_completo TEXT NOT NULL,
      cantidad_personas INTEGER NOT NULL,
      inicio TIMESTAMP WITH TIME ZONE NOT NULL,
      fin TIMESTAMP WITH TIME ZONE NOT NULL,
      status TEXT DEFAULT 'active',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `
  
  try {
    // Intentar crear la tabla usando una función SQL personalizada
    const { data, error } = await supabase.rpc('exec_sql', { sql: createTableSQL })
    
    if (error) {
      console.log('⚠️ No se pudo ejecutar SQL directamente:', error.message)
      console.log('📝 Necesitas crear la tabla manualmente en Supabase Dashboard')
      console.log('')
      console.log('SQL para copiar y pegar en Supabase SQL Editor:')
      console.log(createTableSQL)
      return false
    }
    
    console.log('✅ Tabla reservations creada correctamente')
    return true
  } catch (err) {
    console.log('⚠️ Error creando tabla:', err.message)
    console.log('📝 Necesitas crear la tabla manualmente en Supabase Dashboard')
    console.log('')
    console.log('SQL para copiar y pegar en Supabase SQL Editor:')
    console.log(createTableSQL)
    return false
  }
}

async function verifyReservationsTable() {
  console.log('\n🔍 Verificando tabla reservations...')
  
  try {
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .limit(1)
    
    if (error) {
      console.log('❌ Error verificando tabla reservations:', error.message)
      return false
    }
    
    console.log('✅ Tabla reservations existe y es accesible')
    console.log(`   Registros actuales: ${data.length}`)
    return true
  } catch (err) {
    console.log('❌ Error verificando tabla reservations:', err.message)
    return false
  }
}

async function setupReservationsTable() {
  console.log('🚀 Configurando tabla reservations en Supabase...')
  console.log('')
  
  // Intentar crear tabla
  const tableCreated = await createReservationsTable()
  
  // Verificar resultado
  const verified = await verifyReservationsTable()
  
  console.log('\n📋 Resumen:')
  console.log(`   Tabla creada: ${tableCreated ? '✅' : '❌'}`)
  console.log(`   Verificación: ${verified ? '✅' : '❌'}`)
  
  if (!tableCreated || !verified) {
    console.log('\n🔧 Pasos manuales necesarios:')
    console.log('1. Ve a tu Supabase Dashboard')
    console.log('2. Ve a SQL Editor')
    console.log('3. Ejecuta el SQL de creación de tabla reservations')
    console.log('4. Verifica que la tabla se creó correctamente')
  } else {
    console.log('\n🎉 ¡Tabla reservations configurada correctamente!')
    console.log('Ahora puedes hacer reservas en la aplicación')
  }
}

setupReservationsTable().catch(console.error)

