import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { CreateReservationSchema } from '@/lib/schemas'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = CreateReservationSchema.parse(body)

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Check if user is verified
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('verified')
      .eq('id', user.id)
      .single()

    if (userError || !userData?.verified) {
      return NextResponse.json(
        { message: 'User not verified' },
        { status: 403 }
      )
    }

    // Create reservation
    const { data, error } = await supabase
      .from('reservations')
      .insert({
        user_id: user.id,
        room_id: validatedData.room_id,
        inicio: validatedData.inicio,
        fin: validatedData.fin,
        status: 'active'
      })
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
    console.error('Reservation creation error:', error)
    return NextResponse.json(
      { 
        success: false,
        message: error instanceof Error ? error.message : 'Error creating reservation'
      },
      { status: 400 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Get user reservations
    const { data, error } = await supabase
      .from('reservations')
      .select(`
        *,
        room:rooms(*)
      `)
      .eq('user_id', user.id)
      .order('inicio', { ascending: false })

    if (error) {
      throw new Error(error.message)
    }

    return NextResponse.json({
      success: true,
      data: data || [],
    })
  } catch (error) {
    console.error('Reservations fetch error:', error)
    return NextResponse.json(
      { 
        success: false,
        message: error instanceof Error ? error.message : 'Error fetching reservations'
      },
      { status: 500 }
    )
  }
}
