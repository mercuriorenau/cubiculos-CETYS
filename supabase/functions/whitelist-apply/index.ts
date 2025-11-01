import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ApplyRequest {
  toInsert: Array<{ matricula: string; nombre?: string }>
  toUpdate: Array<{ id: string; matricula: string; nombre?: string }>
  toDeactivate: Array<{ id: string; matricula: string }>
  mode: 'incremental' | 'full-sync'
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

    const { toInsert, toUpdate, toDeactivate, mode }: ApplyRequest = await req.json()

    const results = {
      inserted: 0,
      updated: 0,
      deactivated: 0,
      errors: [] as string[]
    }

    // Insert new records
    if (toInsert.length > 0) {
      const { error: insertError } = await supabaseClient
        .from('whitelist_matriculas')
        .insert(toInsert.map(row => ({
          matricula: row.matricula,
          nombre: row.nombre,
          activo: true
        })))
      
      if (insertError) {
        results.errors.push(`Insert error: ${insertError.message}`)
      } else {
        results.inserted = toInsert.length
      }
    }

    // Update existing records
    for (const updateRow of toUpdate) {
      const { error: updateError } = await supabaseClient
        .from('whitelist_matriculas')
        .update({
          nombre: updateRow.nombre,
          activo: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', updateRow.id)
      
      if (updateError) {
        results.errors.push(`Update error for ${updateRow.matricula}: ${updateError.message}`)
      } else {
        results.updated++
      }
    }

    // Deactivate records (only in full-sync mode)
    if (mode === 'full-sync' && toDeactivate.length > 0) {
      const { error: deactivateError } = await supabaseClient
        .from('whitelist_matriculas')
        .update({
          activo: false,
          updated_at: new Date().toISOString()
        })
        .in('id', toDeactivate.map(row => row.id))
      
      if (deactivateError) {
        results.errors.push(`Deactivate error: ${deactivateError.message}`)
      } else {
        results.deactivated = toDeactivate.length
      }
    }

    // Log the operation
    await supabaseClient
      .from('audit_log')
      .insert({
        action: 'whitelist_bulk_update',
        table_name: 'whitelist_matriculas',
        new_values: {
          inserted: results.inserted,
          updated: results.updated,
          deactivated: results.deactivated,
          mode
        }
      })

    return new Response(
      JSON.stringify(results),
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
