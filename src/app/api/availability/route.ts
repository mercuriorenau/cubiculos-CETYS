import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { AvailabilityQuerySchema } from '@/lib/schemas'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const roomId = searchParams.get('room_id')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    // Validate query parameters
    const validatedData = AvailabilityQuerySchema.parse({
      room_id: roomId,
      start_date: startDate,
      end_date: endDate,
    })

    let query = supabase
      .from('reservations')
      .select(`
        id,
        room_id,
        inicio,
        fin,
        status,
        room:rooms(id, nombre)
      `)
      .eq('status', 'active')

    if (validatedData.room_id) {
      query = query.eq('room_id', validatedData.room_id)
    }

    if (validatedData.start_date) {
      query = query.gte('inicio', validatedData.start_date)
    }

    if (validatedData.end_date) {
      query = query.lte('fin', validatedData.end_date)
    }

    const { data, error } = await query.order('inicio')

    if (error) {
      throw new Error(error.message)
    }

    return NextResponse.json({
      success: true,
      data: data || [],
    })
  } catch (error) {
    console.error('Availability API error:', error)
    return NextResponse.json(
      { 
        success: false,
        message: error instanceof Error ? error.message : 'Error fetching availability'
      },
      { status: 400 }
    )
  }
}
