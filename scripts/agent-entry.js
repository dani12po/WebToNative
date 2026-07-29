#!/usr/bin/env node
// Entry khusus untuk binary WebToNative Agent. Flag ini mencegah index.js
// membuka menu interaktif ketika diimpor oleh agent background.
process.env.WEBTONATIVE_AGENT_EMBEDDED = '1';
import('./web-dashboard-agent.js').catch(error => {
  console.error(`WebToNative Agent gagal dijalankan: ${error.message}`);
  process.exitCode = 1;
});
