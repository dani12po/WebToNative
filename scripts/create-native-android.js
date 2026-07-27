#!/usr/bin/env node
/* Generator Android native mandiri: Node.js built-in modules only. */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = path.resolve(process.argv[2] || 'android-native-app');
const pkg = 'com.otomatis.applengkap';
const java = path.join(root, 'app', 'src', 'main', 'java', ...pkg.split('.'));
const res = path.join(root, 'app', 'src', 'main', 'res');
const write = (file, body) => { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, body.trimStart(), 'utf8'); };

write(path.join(root, 'settings.gradle.kts'), `pluginManagement { repositories { google(); mavenCentral(); gradlePluginPortal() } }
dependencyResolutionManagement { repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS); repositories { google(); mavenCentral() } }
rootProject.name = "AplikasiLengkap"
include(":app")
`);
write(path.join(root, 'build.gradle.kts'), `plugins {
  id("com.android.application") version "8.7.3" apply false
  id("org.jetbrains.kotlin.android") version "2.0.21" apply false
}
`);
write(path.join(root, 'gradle.properties'), `org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
kotlin.code.style=official
`);
write(path.join(root, 'app', 'build.gradle.kts'), `plugins { id("com.android.application"); id("org.jetbrains.kotlin.android") }

android { namespace = "${pkg}"; compileSdk = 35
  defaultConfig { applicationId = "${pkg}"; minSdk = 24; targetSdk = 35; versionCode = 1; versionName = "1.0" }
}
dependencies {
  implementation("androidx.core:core-ktx:1.15.0")
  implementation("androidx.appcompat:appcompat:1.7.0")
  implementation("com.google.android.material:material:1.12.0")
  implementation("androidx.cardview:cardview:1.0.0")
  implementation("androidx.recyclerview:recyclerview:1.3.2")
}
`);
write(path.join(root, 'app', 'src', 'main', 'AndroidManifest.xml'), `<manifest xmlns:android="http://schemas.android.com/apk/res/android"><application android:theme="@style/Theme.AplikasiLengkap" android:label="Aplikasi Lengkap"><activity android:name=".DashboardActivity" android:exported="false"/><activity android:name=".LoginActivity" android:exported="true"><intent-filter><action android:name="android.intent.action.MAIN"/><category android:name="android.intent.category.LAUNCHER"/></intent-filter></activity></application></manifest>`);
write(path.join(res, 'values', 'colors.xml'), `<resources><color name="primary">#246BFD</color><color name="primaryDark">#12346F</color><color name="surface">#F7F9FC</color></resources>`);
write(path.join(res, 'values', 'themes.xml'), `<resources xmlns:tools="http://schemas.android.com/tools"><style name="Theme.AplikasiLengkap" parent="Theme.Material3.DayNight.NoActionBar"><item name="colorPrimary">@color/primary</item><item name="android:fontFamily">sans</item><item name="android:windowLightStatusBar">false</item></style></resources>`);
write(path.join(res, 'layout', 'activity_login.xml'), `<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android" android:layout_width="match_parent" android:layout_height="match_parent" android:orientation="vertical" android:gravity="center" android:padding="24dp" android:background="@color/surface"><TextView android:layout_width="wrap_content" android:layout_height="wrap_content" android:text="Aplikasi Lengkap" android:textSize="30sp" android:textStyle="bold" android:textColor="@color/primary"/><TextView android:layout_width="wrap_content" android:layout_height="wrap_content" android:text="Masuk untuk melanjutkan" android:layout_marginBottom="28dp"/><com.google.android.material.textfield.TextInputLayout android:layout_width="match_parent" android:layout_height="wrap_content"><com.google.android.material.textfield.TextInputEditText android:id="@+id/email" android:hint="Email" android:inputType="textEmailAddress"/></com.google.android.material.textfield.TextInputLayout><com.google.android.material.textfield.TextInputLayout android:layout_width="match_parent" android:layout_height="wrap_content"><com.google.android.material.textfield.TextInputEditText android:id="@+id/password" android:hint="Password" android:inputType="textPassword"/></com.google.android.material.textfield.TextInputLayout><com.google.android.material.button.MaterialButton android:id="@+id/login" android:layout_width="match_parent" android:layout_height="wrap_content" android:text="Login" android:layout_marginTop="18dp"/><com.google.android.material.button.MaterialButton android:id="@+id/register" android:layout_width="match_parent" android:layout_height="wrap_content" android:text="Register" style="?attr/borderlessButtonStyle"/></LinearLayout>`);
write(path.join(res, 'layout', 'activity_dashboard.xml'), `<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android" android:layout_width="match_parent" android:layout_height="match_parent" android:orientation="vertical"><com.google.android.material.appbar.MaterialToolbar android:id="@+id/toolbar" android:layout_width="match_parent" android:layout_height="?attr/actionBarSize" android:title="Aplikasi Lengkap" android:background="@color/primary" android:titleTextColor="@android:color/white"/><ScrollView android:layout_width="match_parent" android:layout_height="0dp" android:layout_weight="1"><LinearLayout android:layout_width="match_parent" android:layout_height="wrap_content" android:orientation="vertical" android:padding="16dp"><TextView android:layout_width="wrap_content" android:layout_height="wrap_content" android:text="Selamat datang!" android:textSize="25sp" android:textStyle="bold"/><TextView android:layout_width="wrap_content" android:layout_height="wrap_content" android:text="Ringkasan aktivitas Anda hari ini"/><androidx.cardview.widget.CardView android:layout_width="match_parent" android:layout_height="wrap_content" android:layout_marginTop="16dp" app:cardCornerRadius="16dp" xmlns:app="http://schemas.android.com/apk/res-auto"><TextView android:layout_width="match_parent" android:layout_height="wrap_content" android:padding="20dp" android:text="Total data\n24\nOperasional berjalan baik" android:textSize="18sp"/></androidx.cardview.widget.CardView><TextView android:layout_width="wrap_content" android:layout_height="wrap_content" android:text="Data terbaru" android:textStyle="bold" android:textSize="18sp" android:layout_marginTop="22dp"/><androidx.recyclerview.widget.RecyclerView android:id="@+id/list" android:layout_width="match_parent" android:layout_height="wrap_content"/></LinearLayout></ScrollView><com.google.android.material.bottomnavigation.BottomNavigationView android:id="@+id/bottomNav" android:layout_width="match_parent" android:layout_height="wrap_content" app:menu="@menu/navigation" xmlns:app="http://schemas.android.com/apk/res-auto"/></LinearLayout>`);
write(path.join(res, 'layout', 'item_sample.xml'), `<TextView xmlns:android="http://schemas.android.com/apk/res/android" android:id="@+id/itemText" android:layout_width="match_parent" android:layout_height="wrap_content" android:padding="18dp" android:textSize="16sp" android:background="#FFFFFFFF" android:layout_marginTop="6dp"/>`);
write(path.join(res, 'menu', 'navigation.xml'), `<menu xmlns:android="http://schemas.android.com/apk/res/android"><item android:id="@+id/nav_home" android:title="Beranda" android:icon="@android:drawable/ic_menu_view"/><item android:id="@+id/nav_data" android:title="Data" android:icon="@android:drawable/ic_menu_agenda"/><item android:id="@+id/nav_account" android:title="Akun" android:icon="@android:drawable/ic_menu_manage"/></menu>`);
write(path.join(java, 'LoginActivity.kt'), `package ${pkg}
import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.google.android.material.button.MaterialButton
import com.google.android.material.textfield.TextInputEditText
class LoginActivity: AppCompatActivity() { override fun onCreate(s: Bundle?) { super.onCreate(s); setContentView(R.layout.activity_login)
 val email=findViewById<TextInputEditText>(R.id.email); val pass=findViewById<TextInputEditText>(R.id.password)
 findViewById<MaterialButton>(R.id.login).setOnClickListener { if(email.text.isNullOrBlank()||pass.text.isNullOrBlank()) Toast.makeText(this,"Email dan password wajib diisi",Toast.LENGTH_SHORT).show() else { startActivity(Intent(this,DashboardActivity::class.java)); finish() } }
 findViewById<MaterialButton>(R.id.register).setOnClickListener { Toast.makeText(this,"Form register dapat dihubungkan ke API backend",Toast.LENGTH_SHORT).show() }
} }`);
write(path.join(java, 'DashboardActivity.kt'), `package ${pkg}
import android.os.Bundle
import android.view.LayoutInflater
import android.view.ViewGroup
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.google.android.material.bottomnavigation.BottomNavigationView
class DashboardActivity: AppCompatActivity(){ override fun onCreate(s:Bundle?){super.onCreate(s);setContentView(R.layout.activity_dashboard)
 findViewById<RecyclerView>(R.id.list).apply{layoutManager=LinearLayoutManager(this@DashboardActivity);adapter=SampleAdapter(listOf("Produk Kopi - Stok 20","Pesanan #1024 - Diproses","Laporan harian siap"))}
 findViewById<BottomNavigationView>(R.id.bottomNav).setOnItemSelectedListener { Toast.makeText(this,it.title,Toast.LENGTH_SHORT).show();true }
} }
class SampleAdapter(private val data:List<String>):RecyclerView.Adapter<SampleAdapter.H>(){class H(v:android.view.View):RecyclerView.ViewHolder(v){val text:TextView=v.findViewById(R.id.itemText)};override fun onCreateViewHolder(p:ViewGroup,t:Int)=H(LayoutInflater.from(p.context).inflate(R.layout.item_sample,p,false));override fun getItemCount()=data.size;override fun onBindViewHolder(h:H,p:Int){h.text.text=data[p]}}`);
write(path.join(root, 'README.md'), `# Android Native Generated\n\nBuka folder ini di Android Studio. LoginActivity adalah launcher.\n\nJika Gradle tersedia di PATH, skrip telah membuat Gradle Wrapper. Jika belum, Android Studio akan menawarkan sync/upgrade Gradle.\n`);

console.log(`Proyek dibuat: ${root}`);
const gradle = process.platform === 'win32' ? 'gradle.bat' : 'gradle';
const result = spawnSync(gradle, ['wrapper', '--gradle-version', '8.10.2'], { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' });
if (result.error) console.log('Gradle tidak tersedia di PATH. Buka proyek di Android Studio untuk melakukan Gradle sync.');
else console.log('Gradle Wrapper selesai dibuat. Buka proyek di Android Studio.');
