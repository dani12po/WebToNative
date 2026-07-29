import { build } from 'esbuild';
import { copyFile, mkdir, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'dist', 'agent');
const bundle = path.join(output, 'webtonative-agent.cjs');
const blob = path.join(output, 'webtonative-agent.blob');
const config = path.join(output, 'sea-config.json');
const executable = path.join(output, process.platform === 'win32' ? 'WebToNative-Agent-win-x64.exe' : 'webtonative-agent');

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await build({
  entryPoints: [path.join(root, 'scripts', 'agent-entry.js')],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node20',
  outfile: bundle,
  legalComments: 'none',
  alias: { open: path.join(root, 'scripts', 'agent-open-shim.js') }
});
await writeFile(config, JSON.stringify({ main: bundle, output: blob, disableExperimentalSEAWarning: true }, null, 2));

function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} gagal dengan kode ${result.status}.`);
}

run(process.execPath, ['--experimental-sea-config', config]);
await copyFile(process.execPath, executable);
run(path.join(root, 'node_modules', '.bin', process.platform === 'win32' ? 'postject.cmd' : 'postject'), [executable, 'NODE_SEA_BLOB', blob, '--sentinel-fuse', 'NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2']);
console.log(`Agent binary siap: ${executable}`);
