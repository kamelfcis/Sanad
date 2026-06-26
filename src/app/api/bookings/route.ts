import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createServiceRoleClient, isServiceRoleConfigured } from '@/lib/supabase/admin';
import { requireAuth } from '@/lib/api/auth';
import { parseJsonBody, parseSearchParams } from '@/lib/api/validate';
import { createBookingSchema, listBookingsQuerySchema } from '@/lib/validations/booking';
import { notifyBookingAssignedBatch } from '@/lib/notifications/events';

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const auth = await requireAuth(supabase);
  if ('response' in auth) return auth.response;

  const query = parseSearchParams(request.nextUrl.searchParams, listBookingsQuerySchema);
  if ('response' in query) return query.response;

  const { status, limit, offset } = query.data;

  let dbQuery = supabase
    .from('bookings')
    .select('*, services(name_ar, name_en, slug, service_categories(name_ar, name_en))')
    .eq('customer_id', auth.user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    dbQuery = dbQuery.eq('status', status);
  }

  const { data, error } = await dbQuery;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const auth = await requireAuth(supabase);
  if ('response' in auth) return auth.response;

  const parsed = await parseJsonBody(request, createBookingSchema);
  if ('response' in parsed) return parsed.response;

  const { service_id, description, location_address, location_lat, location_lng, preferred_time, image_urls, technician_id } =
    parsed.data;

  const rpcClient = isServiceRoleConfigured() ? createServiceRoleClient() : supabase;
  const writeClient = rpcClient;

  if (technician_id) {
    const { data: techProfile } = await rpcClient
      .from('technician_profiles')
      .select('id, verification_status, is_available')
      .eq('id', technician_id)
      .maybeSingle();

    if (!techProfile) {
      return NextResponse.json({ error: 'Technician not found' }, { status: 404 });
    }

    if (techProfile.verification_status !== 'verified') {
      return NextResponse.json(
        { error: 'Selected technician is not verified yet' },
        { status: 422 },
      );
    }

    if (!techProfile.is_available) {
      return NextResponse.json(
        { error: 'Selected technician is not available' },
        { status: 422 },
      );
    }

    const { data: skill } = await rpcClient
      .from('technician_skills')
      .select('id')
      .eq('technician_id', technician_id)
      .eq('service_id', service_id)
      .eq('is_active', true)
      .maybeSingle();

    if (!skill) {
      return NextResponse.json(
        { error: 'Selected technician does not offer this service' },
        { status: 422 },
      );
    }
  }

  const { data: booking, error: bookingError } = await writeClient
    .from('bookings')
    .insert({
      customer_id: auth.user.id,
      service_id,
      technician_id: technician_id ?? null,
      description,
      location_address,
      location_lat: location_lat ?? null,
      location_lng: location_lng ?? null,
      preferred_time: preferred_time ? new Date(preferred_time).toISOString() : null,
      status: technician_id ? 'matched' : 'pending',
    })
    .select()
    .single();

  if (bookingError) {
    return NextResponse.json({ error: bookingError.message }, { status: 500 });
  }

  if (image_urls.length > 0) {
    const { error: imagesError } = await writeClient.from('booking_images').insert(
      image_urls.map((url) => ({
        booking_id: booking.id,
        image_url: url,
        image_type: 'customer',
      })),
    );

    if (imagesError) {
      console.error('Failed to save booking images:', imagesError);
    }
  }

  try {
    if (technician_id) {
      const { error: assignError } = await rpcClient.from('booking_assignments').insert({
        booking_id: booking.id,
        technician_id,
        status: 'pending',
      });

      if (assignError) {
        console.error('Direct technician assignment failed:', assignError);
        return NextResponse.json({ error: assignError.message }, { status: 500 });
      }

      const { data: updatedBooking } = await writeClient
        .from('bookings')
        .select('*, services(name_ar, name_en, slug)')
        .eq('id', booking.id)
        .single();

      if (updatedBooking) {
        const serviceName =
          (updatedBooking.services as { name_ar?: string } | null)?.name_ar ?? 'خدمة';
        await notifyBookingAssignedBatch([technician_id], {
          bookingId: booking.id,
          serviceName,
        });
        return NextResponse.json(updatedBooking, { status: 201 });
      }
    } else {
      const { error: matchError } = await rpcClient.rpc('match_technicians_for_booking', {
        p_booking_id: booking.id,
      });

      if (matchError) {
        console.error('Auto-matching failed:', matchError);
      } else {
        const { data: updatedBooking } = await writeClient
          .from('bookings')
          .select('*, services(name_ar, name_en, slug)')
          .eq('id', booking.id)
          .single();

        if (updatedBooking) {
          const { data: assignments } = await writeClient
            .from('booking_assignments')
            .select('technician_id')
            .eq('booking_id', booking.id)
            .eq('status', 'pending');

          if (assignments && assignments.length > 0) {
            const serviceName =
              (updatedBooking.services as { name_ar?: string } | null)?.name_ar ?? 'خدمة';
            await notifyBookingAssignedBatch(
              assignments.map((a) => a.technician_id),
              { bookingId: booking.id, serviceName },
            );
          }

          return NextResponse.json(updatedBooking, { status: 201 });
        }
      }
    }
  } catch (e) {
    console.error('Booking assignment error:', e);
  }

  return NextResponse.json(booking, { status: 201 });
}
