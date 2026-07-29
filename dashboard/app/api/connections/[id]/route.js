import { NextResponse } from 'next/server';
import { adminClient, requireUser } from '../../../../lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const user = await requireUser(request);
    const { data, error } = await adminClient().from('connected_services').select('id, provider, label, account_hint, secret_payload, created_at, updated_at').eq('id', (await params).id).eq('user_id', user.id).single();
    if (error || !data) throw new Error('Koneksi tidak ditemukan.');
    return NextResponse.json({ connection: data });
  } catch (error) { return NextResponse.json({ error: error.message || 'Koneksi gagal dimuat.' }, { status: 404 }); }
}

export async function DELETE(request, { params }) {
  try {
    const user = await requireUser(request);
    const { error } = await adminClient().from('connected_services').delete().eq('id', (await params).id).eq('user_id', user.id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) { return NextResponse.json({ error: error.message || 'Koneksi gagal dihapus.' }, { status: 400 }); }
}
