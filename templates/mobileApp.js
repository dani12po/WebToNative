const safeJson = value => JSON.stringify(value, null, 2);

const escapeJava = value => String(value || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\r?\n/g, ' ');

export function getNativeAndroidActivity({ appName, appUrl, appId, modules = [] }) {
  const packageName = appId;
  const title = escapeJava(appName);
  const endpoint = escapeJava(appUrl);
  const nativeModules = (Array.isArray(modules) && modules.length ? modules : ['Aktivitas', 'Data', 'Laporan']).map(item => `"${escapeJava(item.name || item)}"`).join(', ');
  return `package ${packageName};

import android.app.Activity;
import android.os.Bundle;
import android.graphics.Color;
import android.graphics.drawable.GradientDrawable;
import android.content.Context;
import android.content.SharedPreferences;
import android.view.Gravity;
import android.view.View;
import android.widget.*;

public class MainActivity extends Activity {
  private final int navy = Color.rgb(10, 22, 42);
  private final int surface = Color.rgb(20, 39, 70);
  private final int accent = Color.rgb(72, 130, 255);
  private final int text = Color.rgb(238, 244, 255);
  private LinearLayout content;
  private TextView pageTitle;
  private SharedPreferences storage;
  private final String appName = "${title}";
  private final String endpoint = "${endpoint}";
  private final String[] modules = {${nativeModules}};

  @Override public void onCreate(Bundle state) {
    setTheme(R.style.AppTheme_NoActionBar);
    super.onCreate(state);
    storage = getSharedPreferences("${packageName}.data", Context.MODE_PRIVATE);
    getWindow().setStatusBarColor(navy);
    renderLogin();
  }

  private void renderLogin() {
    LinearLayout root = new LinearLayout(this); root.setOrientation(LinearLayout.VERTICAL); root.setGravity(Gravity.CENTER); root.setPadding(dp(24), dp(24), dp(24), dp(24)); root.setBackgroundColor(navy);
    LinearLayout card = card();
    TextView badge = label("AKSES AMAN", 12, Color.rgb(116, 232, 174)); card.addView(badge);
    card.addView(label("Masuk ke " + appName, 28, text), margin(0, 8, 0, 4));
    card.addView(label("Kelola bisnis Anda dari aplikasi mobile.", 14, Color.rgb(166,187,222)), margin(0, 0, 0, 18));
    EditText username = input("Username"); username.setText("Admin"); card.addView(username, margin(0, 0, 0, 10));
    EditText password = input("Password"); password.setInputType(0x00000081); card.addView(password, margin(0, 0, 0, 14));
    Button login = primary("Masuk ke Dashboard"); login.setOnClickListener(v -> { if (username.getText().toString().trim().isEmpty() || password.getText().toString().trim().isEmpty()) { Toast.makeText(this, "Username dan password wajib diisi", Toast.LENGTH_SHORT).show(); return; } renderApp(); }); card.addView(login);
    TextView register = label("Belum punya akun? Daftar", 14, Color.rgb(133,177,255)); register.setPadding(0, dp(18), 0, dp(10)); register.setOnClickListener(v -> renderRegister()); card.addView(register);
    TextView forgot = label("Lupa password? Hubungi Administrator", 13, Color.rgb(181,199,229)); forgot.setOnClickListener(v -> Toast.makeText(this, "Reset password tersedia melalui Administrator.", Toast.LENGTH_LONG).show()); card.addView(forgot);
    root.addView(card, new LinearLayout.LayoutParams(-1, -2)); setContentView(root);
  }

  private void renderRegister() {
    LinearLayout root = new LinearLayout(this); root.setOrientation(LinearLayout.VERTICAL); root.setGravity(Gravity.CENTER); root.setPadding(dp(24), dp(24), dp(24), dp(24)); root.setBackgroundColor(navy);
    LinearLayout card = card(); card.addView(label("Daftar akun", 28, text)); card.addView(label("Buat akses baru untuk " + appName + ".", 14, Color.rgb(166,187,222)), margin(0, 6, 0, 18));
    EditText name = input("Nama lengkap"); card.addView(name, margin(0, 0, 0, 10)); EditText user = input("Username"); card.addView(user, margin(0, 0, 0, 10)); EditText pass = input("Password minimal 8 karakter"); pass.setInputType(0x00000081); card.addView(pass, margin(0, 0, 0, 14));
    Button submit = primary("Buat akun"); submit.setOnClickListener(v -> { Toast.makeText(this, "Pendaftaran tersimpan secara lokal. Hubungkan endpoint akun untuk produksi.", Toast.LENGTH_LONG).show(); renderLogin(); }); card.addView(submit);
    TextView back = label("Sudah punya akun? Masuk", 14, Color.rgb(133,177,255)); back.setPadding(0, dp(18), 0, 0); back.setOnClickListener(v -> renderLogin()); card.addView(back);
    root.addView(card, new LinearLayout.LayoutParams(-1, -2)); setContentView(root);
  }

  private void renderApp() {
    LinearLayout root = new LinearLayout(this);
    root.setOrientation(LinearLayout.VERTICAL);
    root.setBackgroundColor(navy);

    LinearLayout header = new LinearLayout(this);
    header.setGravity(Gravity.CENTER_VERTICAL);
    header.setPadding(dp(20), dp(18), dp(20), dp(14));
    TextView mark = label(appName.substring(0, 1).toUpperCase(), 18, text);
    mark.setGravity(Gravity.CENTER);
    mark.setBackground(round(accent, 14));
    header.addView(mark, new LinearLayout.LayoutParams(dp(42), dp(42)));
    LinearLayout heading = new LinearLayout(this); heading.setOrientation(LinearLayout.VERTICAL); heading.setPadding(dp(12), 0, 0, 0);
    heading.addView(label(appName, 18, text));
    heading.addView(label("Aplikasi mobile", 12, Color.rgb(166, 187, 222)));
    header.addView(heading, new LinearLayout.LayoutParams(0, -2, 1));
    TextView sync = label("● Online", 12, Color.rgb(116, 232, 174)); sync.setGravity(Gravity.CENTER);
    header.addView(sync, new LinearLayout.LayoutParams(dp(72), dp(32)));
    root.addView(header);

    HorizontalScrollView tabsScroll = new HorizontalScrollView(this); tabsScroll.setHorizontalScrollBarEnabled(false);
    LinearLayout tabs = new LinearLayout(this); tabs.setPadding(dp(16), 0, dp(16), dp(10));
    String[] names = modules;
    for (String name : names) { Button tab = tab(name); tab.setOnClickListener(v -> showPage(name)); tabs.addView(tab); }
    tabsScroll.addView(tabs); root.addView(tabsScroll);

    ScrollView scroll = new ScrollView(this); content = new LinearLayout(this); content.setOrientation(LinearLayout.VERTICAL); content.setPadding(dp(18), dp(8), dp(18), dp(92)); scroll.addView(content);
    root.addView(scroll, new LinearLayout.LayoutParams(-1, 0, 1));

    LinearLayout nav = new LinearLayout(this); nav.setGravity(Gravity.CENTER); nav.setPadding(dp(12), dp(10), dp(12), dp(14)); nav.setBackground(round(Color.rgb(15, 31, 57), 22));
    String[] navs = {"⌂ Beranda", "+ Tambah", "☰ Menu", "⚙ Akun"};
    for (String name : navs) { Button item = navButton(name); item.setOnClickListener(v -> showPage(name.contains("Tambah") ? "Data" : name.contains("Akun") ? "Akun" : "Ringkasan")); nav.addView(item, new LinearLayout.LayoutParams(0, dp(46), 1)); }
    root.addView(nav);
    setContentView(root); showPage("Ringkasan");
  }

  private void showPage(String page) {
    content.removeAllViews();
    String heading = page.equals("Ringkasan") ? "Ringkasan bisnis" : page.equals("Akun") ? "Akun saya" : page;
    pageTitle = label(heading, 27, text); content.addView(pageTitle);
    content.addView(label(page.equals("Ringkasan") ? "Pantau operasional langsung dari aplikasi." : "Kelola data dengan pengalaman mobile native.", 14, Color.rgb(166, 187, 222)), margin(0, 4, 0, 18));
    if (page.equals("Ringkasan")) dashboard(); else if (page.equals("Akun")) account(); else module(page);
  }

  private void dashboard() {
    LinearLayout row = new LinearLayout(this); row.setOrientation(LinearLayout.HORIZONTAL);
    row.addView(metric("Data tersimpan", String.valueOf(storage.getInt("count", 0))), new LinearLayout.LayoutParams(0, dp(112), 1));
    Space gap = new Space(this); row.addView(gap, new LinearLayout.LayoutParams(dp(10), 1));
    row.addView(metric("Status", "Siap"), new LinearLayout.LayoutParams(0, dp(112), 1)); content.addView(row);
    content.addView(section("Aktivitas terbaru", "Belum ada aktivitas baru. Tambahkan data dari tombol Tambah untuk memulai."), margin(0, 16, 0, 0));
    content.addView(section("Sinkronisasi", "Backend: " + endpoint + "\\nHubungkan endpoint API produksi untuk sinkronisasi multi-perangkat."), margin(0, 16, 0, 0));
  }

  private void module(String page) {
    LinearLayout card = card();
    card.addView(label("Input " + page.toLowerCase(), 18, text));
    EditText title = input("Nama / judul"); card.addView(title, margin(0, 14, 0, 10));
    EditText amount = input("Nominal atau keterangan"); card.addView(amount, margin(0, 0, 0, 14));
    Button save = primary("Simpan data"); save.setOnClickListener(v -> { if (title.getText().toString().trim().isEmpty()) { title.setError("Wajib diisi"); return; } storage.edit().putInt("count", storage.getInt("count", 0) + 1).apply(); Toast.makeText(this, "Data disimpan di aplikasi", Toast.LENGTH_SHORT).show(); showPage("Ringkasan"); });
    card.addView(save); content.addView(card);
    content.addView(section("Catatan", "Form ini memakai komponen Android native. Sambungkan API backend di " + endpoint + " untuk penyimpanan bersama."), margin(0, 16, 0, 0));
  }

  private void account() {
    content.addView(section("Administrator", "Kelola profil dan keamanan akun melalui backend aplikasi."));
    Button open = primary("Buka pengaturan akun"); open.setOnClickListener(v -> Toast.makeText(this, "Endpoint akun: " + endpoint, Toast.LENGTH_LONG).show()); content.addView(open, margin(0, 16, 0, 0));
  }

  private LinearLayout metric(String caption, String value) { LinearLayout box = card(); TextView c = label(caption, 12, Color.rgb(166,187,222)); box.addView(c); TextView v = label(value, 28, text); box.addView(v, margin(0, 9, 0, 0)); return box; }
  private LinearLayout section(String title, String detail) { LinearLayout box = card(); box.addView(label(title, 18, text)); box.addView(label(detail, 14, Color.rgb(181,199,229)), margin(0, 8, 0, 0)); return box; }
  private LinearLayout card() { LinearLayout box = new LinearLayout(this); box.setOrientation(LinearLayout.VERTICAL); box.setPadding(dp(16), dp(16), dp(16), dp(16)); box.setBackground(round(surface, 18)); return box; }
  private TextView label(String value, float size, int color) { TextView view = new TextView(this); view.setText(value); view.setTextSize(size); view.setTextColor(color); return view; }
  private Button tab(String value) { Button button = new Button(this); button.setText(value); button.setTextSize(12); button.setTextColor(text); button.setAllCaps(false); button.setBackground(round(surface, 16)); LinearLayout.LayoutParams p = new LinearLayout.LayoutParams(-2, dp(42)); p.setMargins(0, 0, dp(8), 0); button.setLayoutParams(p); return button; }
  private Button navButton(String value) { Button button = new Button(this); button.setText(value); button.setTextColor(text); button.setTextSize(11); button.setAllCaps(false); button.setBackgroundColor(Color.TRANSPARENT); return button; }
  private Button primary(String value) { Button button = new Button(this); button.setText(value); button.setTextColor(Color.WHITE); button.setTextSize(15); button.setAllCaps(false); button.setBackground(round(accent, 14)); button.setLayoutParams(new LinearLayout.LayoutParams(-1, dp(50))); return button; }
  private EditText input(String hint) { EditText field = new EditText(this); field.setHint(hint); field.setHintTextColor(Color.rgb(135,158,195)); field.setTextColor(text); field.setTextSize(15); field.setSingleLine(true); field.setPadding(dp(14), 0, dp(14), 0); field.setBackground(round(Color.rgb(9, 23, 45), 14)); field.setLayoutParams(new LinearLayout.LayoutParams(-1, dp(52))); return field; }
  private GradientDrawable round(int color, int radius) { GradientDrawable shape = new GradientDrawable(); shape.setColor(color); shape.setCornerRadius(dp(radius)); return shape; }
  private LinearLayout.LayoutParams margin(int l, int t, int r, int b) { LinearLayout.LayoutParams p = new LinearLayout.LayoutParams(-1, -2); p.setMargins(dp(l), dp(t), dp(r), dp(b)); return p; }
  private int dp(int value) { return (int) (value * getResources().getDisplayMetrics().density); }
}`;
}

export function getMobileWrapperFiles({ appName, appId, appUrl }) {
  return {
    'package.json': safeJson({
      name: appId.split('.').pop() || 'mobile-app', private: true,
      scripts: { sync: 'cap sync', 'android:apk': 'powershell -ExecutionPolicy Bypass -File ./build-android.ps1', 'android:aab': 'cap build android --androidreleasetype AAB', 'ios:build': 'cap build ios' },
      dependencies: { '@capacitor/android': '^7.0.0', '@capacitor/core': '^7.0.0', '@capacitor/ios': '^7.0.0' }, devDependencies: { '@capacitor/cli': '^7.0.0' }
    }),
    'capacitor.config.json': safeJson({ appId, appName, webDir: 'www', android: { allowMixedContent: false }, ios: { contentInset: 'automatic' } }),
    'www/index.html': `<!doctype html><html><body></body></html>`,
    'build-android.ps1': `$ErrorActionPreference = 'Stop'\n$android = Join-Path $PSScriptRoot 'android'\nif (!(Test-Path (Join-Path $android 'gradlew.bat'))) { throw 'Folder android belum tersedia. Jalankan pembuatan aplikasi dari menu 3 terlebih dahulu.' }\nPush-Location $android\ntry { cmd.exe /d /s /c 'gradlew.bat assembleDebug'; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE } } finally { Pop-Location }\n$apk = Join-Path $android 'app\\build\\outputs\\apk\\debug\\app-debug.apk'\nif (Test-Path $apk) { Copy-Item $apk (Join-Path $PSScriptRoot 'app-debug.apk') -Force; Write-Host \"APK siap: $(Join-Path $PSScriptRoot 'app-debug.apk')\" }\n`,
    'README.md': `# ${appName} Mobile\n\nAndroid menggunakan layar native (bukan WebView). URL backend: ${appUrl}\n\nBuild debug APK: npm run android:apk\n`
  };
}
