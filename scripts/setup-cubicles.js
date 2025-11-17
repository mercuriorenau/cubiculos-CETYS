const { createClient } = require('@supabase/supabase-js')

// Configuración de Supabase
const supabaseUrl = 'https://zmkhzqxqbolcobmmfhqb.supabase.co'
const supabaseKey = 'sb_publishable_2kaKTApul0Vdq2ZWd2uh3A_pIti2cXT'

const supabase = createClient(supabaseUrl, supabaseKey)

async function createRoomsTable() {
  console.log('🏗️ Creando tabla rooms...')
  
  // SQL para crear la tabla rooms
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS rooms (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      nombre TEXT NOT NULL,
      descripcion TEXT,
      capacidad INTEGER DEFAULT 1,
      activo BOOLEAN DEFAULT TRUE,
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
    
    console.log('✅ Tabla rooms creada correctamente')
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

async function insertCubicles() {
  console.log('\n📦 Insertando cubículos...')
  
  const cubiculos = [
    { nombre: 'Cubículo 1', descripcion: 'Cubículo individual con escritorio y silla', capacidad: 1 },
    { nombre: 'Cubículo 2', descripcion: 'Cubículo individual con escritorio y silla', capacidad: 1 },
    { nombre: 'Cubículo 3', descripcion: 'Cubículo individual con escritorio y silla', capacidad: 1 },
    { nombre: 'Cubículo 4', descripcion: 'Cubículo individual con escritorio y silla', capacidad: 1 },
    { nombre: 'Cubículo 5', descripcion: 'Cubículo individual con escritorio y silla', capacidad: 1 },
    { nombre: 'Cubículo 6', descripcion: 'Cubículo individual con escritorio y silla', capacidad: 1 },
    { nombre: 'Cubículo 7', descripcion: 'Cubículo individual con escritorio y silla', capacidad: 1 },
    { nombre: 'Cubículo 8', descripcion: 'Cubículo individual con escritorio y silla', capacidad: 1 },
    { nombre: 'Sala de Estudio A', descripcion: 'Sala para 4 personas con mesa grande', capacidad: 4 },
    { nombre: 'Sala de Estudio B', descripcion: 'Sala para 6 personas con mesa grande', capacidad: 6 }
  ]
  
  try {
    const { data, error } = await supabase
      .from('rooms')
      .insert(cubiculos)
      .select()
    
    if (error) {
      console.log('❌ Error insertando cubículos:', error.message)
      console.log('')
      console.log('📝 Si la tabla no existe, necesitas crearla primero en Supabase Dashboard')
      console.log('')
      console.log('Datos para insertar manualmente:')
      cubiculos.forEach((cub, index) => {
        console.log(`${index + 1}. ${cub.nombre} - ${cub.descripcion} (${cub.capacidad} persona${cub.capacidad > 1 ? 's' : ''})`)
      })
      return false
    }
    
    console.log(`✅ Insertados ${data.length} cubículos correctamente`)
    data.forEach(cub => {
      console.log(`   - ${cub.nombre} (ID: ${cub.id})`)
    })
    return true
  } catch (err) {
    console.log('❌ Error insertando cubículos:', err.message)
    return false
  }
}

async function verifyRooms() {
  console.log('\n🔍 Verificando cubículos...')
  
  try {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .order('nombre')
    
    if (error) {
      console.log('❌ Error obteniendo cubículos:', error.message)
      return false
    }
    
    console.log(`✅ Total de cubículos: ${data.length}`)
    data.forEach(room => {
      console.log(`   - ${room.nombre} (capacidad: ${room.capacidad}, activo: ${room.activo})`)
    })
    
    return true
  } catch (err) {
    console.log('❌ Error verificando cubículos:', err.message)
    return false
  }
}

async function setupCubicles() {
  console.log('🚀 Configurando cubículos en Supabase...')
  console.log('')
  
  // Intentar crear tabla
  const tableCreated = await createRoomsTable()
  
  // Intentar insertar datos
  const dataInserted = await insertCubicles()
  
  // Verificar resultado
  const verified = await verifyRooms()
  
  console.log('\n📋 Resumen:')
  console.log(`   Tabla creada: ${tableCreated ? '✅' : '❌'}`)
  console.log(`   Datos insertados: ${dataInserted ? '✅' : '❌'}`)
  console.log(`   Verificación: ${verified ? '✅' : '❌'}`)
  
  if (!tableCreated || !dataInserted || !verified) {
    console.log('\n🔧 Pasos manuales necesarios:')
    console.log('1. Ve a tu Supabase Dashboard')
    console.log('2. Ve a SQL Editor')
    console.log('3. Ejecuta el SQL de creación de tabla')
    console.log('4. Ejecuta el SQL de inserción de datos')
    console.log('5. Verifica que los datos se insertaron correctamente')
  } else {
    console.log('\n🎉 ¡Cubículos configurados correctamente!')
    console.log('Ahora puedes probar la aplicación en http://localhost:3003')
  }
}

setupCubicles().catch(console.error)

