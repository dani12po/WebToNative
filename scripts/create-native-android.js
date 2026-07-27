#!/usr/bin/env node
/* Native Android generator. Input: outputDir, sourceName, migratedNextDir, optionalApiUrl. */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const [outputArg, sourceArg = 'aplikasi', sourceDir = '', apiUrl = ''] = process.argv.slice(2);
const root = path.resolve(outputArg || 'android-native-app');
const slug = String(sourceArg).toLowerCase().replace(/[^a-z0-9]+/g, '').replace(/^([^a-z])/, 'app$1').slice(0, 40) || 'aplikasi';
const pkg = `com.otomatis.${slug}`;
const appName = sourceArg.replace(/[-_]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
const javaDir = path.join(root, 'app', 'src', 'main', 'java', ...pkg.split('.'));
const res = path.join(root, 'app', 'src', 'main', 'res');
const write = (file, body) => { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, body.trimStart(), 'utf8'); };
const xml = value => String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

function readModules() {
  const audit = path.join(sourceDir, 'MIGRATION_AUDIT.md');
  try {
    const line = fs.readFileSync(audit, 'utf8').match(/- Modul:\s*(.+)/i)?.[1] || '';
    const modules = line.split(',').map(v => v.trim()).filter(Boolean);
    if (modules.length) return modules.slice(0, 8);
  } catch {}
  const lower = sourceArg.toLowerCase();
  if (lower.includes('bimb') || lower.includes('sekolah')) return ['Data Siswa', 'Kelas', 'Absensi', 'Iuran', 'Pembayaran', 'Laporan'];
  if (lower.includes('kasir') || lower.includes('toko')) return ['Transaksi', 'Produk', 'Pelanggan', 'Pembayaran', 'Laporan', 'Pengaturan Harga'];
  return ['Dashboard', 'Data Utama', 'Pelanggan', 'Pembayaran', 'Laporan', 'Pengaturan'];
}
const modules = readModules();
const modulesKt = modules.map(v => `"${v.replace(/"/g, '\\"')}"`).join(', ');
const menuItems = modules.map((name, index) => `<item android:id="@+id/menu_${index}" android:title="${xml(name)}" android:icon="@android:drawable/ic_menu_agenda"/>`).join('');

write(path.join(root, 'settings.gradle.kts'), `pluginManagement { repositories { google(); mavenCentral(); gradlePluginPortal() } }
dependencyResolutionManagement { repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS); repositories { google(); mavenCentral() } }
rootProject.name = "${appName.replace(/"/g, '')}"
include(":app")
`);
write(path.join(root, 'build.gradle.kts'), `plugins {
  // AGP 9.1.1 is compatible with Gradle 9.3.1 and uses built-in Kotlin.
  id("com.android.application") version "9.1.1" apply false
  // Kotlin 2.x requires this plugin whenever Compose is enabled.
  id("org.jetbrains.kotlin.plugin.compose") version "2.2.10" apply false
}
`);
write(path.join(root, 'gradle.properties'), `# Kept modest so first APK build also works on PCs with a small Windows paging file.
org.gradle.jvmargs=-Xmx512m -Xss512k -Dfile.encoding=UTF-8
org.gradle.daemon=false
org.gradle.workers.max=1
android.useAndroidX=true
kotlin.code.style=official
`);
write(path.join(root, 'app', 'build.gradle.kts'), `plugins { id("com.android.application"); id("org.jetbrains.kotlin.plugin.compose") }
android { namespace = "${pkg}"; compileSdk = 35
 defaultConfig { applicationId = "${pkg}"; minSdk = 24; targetSdk = 35; versionCode = 1; versionName = "1.0.0" }
}
dependencies {
 implementation("androidx.core:core-ktx:1.15.0")
 implementation("androidx.appcompat:appcompat:1.7.0")
 implementation("com.google.android.material:material:1.12.0")
 implementation("androidx.constraintlayout:constraintlayout:2.2.0")
 implementation("androidx.recyclerview:recyclerview:1.3.2")
 implementation("androidx.cardview:cardview:1.0.0")
}
`);
write(path.join(root, 'app', 'src', 'main', 'AndroidManifest.xml'), `<manifest xmlns:android="http://schemas.android.com/apk/res/android"><uses-permission android:name="android.permission.INTERNET"/><application android:allowBackup="true" android:label="${xml(appName)}" android:theme="@style/Theme.GeneratedApp"><activity android:name=".DashboardActivity" android:exported="false"/><activity android:name=".ForgotPasswordActivity" android:exported="false"/><activity android:name=".RegisterActivity" android:exported="false"/><activity android:name=".LoginActivity" android:exported="true"><intent-filter><action android:name="android.intent.action.MAIN"/><category android:name="android.intent.category.LAUNCHER"/></intent-filter></activity></application></manifest>`);
write(path.join(res, 'values', 'colors.xml'), `<resources><color name="primary">#3157D5</color><color name="secondary">#7C4DFF</color><color name="surface">#F7F8FC</color><color name="ink">#14213D</color></resources>`);
write(path.join(res, 'values', 'themes.xml'), `<resources><style name="Theme.GeneratedApp" parent="android:style/Theme.Material.Light.NoActionBar"><item name="android:fontFamily">sans</item><item name="android:navigationBarColor">@color/surface</item></style></resources>`);
write(path.join(res, 'anim', 'slide_in.xml'), `<set xmlns:android="http://schemas.android.com/apk/res/android"><translate android:fromXDelta="12%" android:toXDelta="0" android:duration="220"/><alpha android:fromAlpha="0" android:toAlpha="1" android:duration="180"/></set>`);
write(path.join(res, 'anim', 'fade_out.xml'), `<alpha xmlns:android="http://schemas.android.com/apk/res/android" android:fromAlpha="1" android:toAlpha="0" android:duration="160"/>`);
write(path.join(res, 'menu', 'drawer_menu.xml'), `<menu xmlns:android="http://schemas.android.com/apk/res/android"><group android:checkableBehavior="single">${menuItems}</group></menu>`);
write(path.join(res, 'layout', 'activity_login.xml'), `<androidx.constraintlayout.widget.ConstraintLayout xmlns:android="http://schemas.android.com/apk/res/android" xmlns:app="http://schemas.android.com/apk/res-auto" android:layout_width="match_parent" android:layout_height="match_parent" android:padding="24dp" android:background="@color/surface"><LinearLayout android:layout_width="0dp" android:layout_height="wrap_content" android:orientation="vertical" app:layout_constraintTop_toTopOf="parent" app:layout_constraintBottom_toBottomOf="parent" app:layout_constraintStart_toStartOf="parent" app:layout_constraintEnd_toEndOf="parent"><TextView android:layout_width="wrap_content" android:layout_height="wrap_content" android:text="${xml(appName)}" android:textColor="@color/primary" android:textStyle="bold" android:textSize="16sp"/><TextView android:layout_width="wrap_content" android:layout_height="wrap_content" android:text="Kelola bisnis lebih cepat." android:textColor="@color/ink" android:textStyle="bold" android:textSize="30sp" android:layout_marginTop="10dp"/><TextView android:layout_width="wrap_content" android:layout_height="wrap_content" android:text="Masuk untuk melanjutkan ke dashboard Anda." android:layout_marginTop="8dp" android:layout_marginBottom="24dp"/><com.google.android.material.textfield.TextInputLayout android:layout_width="match_parent" android:layout_height="wrap_content"><com.google.android.material.textfield.TextInputEditText android:id="@+id/email" android:hint="Username atau email" android:inputType="textEmailAddress"/></com.google.android.material.textfield.TextInputLayout><com.google.android.material.textfield.TextInputLayout android:layout_width="match_parent" android:layout_height="wrap_content" android:layout_marginTop="12dp"><com.google.android.material.textfield.TextInputEditText android:id="@+id/password" android:hint="Password" android:inputType="textPassword"/></com.google.android.material.textfield.TextInputLayout><com.google.android.material.button.MaterialButton android:id="@+id/login" android:layout_width="match_parent" android:layout_height="wrap_content" android:text="Masuk ke Dashboard" android:layout_marginTop="20dp"/><TextView android:id="@+id/forgot" android:layout_width="wrap_content" android:layout_height="wrap_content" android:text="Lupa password?" android:textColor="@color/primary" android:layout_gravity="center" android:padding="16dp"/><com.google.android.material.button.MaterialButton android:id="@+id/register" android:layout_width="match_parent" android:layout_height="wrap_content" android:text="Buat akun baru" style="?attr/borderlessButtonStyle"/></LinearLayout></androidx.constraintlayout.widget.ConstraintLayout>`);
write(path.join(res, 'layout', 'activity_register.xml'), `<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android" android:layout_width="match_parent" android:layout_height="match_parent" android:gravity="center" android:orientation="vertical" android:padding="24dp"><TextView android:layout_width="wrap_content" android:layout_height="wrap_content" android:text="Daftar akun" android:textSize="28sp" android:textStyle="bold"/><EditText android:id="@+id/name" android:layout_width="match_parent" android:layout_height="wrap_content" android:hint="Nama lengkap"/><EditText android:id="@+id/email" android:layout_width="match_parent" android:layout_height="wrap_content" android:hint="Email" android:inputType="textEmailAddress"/><EditText android:id="@+id/password" android:layout_width="match_parent" android:layout_height="wrap_content" android:hint="Password minimal 8 karakter" android:inputType="textPassword"/><com.google.android.material.button.MaterialButton android:id="@+id/save" android:layout_width="match_parent" android:layout_height="wrap_content" android:text="Daftar" android:layout_marginTop="18dp"/></LinearLayout>`);
write(path.join(res, 'layout', 'activity_dashboard.xml'), `<androidx.drawerlayout.widget.DrawerLayout xmlns:android="http://schemas.android.com/apk/res/android" xmlns:app="http://schemas.android.com/apk/res-auto" android:id="@+id/drawer" android:layout_width="match_parent" android:layout_height="match_parent"><LinearLayout android:layout_width="match_parent" android:layout_height="match_parent" android:orientation="vertical"><com.google.android.material.appbar.MaterialToolbar android:id="@+id/toolbar" android:layout_width="match_parent" android:layout_height="?attr/actionBarSize" android:background="@color/primary" android:titleTextColor="@android:color/white"/><ScrollView android:layout_width="match_parent" android:layout_height="0dp" android:layout_weight="1"><LinearLayout android:layout_width="match_parent" android:layout_height="wrap_content" android:orientation="vertical" android:padding="20dp" android:animateLayoutChanges="true"><TextView android:id="@+id/title" android:layout_width="match_parent" android:layout_height="wrap_content" android:textSize="28sp" android:textStyle="bold" android:textColor="@color/ink"/><TextView android:id="@+id/subtitle" android:layout_width="match_parent" android:layout_height="wrap_content" android:layout_marginTop="6dp"/><com.google.android.material.card.MaterialCardView android:layout_width="match_parent" android:layout_height="wrap_content" android:layout_marginTop="20dp" app:cardCornerRadius="20dp" app:cardBackgroundColor="@color/primary"><LinearLayout android:layout_width="match_parent" android:layout_height="wrap_content" android:orientation="vertical" android:padding="20dp"><TextView android:id="@+id/metric" android:layout_width="wrap_content" android:layout_height="wrap_content" android:textColor="@android:color/white" android:textSize="26sp" android:textStyle="bold"/><TextView android:layout_width="wrap_content" android:layout_height="wrap_content" android:text="Data tersimpan aman di perangkat" android:textColor="@android:color/white"/></LinearLayout></com.google.android.material.card.MaterialCardView><TextView android:layout_width="wrap_content" android:layout_height="wrap_content" android:text="Aktivitas terbaru" android:textStyle="bold" android:textSize="18sp" android:layout_marginTop="24dp"/><androidx.recyclerview.widget.RecyclerView android:id="@+id/list" android:layout_width="match_parent" android:layout_height="wrap_content"/></LinearLayout></ScrollView><com.google.android.material.floatingactionbutton.ExtendedFloatingActionButton android:id="@+id/add" android:layout_width="wrap_content" android:layout_height="wrap_content" android:text="Tambah data" android:layout_gravity="end" android:layout_margin="20dp"/></LinearLayout><com.google.android.material.navigation.NavigationView android:id="@+id/nav" android:layout_width="300dp" android:layout_height="match_parent" android:layout_gravity="start" app:menu="@menu/drawer_menu"/></androidx.drawerlayout.widget.DrawerLayout>`);
write(path.join(res, 'layout', 'item_record.xml'), `<com.google.android.material.card.MaterialCardView xmlns:android="http://schemas.android.com/apk/res/android" xmlns:app="http://schemas.android.com/apk/res-auto" android:layout_width="match_parent" android:layout_height="wrap_content" android:layout_marginTop="10dp" app:cardCornerRadius="14dp"><TextView android:id="@+id/itemText" android:layout_width="match_parent" android:layout_height="wrap_content" android:padding="18dp" android:textSize="16sp"/></com.google.android.material.card.MaterialCardView>`);
write(path.join(javaDir, 'AppConfig.kt'), `package ${pkg}\nobject AppConfig { const val APP_NAME = "${appName.replace(/"/g, '')}"; const val API_BASE_URL = "${apiUrl.replace(/"/g, '')}"; val modules = listOf(${modulesKt}) }\n`);
write(path.join(javaDir, 'AppDatabase.kt'), `package ${pkg}
import android.content.*
import android.database.sqlite.*
data class Record(val id:Long, val module:String, val title:String, val createdAt:String)
class AppDatabase(context:Context): SQLiteOpenHelper(context,"${slug}.db",null,1){
 override fun onCreate(db:SQLiteDatabase){ db.execSQL("CREATE TABLE users(id INTEGER PRIMARY KEY, name TEXT, email TEXT UNIQUE, password TEXT)"); db.execSQL("CREATE TABLE records(id INTEGER PRIMARY KEY AUTOINCREMENT,module TEXT,title TEXT,created_at TEXT)"); db.execSQL("INSERT INTO users(name,email,password) VALUES('Administrator','Admin','Admin123')") }
 override fun onUpgrade(db:SQLiteDatabase,o:Int,n:Int){}
 fun login(user:String, pass:String)=readableDatabase.rawQuery("SELECT id FROM users WHERE (email=? OR name=?) AND password=?",arrayOf(user,user,pass)).use{it.moveToFirst()}
 fun register(name:String,email:String,pass:String):Boolean=try{ writableDatabase.insertOrThrow("users",null,ContentValues().apply{put("name",name);put("email",email);put("password",pass)})>0 }catch(_:Exception){false}
 fun add(module:String,title:String){ writableDatabase.insert("records",null,ContentValues().apply{put("module",module);put("title",title);put("created_at",java.text.SimpleDateFormat("dd MMM yyyy HH:mm",java.util.Locale.getDefault()).format(java.util.Date()))}) }
 fun records(module:String):List<Record>{ val out=mutableListOf<Record>(); readableDatabase.rawQuery("SELECT id,module,title,created_at FROM records WHERE module=? ORDER BY id DESC",arrayOf(module)).use{c->while(c.moveToNext())out+=Record(c.getLong(0),c.getString(1),c.getString(2),c.getString(3))}; return out }
 fun count(module:String)=records(module).size
}
`);
write(path.join(javaDir, 'LoginActivity.kt'), `package ${pkg}
import android.content.Intent; import android.os.Bundle; import android.widget.*; import androidx.appcompat.app.AppCompatActivity
class LoginActivity:AppCompatActivity(){ override fun onCreate(s:Bundle?){super.onCreate(s);setContentView(R.layout.activity_login); val db=AppDatabase(this); val u=findViewById<EditText>(R.id.email); val p=findViewById<EditText>(R.id.password); findViewById<View>(R.id.login).setOnClickListener{if(db.login(u.text.toString().trim(),p.text.toString())){startActivity(Intent(this,DashboardActivity::class.java));overridePendingTransition(R.anim.slide_in,R.anim.fade_out);finish()}else Toast.makeText(this,"Login gagal. Demo admin: Admin / Admin123",Toast.LENGTH_LONG).show()};findViewById<View>(R.id.register).setOnClickListener{startActivity(Intent(this,RegisterActivity::class.java))};findViewById<View>(R.id.forgot).setOnClickListener{startActivity(Intent(this,ForgotPasswordActivity::class.java))} } }
`);
write(path.join(javaDir, 'RegisterActivity.kt'), `package ${pkg}
import android.os.Bundle; import android.widget.*; import androidx.appcompat.app.AppCompatActivity
class RegisterActivity:AppCompatActivity(){override fun onCreate(s:Bundle?){super.onCreate(s);setContentView(R.layout.activity_register);findViewById<View>(R.id.save).setOnClickListener{val n=findViewById<EditText>(R.id.name).text.toString();val e=findViewById<EditText>(R.id.email).text.toString();val p=findViewById<EditText>(R.id.password).text.toString();if(n.isBlank()||e.isBlank()||p.length<8)Toast.makeText(this,"Lengkapi data; password minimal 8 karakter",Toast.LENGTH_SHORT).show();else if(AppDatabase(this).register(n,e,p)){Toast.makeText(this,"Akun berhasil dibuat. Silakan masuk.",Toast.LENGTH_SHORT).show();finish()}else Toast.makeText(this,"Email/username sudah terdaftar",Toast.LENGTH_SHORT).show()}}}
`);
write(path.join(javaDir, 'ForgotPasswordActivity.kt'), `package ${pkg}
import android.os.Bundle; import android.widget.*; import androidx.appcompat.app.AppCompatActivity
class ForgotPasswordActivity:AppCompatActivity(){override fun onCreate(s:Bundle?){super.onCreate(s);val view=TextView(this);view.text="Pemulihan password\\n\\nUntuk versi offline, hubungi Admin untuk mereset akun. Saat API backend diatur, halaman ini dapat mengirim tautan reset ke email Anda.";view.textSize=18f;view.setPadding(48,96,48,48);setContentView(view)}}
`);
write(path.join(javaDir, 'DashboardActivity.kt'), `package ${pkg}
import android.os.Bundle; import android.view.*; import android.widget.*; import androidx.appcompat.app.AppCompatActivity; import androidx.appcompat.widget.Toolbar; import androidx.drawerlayout.widget.DrawerLayout; import androidx.core.view.GravityCompat; import androidx.recyclerview.widget.*; import com.google.android.material.navigation.NavigationView; import com.google.android.material.floatingactionbutton.ExtendedFloatingActionButton; import com.google.android.material.dialog.MaterialAlertDialogBuilder
class DashboardActivity:AppCompatActivity(){private lateinit var db:AppDatabase;private lateinit var module:String;private lateinit var list:RecyclerView;private lateinit var title:TextView;private lateinit var metric:TextView;override fun onCreate(s:Bundle?){super.onCreate(s);setContentView(R.layout.activity_dashboard);db=AppDatabase(this);module=AppConfig.modules.first();list=findViewById(R.id.list);list.layoutManager=LinearLayoutManager(this);title=findViewById(R.id.title);metric=findViewById(R.id.metric);val toolbar=findViewById<Toolbar>(R.id.toolbar);toolbar.title=AppConfig.APP_NAME;val drawer=findViewById<DrawerLayout>(R.id.drawer);toolbar.setNavigationOnClickListener{drawer.openDrawer(GravityCompat.START)};toolbar.setNavigationIcon(android.R.drawable.ic_menu_sort_by_size);findViewById<NavigationView>(R.id.nav).setNavigationItemSelectedListener{item->module=item.title.toString();drawer.closeDrawer(GravityCompat.START);render();true};findViewById<ExtendedFloatingActionButton>(R.id.add).setOnClickListener{addRecord()};render()}
 private fun render(){title.text=module;findViewById<TextView>(R.id.subtitle).text="Kelola $module dari ${'$'}{AppConfig.APP_NAME}";val rows=db.records(module);metric.text="${'$'}{rows.size} data";list.adapter=RecordsAdapter(rows)}
 private fun addRecord(){val input=EditText(this);input.hint="Masukkan data $module";MaterialAlertDialogBuilder(this).setTitle("Tambah $module").setView(input).setNegativeButton("Batal",null).setPositiveButton("Simpan"){_,_->if(input.text.isNotBlank()){db.add(module,input.text.toString());render()}}.show()}}
 class RecordsAdapter(private val rows:List<Record>):RecyclerView.Adapter<RecordsAdapter.H>(){class H(v:View):RecyclerView.ViewHolder(v){val text:TextView=v.findViewById(R.id.itemText)};override fun onCreateViewHolder(p:ViewGroup,t:Int)=H(LayoutInflater.from(p.context).inflate(R.layout.item_record,p,false));override fun getItemCount()=rows.size;override fun onBindViewHolder(h:H,p:Int){val r=rows[p];h.text.text="${'$'}{r.title}\\n${'$'}{r.createdAt}"}}
`);
// Compose is the primary experience. Legacy XML files above remain harmless and
// make older Android Studio installations able to index the project as well.
write(path.join(root, 'app', 'build.gradle.kts'), `plugins { id("com.android.application"); id("org.jetbrains.kotlin.plugin.compose") }
android { namespace = "${pkg}"; compileSdk = 35
 defaultConfig { applicationId = "${pkg}"; minSdk = 24; targetSdk = 35; versionCode = 1; versionName = "1.0.0" }
 buildFeatures { compose = true }
}
dependencies {
 implementation("androidx.core:core-ktx:1.15.0")
 implementation("androidx.activity:activity-compose:1.10.1")
 implementation(platform("androidx.compose:compose-bom:2025.06.01"))
 implementation("androidx.compose.ui:ui")
 implementation("androidx.compose.ui:ui-tooling-preview")
 implementation("androidx.compose.material3:material3")
 debugImplementation("androidx.compose.ui:ui-tooling")
}
`);
write(path.join(root, 'app', 'src', 'main', 'AndroidManifest.xml'), `<manifest xmlns:android="http://schemas.android.com/apk/res/android"><application android:allowBackup="true" android:label="${xml(appName)}" android:theme="@style/Theme.GeneratedApp"><activity android:name=".MainActivity" android:screenOrientation="portrait" android:exported="true"><intent-filter><action android:name="android.intent.action.MAIN"/><category android:name="android.intent.category.LAUNCHER"/></intent-filter></activity></application></manifest>`);
// The Compose app must be the only source set compiled. Remove the transitional
// XML activity code so it cannot introduce missing AppCompat dependencies.
for (const legacy of ['DashboardActivity.kt', 'LoginActivity.kt', 'RegisterActivity.kt', 'ForgotPasswordActivity.kt', 'AppDatabase.kt']) {
  fs.rmSync(path.join(javaDir, legacy), { force: true });
}
for (const legacyResourceDir of ['layout', 'menu', 'anim']) {
  fs.rmSync(path.join(res, legacyResourceDir), { recursive: true, force: true });
}
write(path.join(javaDir, 'data', 'AppRepository.kt'), `package ${pkg}.data
import android.content.Context
data class AppRecord(val module:String,val title:String,val time:Long)
class AppRepository(context:Context){private val p=context.getSharedPreferences("app_data",Context.MODE_PRIVATE)
 fun login(user:String,pass:String)=((user=="Admin"&&pass=="Admin123")||(p.getString("email","")==user&&p.getString("password","")==pass))
 fun register(email:String,password:String){p.edit().putString("email",email).putString("password",password).apply()}
 fun records(module:String): List<AppRecord> = (p.getString("records","")?:"").split("\\n").filter{it.isNotBlank()}.mapNotNull{val x=it.split("|",limit=3);if(x.size==3&&x[0]==module)AppRecord(x[0],x[1],x[2].toLongOrNull()?:0)else null}.sortedByDescending{it.time}
 fun add(module:String,title:String){val old=p.getString("records","")?:"";p.edit().putString("records",old+"\\n"+module+"|"+title.replace("|"," ").replace("\\n"," ")+"|"+System.currentTimeMillis()).apply()}}
`);
write(path.join(javaDir, 'MainActivity.kt'), `package ${pkg}
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import ${pkg}.ui.MainScreen
class MainActivity:ComponentActivity(){override fun onCreate(savedInstanceState:Bundle?){super.onCreate(savedInstanceState);setContent{MainScreen()}}}
`);
write(path.join(javaDir, 'ui', 'MainScreen.kt'), `package ${pkg}.ui
import androidx.compose.animation.AnimatedContent
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import ${pkg}.AppConfig
import ${pkg}.data.AppRepository
@Composable fun MainScreen(){val context=LocalContext.current;val repo=remember(context){AppRepository(context)};var page by remember{mutableStateOf("login")};var module by remember{mutableStateOf(AppConfig.modules.first())};MaterialTheme{AnimatedContent(page,label="screen"){when(it){"login"->Login({u,p->repo.login(u,p)},{page="dashboard"},{page="register"},{page="forgot"});"register"->Register({e,p->repo.register(e,p);page="login"},{page="login"});"forgot"->Forgot{page="login"};else->Dashboard(module,{module=it},repo,{page="login"})}}}}
@Composable fun Login(check:(String,String)->Boolean,ok:()->Unit,register:()->Unit,forgot:()->Unit){var u by remember{mutableStateOf("")};var p by remember{mutableStateOf("")};var error by remember{mutableStateOf("")};Column(Modifier.fillMaxSize().padding(24.dp),verticalArrangement=Arrangement.Center){Text(AppConfig.APP_NAME,color=MaterialTheme.colorScheme.primary,fontWeight=FontWeight.Bold);Text("Masuk ke ruang kerja Anda",style=MaterialTheme.typography.headlineMedium);Spacer(Modifier.height(20.dp));OutlinedTextField(u,{u=it},label={Text("Username atau email")},modifier=Modifier.fillMaxWidth());OutlinedTextField(p,{p=it},label={Text("Password")},modifier=Modifier.fillMaxWidth());if(error.isNotEmpty())Text(error,color=MaterialTheme.colorScheme.error);Button({if(check(u,p))ok()else error="Login gagal. Demo: Admin / Admin123"},Modifier.fillMaxWidth().padding(top=16.dp)){Text("Masuk")};TextButton(forgot,Modifier.align(Alignment.CenterHorizontally)){Text("Lupa password?")};OutlinedButton(register,Modifier.fillMaxWidth()){Text("Buat akun baru")}}}
@Composable fun Register(done:(String,String)->Unit,back:()->Unit){var e by remember{mutableStateOf("")};var p by remember{mutableStateOf("")};Column(Modifier.fillMaxSize().padding(24.dp),verticalArrangement=Arrangement.Center){Text("Buat akun",style=MaterialTheme.typography.headlineMedium);OutlinedTextField(e,{e=it},label={Text("Email")},modifier=Modifier.fillMaxWidth());OutlinedTextField(p,{p=it},label={Text("Password minimal 8 karakter")},modifier=Modifier.fillMaxWidth());Button({if(e.isNotBlank()&&p.length>=8)done(e,p)},Modifier.fillMaxWidth().padding(top=16.dp)){Text("Daftar")};TextButton(back){Text("Kembali masuk")}}}
@Composable fun Forgot(back:()->Unit){Column(Modifier.fillMaxSize().padding(24.dp),verticalArrangement=Arrangement.Center){Text("Pemulihan password",style=MaterialTheme.typography.headlineMedium);Text("Untuk akun lokal, buat akun baru atau gunakan Admin / Admin123.");TextButton(back){Text("Kembali")}}}
@OptIn(ExperimentalMaterial3Api::class) @Composable fun Dashboard(module:String,select:(String)->Unit,repo:AppRepository,logout:()->Unit){var input by remember{mutableStateOf("")};val data=repo.records(module);Scaffold(topBar={TopAppBar(title={Text(AppConfig.APP_NAME)},actions={TextButton(logout){Text("Keluar")}})}){pad->Column(Modifier.padding(pad).padding(16.dp)){Text(module,style=MaterialTheme.typography.headlineMedium,fontWeight=FontWeight.Bold);Text("${'$'}{data.size} data tersimpan di perangkat",color=MaterialTheme.colorScheme.primary);Spacer(Modifier.height(12.dp));LazyColumn(horizontalAlignment=Alignment.Start){item{Row{AppConfig.modules.take(4).forEach{FilterChip(it==module,{select(it)},{Text(it)},Modifier.padding(end=6.dp))}};OutlinedTextField(input,{input=it},label={Text("Tambah data $module")},modifier=Modifier.fillMaxWidth());Button({if(input.isNotBlank()){repo.add(module,input);input=""}},Modifier.fillMaxWidth()){Text("Simpan")}};items(data){Card(Modifier.fillMaxWidth().padding(top=10.dp)){Text(it.title,Modifier.padding(16.dp))}}}}}}
`);
write(path.join(root, 'README.md'), `# ${appName} — Android Native\n\nAplikasi native Kotlin/XML yang dibuat dari proyek migrasi **${sourceArg}**.\n\n- Login demo: **Admin / Admin123**\n- Data aplikasi disimpan di SQLite lokal; modul: ${modules.join(', ')}.\n- Konfigurasi endpoint backend: \`${apiUrl || 'belum diatur'}\` di \`AppConfig.kt\`.\n- Buka folder ini (bukan subfolder) di Android Studio, tunggu Gradle sync, lalu Run.\n`);
console.log(`Proyek Android native dibuat: ${root}`);
// Reuse a known Gradle wrapper from a previous Android project if available. The
// wrapper then downloads the requested Gradle 9.3.1 distribution on first build.
const wrapperFile = path.join(root, process.platform === 'win32' ? 'gradlew.bat' : 'gradlew');
try {
  const mobileRoot = path.dirname(root);
  for (const entry of fs.readdirSync(mobileRoot, { withFileTypes: true })) {
    const projectRoot = path.join(mobileRoot, entry.name);
    const candidate = fs.existsSync(path.join(projectRoot, process.platform === 'win32' ? 'gradlew.bat' : 'gradlew')) ? projectRoot : path.join(projectRoot, 'android');
    const candidateWrapper = path.join(candidate, process.platform === 'win32' ? 'gradlew.bat' : 'gradlew');
    if (entry.isDirectory() && fs.existsSync(candidateWrapper) && !fs.existsSync(wrapperFile)) {
      fs.copyFileSync(candidateWrapper, wrapperFile);
      const wrapperDir = path.join(candidate, 'gradle', 'wrapper');
      if (fs.existsSync(wrapperDir)) fs.cpSync(wrapperDir, path.join(root, 'gradle', 'wrapper'), { recursive: true });
      break;
    }
  }
} catch {}
if (fs.existsSync(wrapperFile)) write(path.join(root, 'gradle', 'wrapper', 'gradle-wrapper.properties'), `distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\\://services.gradle.org/distributions/gradle-9.3.1-bin.zip
networkTimeout=10000
validateDistributionUrl=true
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
`);
// If Gradle CLI is installed, create/update a self-contained wrapper as well.
const gradle = process.platform === 'win32' ? 'gradle.bat' : 'gradle';
const wrapper = spawnSync(gradle, ['wrapper', '--gradle-version', '9.3.1'], { cwd: root, stdio: 'ignore', shell: process.platform === 'win32' });
console.log(wrapper.error || wrapper.status !== 0 || !fs.existsSync(wrapperFile) ? 'Gradle Wrapper akan disiapkan Android Studio saat sync pertama.' : 'Gradle Wrapper siap.');
