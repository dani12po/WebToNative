import { NextResponse } from 'next/server';
import { markAgentServiceConnected } from '../../../../lib/platform';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || '';
    const body = await request.json();
    const connection = await markAgentServiceConnected(token, body.service);
    return NextResponse.json({ connection });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Status layanan tidak dapat diperbarui.' }, { status: 400 });
  }
}
