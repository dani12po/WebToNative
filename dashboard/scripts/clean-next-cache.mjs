import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cache = path.join(root, '.next');

try {
  await fs.rm(cache, { recursive: true, force: true, maxRetries: 3, retryDelay: 300 });
  console.log('Cache Next.js dibersihkan.');
} catch (error) {
  if (error.code === 'EBUSY' || error.code === 'EPERM') {
    console.warn('Cache Next.js sedang dipakai proses lain. Hentikan server dashboard lama dengan Ctrl+C sebelum menjalankan server baru.');
  } else {
    throw error;
  }
}
