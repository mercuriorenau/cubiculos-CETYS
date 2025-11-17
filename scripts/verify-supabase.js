/**
 * Script para verificar la conexión con Supabase
 * Ejecuta: node scripts/verify-supabase.js
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Cargar variables de entorno
dotenv.config({ path: join(__dirname, '..', '.env.local') })
dotenv.config({ path: join(__dirname, '..', '.env') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('🔍 Verificando configuración de Supabase...\n')

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ ERROR: Faltan variables de entorno')
  console.log('\n📋 Variables necesarias:')
  console.log('  NEXT_PUBLIC_SUPABASE_URL=' + (supabaseUrl || '❌ FALTA'))
  console.log('  NEXT_PUBLIC_SUPABASE_ANON_KEY=' + (supabaseKey ? supabaseKey.substring(0, 20) + '...' : '❌ FALTA'))
  console.log('\n💡 Crea un archivo .env.local con estas variables')
  process.exit(1)
}

console.log('✅ Variables de entorno encontradas')
console.log('🔗 URL:', supabaseUrl)
console.log('🔑 Key:', supabaseKey.substring(0, 30) + '...\n')

// Crear cliente
const supabase = createClient(supabaseUrl, supabaseKey)

// Verificar conexión
async function verifyConnection() {
  console.log('🔍 Verificando conexión con Supabase...')
  
  try {
    // Intentar una consulta simple
    const { data, error } = await supabase
      .from('students')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('❌ Error de conexión:', error.message)
      console.error('   Código:', error.code)
      console.error('   Detalles:', error.details)
      return false
    }
    
    console.log('✅ Conexión exitosa con Supabase\n')
    return true
  } catch (err) {
    console.error('❌ Error de conexión:', err.message)
    return false
  }
}

// Verificar estructura de tabla
async function verifyTableStructure() {
  console.log('🔍 Verificando estructura de tabla students...')
  
  try {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('❌ Error al acceder a la tabla:', error.message)
      console.error('   Código:', error.code)
      console.error('   Detalles:', error.details)
      console.log('\n💡 Verifica que:')
      console.log('   1. La tabla "students" existe')
      console.log('   2. Tienes permisos para leerla')
      console.log('   3. Las políticas RLS están configuradas correctamente')
      return false
    }
    
    console.log('✅ Tabla accesible')
    
    // Verificar columnas esperadas
    if (data && data.length > 0) {
      const firstRow = data[0]
      const requiredColumns = ['matricula', 'activo']
      const missingColumns = requiredColumns.filter(col => !(col in firstRow))
      
      if (missingColumns.length > 0) {
        console.error('❌ Faltan columnas:', missingColumns.join(', '))
        return false
      }
      
      console.log('✅ Columnas requeridas presentes:', requiredColumns.join(', '))
      console.log('📊 Columnas disponibles:', Object.keys(firstRow).join(', '))
      console.log('📝 Tipo de matricula:', typeof firstRow.matricula, '(debe ser número)')
    }
    
    return true
  } catch (err) {
    console.error('❌ Error:', err.message)
    return false
  }
}

// Verificar datos
async function verifyData() {
  console.log('\n🔍 Verificando datos en la tabla...')
  
  try {
    // Contar total de registros
    const { count: totalCount, error: countError } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
    
    if (countError) {
      console.error('❌ Error al contar registros:', countError.message)
      return false
    }
    
    console.log(`📊 Total de registros: ${totalCount || 0}`)
    
    // Contar registros activos
    const { count: activeCount, error: activeError } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
      .eq('activo', true)
    
    if (activeError) {
      console.error('❌ Error al contar registros activos:', activeError.message)
      return false
    }
    
    console.log(`✅ Registros activos: ${activeCount || 0}`)
    
    // Obtener algunas matrículas de ejemplo
    const { data: sampleData, error: sampleError } = await supabase
      .from('students')
      .select('matricula, activo, nombre_abr')
      .eq('activo', true)
      .limit(5)
    
    if (sampleError) {
      console.error('❌ Error al obtener ejemplos:', sampleError.message)
      return false
    }
    
    if (sampleData && sampleData.length > 0) {
      console.log('\n📋 Ejemplos de matrículas activas:')
      sampleData.forEach((row, index) => {
        console.log(`   ${index + 1}. Matrícula: ${row.matricula}${row.nombre_abr ? ` - ${row.nombre_abr}` : ''}`)
      })
    } else {
      console.log('⚠️  No hay registros activos en la tabla')
      console.log('💡 Nota: Si todos los registros tienen activo=false, necesitas activar algunos')
    }
    
    return true
  } catch (err) {
    console.error('❌ Error:', err.message)
    return false
  }
}

// Probar normalización de matrícula
async function testMatriculaNormalization() {
  console.log('\n🔍 Probando normalización de matrículas...')
  
  try {
    // Obtener una matrícula de ejemplo
    const { data, error } = await supabase
      .from('students')
      .select('matricula')
      .eq('activo', true)
      .limit(1)
      .single()
    
    if (error || !data) {
      console.log('⚠️  No se pudo obtener una matrícula de ejemplo')
      console.log('💡 Esto puede ser porque no hay registros con activo=true')
      return true
    }
    
    const exampleMatricula = data.matricula
    console.log(`📝 Matrícula de ejemplo (número): ${exampleMatricula}`)
    console.log(`📝 Tipo: ${typeof exampleMatricula}`)
    
    // Probar búsqueda con la matrícula como número
    const { data: originalData, error: originalError } = await supabase
      .from('students')
      .select('matricula')
      .eq('matricula', exampleMatricula)
      .eq('activo', true)
      .single()
    
    if (originalError || !originalData) {
      console.log('⚠️  No se encontró con la matrícula original')
    } else {
      console.log('✅ Búsqueda con matrícula (número): OK')
    }
    
    // Probar normalización: convertir string con ceros a número
    // Ejemplo: "000001" -> 1, "001234" -> 1234
    const testString = `00000${exampleMatricula}`
    const normalized = parseInt(testString.replace(/^0+/, '') || '0', 10)
    console.log(`📝 Probando normalización: "${testString}" -> ${normalized}`)
    
    const { data: normalizedData, error: normalizedError } = await supabase
      .from('students')
      .select('matricula')
      .eq('matricula', normalized)
      .eq('activo', true)
      .single()
    
    if (normalizedError || !normalizedData) {
      console.log('⚠️  No se encontró con la matrícula normalizada')
    } else {
      console.log('✅ Búsqueda con matrícula normalizada: OK')
    }
    
    return true
  } catch (err) {
    console.error('❌ Error:', err.message)
    return false
  }
}

// Ejecutar todas las verificaciones
async function runVerifications() {
  console.log('='.repeat(60))
  console.log('🚀 VERIFICACIÓN DE CONFIGURACIÓN DE SUPABASE')
  console.log('='.repeat(60) + '\n')
  
  const connectionOk = await verifyConnection()
  if (!connectionOk) {
    console.log('\n❌ La verificación falló. Revisa la configuración.')
    process.exit(1)
  }
  
  const structureOk = await verifyTableStructure()
  if (!structureOk) {
    console.log('\n❌ La verificación de estructura falló.')
    process.exit(1)
  }
  
  const dataOk = await verifyData()
  if (!dataOk) {
    console.log('\n❌ La verificación de datos falló.')
    process.exit(1)
  }
  
  await testMatriculaNormalization()
  
  console.log('\n' + '='.repeat(60))
  console.log('✅ TODAS LAS VERIFICACIONES COMPLETADAS')
  console.log('='.repeat(60))
  console.log('\n🎉 Tu configuración de Supabase está lista para usar!')
}

runVerifications().catch(console.error)

