const safeJson = value => JSON.stringify(value, null, 2);

export function getMobileWrapperFiles({ appName, appId, appUrl }) {
  return {
    'package.json': safeJson({
      name: appId.split('.').pop() || 'mobile-wrapper',
      private: true,
      scripts: {
        sync: 'cap sync',
        'android:apk': 'cd android && gradlew.bat assembleDebug',
        'android:aab': 'cap build android --androidreleasetype AAB',
        'ios:build': 'cap build ios'
      },
      dependencies: { '@capacitor/android': '^7.0.0', '@capacitor/core': '^7.0.0', '@capacitor/ios': '^7.0.0' },
      devDependencies: { '@capacitor/cli': '^7.0.0' }
    }),
    'capacitor.config.json': safeJson({
      appId,
      appName,
      webDir: 'www',
      server: { url: appUrl, cleartext: false },
      android: { allowMixedContent: false },
      ios: { contentInset: 'automatic' }
    }),
    'www/index.html': `<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#08111f"><title>${appName}</title><style>html,body{margin:0;height:100%;background:#08111f;color:#eaf1ff;font-family:system-ui}main{height:100%;display:grid;place-items:center;text-align:center;padding:2rem}p{color:#aebed5}</style></head><body><main><div><strong>${appName}</strong><p>Menyiapkan aplikasi…</p></div></main></body></html>`,
    'README.md': `# ${appName} — Mobile wrapper

Wrapper Capacitor ini membuka aplikasi web pada URL berikut:

URL: ${appUrl}

## Android APK

    npm install
    npm run sync
    npm run android:apk

Perlu Android Studio, Android SDK, dan JDK. APK hasil build berada di folder proyek Android yang dibuat Capacitor.

## iOS

Jalankan dari macOS dengan Xcode dan akun Apple Developer:

    npm install
    npm run sync
    npm run ios:build

Signing dan upload App Store wajib dilakukan menggunakan akun Apple pemilik aplikasi.
`
  };
}
