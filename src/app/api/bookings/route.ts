import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createServiceRoleClient, isServiceRoleConfigured } from '@/lib/supabase/admin';
import { requireAuth } from '@/lib/api/auth';
import { parseJsonBody, parseSearchParams } from '@/lib/api/validate';
import { createBookingSchema, listBookingsQuerySchema } from '@/lib/validations/booking';
import {
  notifyBookingAssignedBatch,
  notifyAdminsBookingNeedsAssignment,
} from '@/lib/notifications/events';
import { logger } from '@/lib/logger';
import { resolveTechnicianServicePrice } from '@/lib/pricing/technician-service-price';
import { preferredTimeLocalToIso } from '@/lib/datetime/cairo';
import { normalizeEgyptCoords } from '@/lib/geo/normalize-coords';
import { loadTechnicianPublicIdentities } from '@/lib/booking/technician-public-identity';

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const auth = await requireAuth(supabase);
  if ('response' in auth) return auth.response;

  const query = parseSearchParams(request.nextUrl.searchParams, listBookingsQuerySchema);
  if ('response' in query) return query.response;

  const { status, limit, offset } = query.data;

  let dbQuery = supabase
    .from('bookings')
    .select(
      `*,
      services(name_ar, name_en, slug, price, service_categories(name_ar, name_en))`,
    )
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

  const rows = data ?? [];
  const identities = await loadTechnicianPublicIdentities(
    rows.map((row) => row.technician_id),
  );
  const withTechnician = rows.map((row) => {
    const identity = row.technician_id ? identities.get(row.technician_id) : undefined;
    return {
      ...row,
      technician: identity?.technician ?? null,
      technician_profile: identity?.technician_profile ?? null,
    };
  });

  return NextResponse.json(withTechnician);
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const auth = await requireAuth(supabase);
  if ('response' in auth) return auth.response;

  const parsed = await parseJsonBody(request, createBookingSchema);
  if ('response' in parsed) return parsed.response;

  const { service_id, description, location_address, location_lat, location_lng, apartment_number, floor_number, preferred_time, image_urls, technician_id } =
    parsed.data;

  const rpcClient = isServiceRoleConfigured() ? createServiceRoleClient() : supabase;
  const writeClient = rpcClient;

  let priceQuote: number | null = null;

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
      .select(
        `
        id,
        price_override,
        services(price)
      `,
      )
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

    const serviceJoin = skill.services as unknown as {
      id: string;
      price: number | null;
      service_categories: { slug: string; name_ar: string } | null;
    } | null;
    priceQuote = resolveTechnicianServicePrice(
      [
        {
          is_active: true,
          price_override: skill.price_override,
          services: serviceJoin,
        },
      ],
      service_id,
    );
    if (priceQuote <= 0) {
      const { data: serviceRow } = await rpcClient
        .from('services')
        .select('price')
        .eq('id', service_id)
        .maybeSingle();
      if (serviceRow?.price != null) priceQuote = Number(serviceRow.price);
    }
  } else {
    const { data: serviceRow } = await rpcClient.from('services').select('price').eq('id', service_id).maybeSingle();
    if (serviceRow?.price != null) priceQuote = Number(serviceRow.price);
  }

  const normalizedCoords =
    location_lat != null && location_lng != null
      ? normalizeEgyptCoords(location_lat, location_lng)
      : { lat: location_lat ?? null, lng: location_lng ?? null };

  let preferredTimeIso: string | null = null;
  if (typeof preferred_time === 'string' && preferred_time.trim()) {
    preferredTimeIso = preferredTimeLocalToIso(preferred_time);
    if (!preferredTimeIso) {
      return NextResponse.json({ error: 'الوقت المفضل غير صالح' }, { status: 400 });
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
      location_lat: normalizedCoords.lat,
      location_lng: normalizedCoords.lng,
      apartment_number: apartment_number ?? null,
      floor_number: floor_number ?? null,
      preferred_time: preferredTimeIso,
      price_quote: priceQuote,
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
      logger.error('Failed to save booking images', imagesError, { bookingId: booking.id });
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
        logger.error('Direct technician assignment failed', assignError, {
          bookingId: booking.id,
          technicianId: technician_id,
        });
        // Roll the booking back to an unassigned state and alert admins so it is
        // not left as a "matched" booking with no assignment row.
        // Still return 201 so the customer can open their pending booking.
        const { data: rolledBack } = await writeClient
          .from('bookings')
          .update({ status: 'pending', technician_id: null })
          .eq('id', booking.id)
          .select('*, services(name_ar, name_en, slug)')
          .single();
        await notifyAdminsBookingNeedsAssignment({ bookingId: booking.id });
        return NextResponse.json(
          {
            ...(rolledBack ?? { ...booking, status: 'pending', technician_id: null }),
            needs_manual_assignment: true,
          },
          { status: 201 },
        );
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

      const { data: updatedBooking } = await writeClient
        .from('bookings')
        .select('*, services(name_ar, name_en, slug)')
        .eq('id', booking.id)
        .single();

      const serviceName =
        (updatedBooking?.services as { name_ar?: string } | null)?.name_ar ?? 'خدمة';

      if (matchError) {
        // The booking exists but auto-matching failed — do not report success
        // silently; alert admins so it can be assigned manually.
        logger.error('Auto-matching failed', matchError, { bookingId: booking.id });
        await notifyAdminsBookingNeedsAssignment({ bookingId: booking.id, serviceName });
        return NextResponse.json(
          { ...(updatedBooking ?? booking), needs_manual_assignment: true },
          { status: 201 },
        );
      }

      const { data: assignments } = await writeClient
        .from('booking_assignments')
        .select('technician_id')
        .eq('booking_id', booking.id)
        .eq('status', 'pending');

      if (assignments && assignments.length > 0) {
        await notifyBookingAssignedBatch(
          assignments.map((a) => a.technician_id),
          { bookingId: booking.id, serviceName },
        );
      } else {
        // RPC ran but matched no technician — surface to admins for manual assignment.
        logger.warn('Auto-matching produced no assignments', { bookingId: booking.id });
        await notifyAdminsBookingNeedsAssignment({ bookingId: booking.id, serviceName });
      }

      return NextResponse.json(updatedBooking ?? booking, { status: 201 });
    }
  } catch (e) {
    logger.error('Booking assignment error', e instanceof Error ? e : undefined, {
      bookingId: booking.id,
    });
  }

  return NextResponse.json(booking, { status: 201 });
}
