import path from 'node:path';

/** Keep Next.js tracing inside dashboard even though the generator has its own lockfile. */
export default {
  outputFileTracingRoot: path.resolve(process.cwd()),
  // Build production uses a separate directory, so it cannot remove chunks
  // being served by `next dev` on another terminal.
  distDir: process.env.NODE_ENV === 'production' ? '.next-production' : '.next',
  webpack(config, { dev }) {
    // On Windows, persistent Webpack cache can occasionally leave a missing
    // numbered chunk after hot reload. Development builds are small enough to
    // prefer stability over that cache.
    if (dev) config.cache = false;
    return config;
  }
};
