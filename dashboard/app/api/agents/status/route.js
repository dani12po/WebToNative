import { NextResponse } from 'next/server';
import { listUserAgents } from '../../../../lib/platform';
import { requireUser } from '../../../../lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try { const user = await requireUser(request); const agents = await listUserAgents(user.id); return NextResponse.json({ agents, active: agents.find(agent => agent.online) || null }); }
  catch (error) { return NextResponse.json({ error: error.message || 'Tidak dapat memuat perangkat.' }, { status: 401 }); }
}
