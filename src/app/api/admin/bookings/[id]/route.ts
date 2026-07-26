import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createServiceRoleClient, isServiceRoleConfigured } from '@/lib/supabase/admin';
import { requireAuth, requireAdmin } from '@/lib/api/auth';
import { adminEntityIdSchema } from '@/lib/validations/admin';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const rawParams = await params;
  const idParsed = adminEntityIdSchema.safeParse(rawParams);
  if (!idParsed.success) {
    return NextResponse.json({ error: 'Invalid booking ID' }, { status: 400 });
  }
  const { id } = idParsed.data;

  const supabase = await createServerSupabaseClient();
  const auth = await requireAuth(supabase);
  if ('response' in auth) return auth.response;

  const admin = await requireAdmin(supabase, auth.user);
  if ('response' in admin) return admin.response;

  const db = isServiceRoleConfigured() ? createServiceRoleClient() : supabase;

  const { data, error } = await db
    .from('bookings')
    .select(
      `
      *,
      services(*),
      booking_images(image_url, image_type),
      customer:profiles!bookings_customer_id_fkey(id, full_name, email, phone),
      technician:profiles!bookings_technician_id_fkey(id, full_name, email, phone)
    `,
    )
    .eq('id', id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: error.code === 'PGRST116' ? 404 : 500 });
  }

  return NextResponse.json(data);
}

/**
 * Deletes a booking and everything hanging off it. Every child FK on
 * bookings(id) is already ON DELETE CASCADE — booking_images,
 * booking_assignments, reviews, payments and chat_conversations (which in turn
 * cascades to chat_messages) — so Postgres does the teardown.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const rawParams = await params;
  const idParsed = adminEntityIdSchema.safeParse(rawParams);
  if (!idParsed.success) {
    return NextResponse.json({ error: 'Invalid booking ID' }, { status: 400 });
  }
  const { id } = idParsed.data;

  const supabase = await createServerSupabaseClient();
  const auth = await requireAuth(supabase);
  if ('response' in auth) return auth.response;

  const admin = await requireAdmin(supabase, auth.user);
  if ('response' in admin) return admin.response;

  const db = isServiceRoleConfigured() ? createServiceRoleClient() : supabase;

  const { data: booking } = await db
    .from('bookings')
    .select('id, status, customer_id, technician_id, service_id')
    .eq('id', id)
    .maybeSingle();

  if (!booking) {
    return NextResponse.json({ error: 'ADMIN_BOOKING_NOT_FOUND' }, { status: 404 });
  }

  await supabase.from('audit_logs').insert({
    admin_id: auth.user.id,
    action: 'booking_delete',
    entity_type: 'booking',
    entity_id: id,
    metadata: {
      status: booking.status,
      customer_id: booking.customer_id,
      technician_id: booking.technician_id,
      service_id: booking.service_id,
    },
  });

  const { error: deleteError } = await db.from('bookings').delete().eq('id', id);

  if (deleteError) {
    return NextResponse.json(
      { error: 'ADMIN_DELETE_BOOKING_FAILED', detail: deleteError.message },
      { status: deleteError.code === '23503' ? 409 : 500 },
    );
  }

  return NextResponse.json({ id, deleted: true });
}
