import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { UpdateReservationSchema } from '@/lib/schemas'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const validatedData = UpdateReservationSchema.parse(body)
    const reservationId = params.id

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Check if reservation belongs to user
    const { data: reservation, error: fetchError } = await supabase
      .from('reservations')
      .select('user_id')
      .eq('id', reservationId)
      .single()

    if (fetchError || !reservation) {
      return NextResponse.json(
        { message: 'Reservation not found' },
        { status: 404 }
      )
    }

    if (reservation.user_id !== user.id) {
      return NextResponse.json(
        { message: 'Not authorized' },
        { status: 403 }
      )
    }

    // Update reservation
    const { data, error } = await supabase
      .from('reservations')
      .update({
        status: validatedData.status,
        updated_at: new Date().toISOString()
      })
      .eq('id', reservationId)
      .select(`
        *,
        room:rooms(*)
      `)
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('Reservation update error:', error)
    return NextResponse.json(
      { 
        success: false,
        message: error instanceof Error ? error.message : 'Error updating reservation'
      },
      { status: 400 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reservationId = params.id

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Check if reservation belongs to user
    const { data: reservation, error: fetchError } = await supabase
      .from('reservations')
      .select('user_id')
      .eq('id', reservationId)
      .single()

    if (fetchError || !reservation) {
      return NextResponse.json(
        { message: 'Reservation not found' },
        { status: 404 }
      )
    }

    if (reservation.user_id !== user.id) {
      return NextResponse.json(
        { message: 'Not authorized' },
        { status: 403 }
      )
    }

    // Cancel reservation (soft delete)
    const { error } = await supabase
      .from('reservations')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', reservationId)

    if (error) {
      throw new Error(error.message)
    }

    return NextResponse.json({
      success: true,
      message: 'Reservation cancelled successfully',
    })
  } catch (error) {
    console.error('Reservation cancellation error:', error)
    return NextResponse.json(
      { 
        success: false,
        message: error instanceof Error ? error.message : 'Error cancelling reservation'
      },
      { status: 400 }
    )
  }
}
