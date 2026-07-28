import { NextResponse } from 'next/server';
import { adminClient, requireUser } from '../../../../lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function DELETE(request, { params }) {
  try {
    const user = await requireUser(request);
    const { error } = await adminClient().from('connected_services').delete().eq('id', (await params).id).eq('user_id', user.id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) { return NextResponse.json({ error: error.message || 'Koneksi gagal dihapus.' }, { status: 400 }); }
}
