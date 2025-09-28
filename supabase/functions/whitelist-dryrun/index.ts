import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as XLSX from 'https://esm.sh/xlsx@0.18.5'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WhitelistRow {
  matricula: string
  nombre?: string
}

interface DryRunResult {
  toInsert: WhitelistRow[]
  toUpdate: Array<WhitelistRow & { id: string }>
  toDeactivate: Array<{ id: string; matricula: string }>
  errors: string[]
}

function normalizeMatricula(matricula: string): string {
  return matricula.trim().toUpperCase()
}

function parseFileContent(content: ArrayBuffer, filename: string): WhitelistRow[] {
  const rows: WhitelistRow[] = []
  
  try {
    const workbook = XLSX.read(content, { type: 'array' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
    
    // Skip header row
    const dataRows = jsonData.slice(1) as any[][]
    
    for (const row of dataRows) {
      if (row.length < 1 || !row[0]) continue
      
      const matricula = normalizeMatricula(String(row[0]))
      const nombre = row[1] ? String(row[1]).trim() : undefined
      
      if (matricula) {
        rows.push({ matricula, nombre })
      }
    }
  } catch (error) {
    throw new Error(`Error parsing file: ${error.message}`)
  }
  
  return rows
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const formData = await req.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No file provided' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const content = await file.arrayBuffer()
    const filename = file.name.toLowerCase()
    
    if (!filename.endsWith('.xlsx') && !filename.endsWith('.csv')) {
      return new Response(
        JSON.stringify({ error: 'File must be Excel (.xlsx) or CSV format' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse file content
    const newRows = parseFileContent(content, filename)
    
    if (newRows.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No valid data found in file' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get existing whitelist
    const { data: existingRows, error } = await supabaseClient
      .from('whitelist_matriculas')
      .select('id, matricula, nombre, activo')
    
    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    const result: DryRunResult = {
      toInsert: [],
      toUpdate: [],
      toDeactivate: [],
      errors: []
    }

    const existingMap = new Map(
      existingRows?.map(row => [normalizeMatricula(row.matricula), row]) || []
    )
    const newMatriculas = new Set(newRows.map(row => row.matricula))

    // Process new rows
    for (const newRow of newRows) {
      const existing = existingMap.get(newRow.matricula)
      
      if (!existing) {
        result.toInsert.push(newRow)
      } else if (existing.nombre !== newRow.nombre || !existing.activo) {
        result.toUpdate.push({
          id: existing.id,
          matricula: newRow.matricula,
          nombre: newRow.nombre
        })
      }
    }

    // Find rows to deactivate (existing but not in new file)
    for (const [matricula, existing] of existingMap) {
      if (!newMatriculas.has(matricula) && existing.activo) {
        result.toDeactivate.push({
          id: existing.id,
          matricula: existing.matricula
        })
      }
    }

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
