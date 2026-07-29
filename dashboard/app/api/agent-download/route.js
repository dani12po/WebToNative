import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

export const runtime = 'nodejs';

const fileName = 'WebToNative-Agent-win-x64.exe';

async function getAgent() {
  const externalUrl = process.env.WEBTONATIVE_AGENT_DOWNLOAD_URL;
  const expectedHash = String(process.env.WEBTONATIVE_AGENT_SHA256 || '').trim().toLowerCase();

  if (externalUrl) {
    if (!expectedHash) throw new Error('Checksum agent belum dikonfigurasi di server dashboard.');
    const response = await fetch(externalUrl);
    if (!response.ok || !response.body) throw new Error('Binary agent tidak dapat diambil dari storage.');
    return { body: response.body, sha256: expectedHash };
  }

  // Fallback hanya untuk dashboard lokal: binary hasil `npm run build:agent`
  // berada satu tingkat di atas folder dashboard.
  const localFile = path.resolve(process.cwd(), '..', 'dist', 'agent', fileName);
  try {
    const body = await readFile(localFile);
    return { body, sha256: createHash('sha256').update(body).digest('hex') };
  } catch {
    throw new Error('Binary agent belum tersedia. Administrator perlu build agent atau mengatur WEBTONATIVE_AGENT_DOWNLOAD_URL.');
  }
}

export async function GET(request) {
  try {
    const agent = await getAgent();
    if (new URL(request.url).searchParams.get('meta') === '1') return Response.json({ fileName, sha256: agent.sha256 });
    return new Response(agent.body, {
      headers: {
        'Content-Type': 'application/vnd.microsoft.portable-executable',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-store',
        'X-WebToNative-Agent-Sha256': agent.sha256
      }
    });
  } catch (error) {
    return Response.json({ error: error.message || 'Agent tidak tersedia.' }, { status: 503 });
  }
}
