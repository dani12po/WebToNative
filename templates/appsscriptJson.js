/**
 * Template untuk appsscript.json (manifest wajib clasp)
 * Mengaktifkan Web App dengan akses ANYONE (bisa diubah sesuai kebutuhan)
 */
export function getAppsscriptJsonTemplate() {
  const manifest = {
    timeZone: "Asia/Jakarta",
    dependencies: {},
    webapp: {
      access: "ANYONE_ANONYMOUS",
      executeAs: "USER_DEPLOYING"
    },
    exceptionLogging: "STACKDRIVER",
    runtimeVersion: "V8"
  };

  return JSON.stringify(manifest, null, 2);
}
