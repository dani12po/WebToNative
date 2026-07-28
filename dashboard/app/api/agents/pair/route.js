import { NextResponse } from 'next/server';
import { createPairing } from '../../../../lib/platform';
import { requireUser } from '../../../../lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try { const user = await requireUser(request); return NextResponse.json(await createPairing(user.id), { status: 201 }); }
  catch (error) { return NextResponse.json({ error: error.message || 'Kode koneksi gagal dibuat.' }, { status: 401 }); }
}
