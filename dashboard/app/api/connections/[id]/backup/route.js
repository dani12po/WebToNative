import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST() {
  return NextResponse.json({ error: 'Ekspor vault dilakukan di browser agar server tidak pernah mendekripsi rahasia pengguna.' }, { status: 410 });
}
