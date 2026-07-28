import { NextResponse } from 'next/server';
import { adminClient, requireUser } from '../../../../../lib/supabase-server';
import { createEncryptedBackup } from '../../../../../lib/secrets';

export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  try {
    const user = await requireUser(request);
    const { backupPassword } = await request.json();
    const { data, error } = await adminClient().from('connected_services').select('*').eq('id', (await params).id).eq('user_id', user.id).single();
    if (error || !data) throw new Error('Koneksi tidak ditemukan.');
    const backup = createEncryptedBackup(data, backupPassword);
    return new NextResponse(JSON.stringify(backup, null, 2), { headers: { 'Content-Type': 'application/json', 'Content-Disposition': `attachment; filename="webtonative-${data.provider}-${Date.now()}.json"` } });
  } catch (error) { return NextResponse.json({ error: error.message || 'Backup gagal dibuat.' }, { status: 400 }); }
}
