import { NextResponse } from 'next/server';
import { assertJobReadiness, createUserJob, listUserJobs } from '../../../lib/platform';
import { requireUser } from '../../../lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try { const user = await requireUser(request); return NextResponse.json({ jobs: await listUserJobs(user.id) }); }
  catch (error) { return NextResponse.json({ error: error.message || 'Tidak dapat memuat job.' }, { status: 401 }); }
}

export async function POST(request) {
  try {
    const user = await requireUser(request);
    const input = await request.json();
    if (input.flow !== 'service_login') await assertJobReadiness(user.id, input.flow, { requireAi: Boolean(input.aiEnabled) });
    const job = await createUserJob(user.id, input);
    return NextResponse.json({ job }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Job gagal dibuat.' }, { status: 400 });
  }
}
