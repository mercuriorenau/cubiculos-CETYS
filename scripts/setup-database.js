const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Configuración de Supabase
const supabaseUrl = 'https://zmkhzqxqbolcobmmfhqb.supabase.co'
const supabaseKey = 'sb_publishable_2kaKTApul0Vdq2ZWd2uh3A_pIti2cXT'

const supabase = createClient(supabaseUrl, supabaseKey)

async function createTables() {
  console.log('🚀 Creando tablas en Supabase...')
  
  try {
    // Crear tabla rooms
    console.log('📦 Creando tabla rooms...')
    const { data: rooms, error: roomsError } = await supabase
      .from('rooms')
      .select('*')
      .limit(1)
    
    if (roomsError && roomsError.code === 'PGRST116') {
      console.log('⚠️ Tabla rooms no existe, necesitas crearla manualmente en Supabase')
    } else {
      console.log('✅ Tabla rooms existe')
    }
    
    // Crear tabla whitelist_matriculas
    console.log('📦 Verificando tabla whitelist_matriculas...')
    const { data: whitelist, error: whitelistError } = await supabase
      .from('whitelist_matriculas')
      .select('*')
      .limit(1)
    
    if (whitelistError && whitelistError.code === 'PGRST116') {
      console.log('⚠️ Tabla whitelist_matriculas no existe, necesitas crearla manualmente en Supabase')
    } else {
      console.log('✅ Tabla whitelist_matriculas existe')
    }
    
    // Crear tabla reservations
    console.log('📦 Verificando tabla reservations...')
    const { data: reservations, error: reservationsError } = await supabase
      .from('reservations')
      .select('*')
      .limit(1)
    
    if (reservationsError && reservationsError.code === 'PGRST116') {
      console.log('⚠️ Tabla reservations no existe, necesitas crearla manualmente en Supabase')
    } else {
      console.log('✅ Tabla reservations existe')
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

async function insertSampleData() {
  console.log('\n🌱 Insertando datos de ejemplo...')
  
  try {
    // Insertar cubículos
    const rooms = [
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
    
    const { data: insertedRooms, error: roomsError } = await supabase
      .from('rooms')
      .insert(rooms)
      .select()
    
    if (roomsError) {
      console.log('⚠️ Error insertando rooms:', roomsError.message)
    } else {
      console.log(`✅ Insertados ${insertedRooms.length} cubículos`)
    }
    
    // Insertar matrículas de ejemplo
    const matriculas = [
      { matricula: '2024001234', nombre: 'Juan Pérez García', activo: true },
      { matricula: '2024001235', nombre: 'María López Rodríguez', activo: true },
      { matricula: '2024001236', nombre: 'Carlos Martínez Sánchez', activo: true },
      { matricula: '2024001237', nombre: 'Ana González Fernández', activo: true },
      { matricula: '2024001238', nombre: 'Luis Hernández Torres', activo: true },
      { matricula: '000001', nombre: 'Estudiante Test 1', activo: true },
      { matricula: '000002', nombre: 'Estudiante Test 2', activo: true }
    ]
    
    const { data: insertedMatriculas, error: matriculasError } = await supabase
      .from('whitelist_matriculas')
      .insert(matriculas)
      .select()
    
    if (matriculasError) {
      console.log('⚠️ Error insertando matrículas:', matriculasError.message)
    } else {
      console.log(`✅ Insertadas ${insertedMatriculas.length} matrículas`)
    }
    
  } catch (error) {
    console.error('❌ Error insertando datos:', error.message)
  }
}

async function verifyData() {
  console.log('\n🔍 Verificando datos...')
  
  try {
    const { data: rooms, error: roomsError } = await supabase
      .from('rooms')
      .select('*')
    
    if (roomsError) {
      console.log('❌ Error obteniendo rooms:', roomsError.message)
    } else {
      console.log(`✅ Rooms: ${rooms.length} registros`)
      rooms.forEach(room => {
        console.log(`   - ${room.nombre} (capacidad: ${room.capacidad})`)
      })
    }
    
    const { data: whitelist, error: whitelistError } = await supabase
      .from('whitelist_matriculas')
      .select('*')
    
    if (whitelistError) {
      console.log('❌ Error obteniendo whitelist:', whitelistError.message)
    } else {
      console.log(`✅ Whitelist: ${whitelist.length} registros`)
      whitelist.forEach(item => {
        console.log(`   - ${item.matricula}: ${item.nombre}`)
      })
    }
    
  } catch (error) {
    console.error('❌ Error verificando datos:', error.message)
  }
}

async function setupDatabase() {
  await createTables()
  await insertSampleData()
  await verifyData()
  
  console.log('\n🎉 Configuración completada!')
  console.log('Ahora puedes probar la aplicación en http://localhost:3000')
}

setupDatabase().catch(console.error)
