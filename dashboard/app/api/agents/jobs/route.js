import { NextResponse } from 'next/server';
import { claimJob, requireAgent, updateJob } from '../../../../lib/platform';

export const dynamic = 'force-dynamic';

function tokenOf(request) {
  return request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || '';
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const job = await claimJob(tokenOf(request), Array.isArray(body.supportedFlows) ? body.supportedFlows : ['gas']);
    return NextResponse.json({ job });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Sesi CLI tidak sah.' }, { status: 401 });
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    const job = await updateJob(tokenOf(request), body.id, body.status, body.note, body.result);
    return NextResponse.json({ job });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Status job gagal diperbarui.' }, { status: 400 });
  }
}

export async function GET(request) {
  try {
    const agent = await requireAgent(tokenOf(request));
    return NextResponse.json({ agent });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Sesi CLI tidak sah.' }, { status: 401 });
  }
}
