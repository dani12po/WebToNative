import { NextResponse } from 'next/server';
import { connectAgent } from '../../../../lib/platform';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const agent = await connectAgent(await request.json());
    // userId bukan kredensial OAuth; diperlukan agent hanya untuk memverifikasi
    // bahwa cache ciphertext lokal memang milik akun dashboard yang dipair.
    return NextResponse.json({ token: agent.token, deviceName: agent.deviceName, userId: agent.userId });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Koneksi CLI gagal.' }, { status: 400 });
  }
}
