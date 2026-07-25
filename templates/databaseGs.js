export function getDatabaseGsTemplate(projectName, profile) {
  const fields = JSON.stringify(profile.fields).replace(/</g, '\\u003c');
  const sheetName = JSON.stringify(profile.sheetName).replace(/</g, '\\u003c');
  return `/** ${projectName} — database generik untuk ${profile.name} */
const RECORD_FIELDS = ${fields};
const RECORD_SHEET = ${sheetName};
const USER_SHEET = 'Users';

function DB_getSpreadsheet() {
  const props = PropertiesService.getScriptProperties();
  let id = props.getProperty('DB_SPREADSHEET_ID');
  if (!id) { const ss = SpreadsheetApp.create('${projectName.replace(/'/g, "\\'")} - Database'); props.setProperty('DB_SPREADSHEET_ID', ss.getId()); return ss; }
  return SpreadsheetApp.openById(id);
}
function DB_initSchema() {
  const ss = DB_getSpreadsheet();
  const users = DB_ensureSheet_(ss, USER_SHEET, ['UserId', 'Username', 'PasswordHash', 'FullName', 'Role', 'CreatedAt']);
  DB_ensureSheet_(ss, RECORD_SHEET, ['Id'].concat(RECORD_FIELDS.map(function(f) { return f.label; })).concat(['Dibuat pada', 'Dibuat oleh']));
  if (users.getLastRow() === 1) {
    users.appendRow([DB_id_(), 'Admin', DB_hash_('Admin123'), 'Administrator', 'admin', new Date()]);
  }
  const sheet1 = ss.getSheetByName('Sheet1'); if (sheet1 && ss.getSheets().length > 1) ss.deleteSheet(sheet1);
}
function DB_ensureSheet_(ss, name, headers) { let sh = ss.getSheetByName(name); if (!sh) sh = ss.insertSheet(name); if (sh.getLastRow() === 0) { sh.appendRow(headers); sh.setFrozenRows(1); sh.getRange(1, 1, 1, headers.length).setFontWeight('bold'); } return sh; }
function DB_sheet_(name) {
  const ss = DB_getSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) {
    DB_initSchema();
    sh = DB_getSpreadsheet().getSheetByName(name);
  }
  return sh;
}
function DB_id_() { return Utilities.getUuid().split('-')[0].toUpperCase(); }
function DB_hash_(password) { return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password, Utilities.Charset.UTF_8).map(function(b) { return ('0' + (b < 0 ? b + 256 : b).toString(16)).slice(-2); }).join(''); }
function AUTH_register(p) { const sh = DB_sheet_(USER_SHEET), rows = sh.getDataRange().getValues(); for (let i = 1; i < rows.length; i++) if (rows[i][1] === p.username) return { success:false, message:'Username sudah digunakan.' }; sh.appendRow([DB_id_(), p.username, DB_hash_(p.password), p.fullName || p.username, 'member', new Date()]); return { success:true, message:'Akun berhasil dibuat.' }; }
function AUTH_login(username, password) { const rows = DB_sheet_(USER_SHEET).getDataRange().getValues(), hash = DB_hash_(password); for (let i = 1; i < rows.length; i++) if (rows[i][1] === username && rows[i][2] === hash) return { success:true, user:{ id:rows[i][0], name:rows[i][3], username:rows[i][1], role:rows[i][4] } }; return { success:false, message:'Username atau password salah.' }; }
function DB_saveRecord(payload) { const sh = DB_sheet_(RECORD_SHEET), values = RECORD_FIELDS.map(function(f) { return payload[f.key] || ''; }); sh.appendRow([DB_id_()].concat(values, [new Date(), payload.userName || ''])); return { success:true, message:'${profile.recordLabel} berhasil disimpan.' }; }
function DB_getDashboard() { const sh = DB_sheet_(RECORD_SHEET), rows = sh.getDataRange().getDisplayValues(), headers = rows.shift() || []; return { total: rows.length, headers: headers, records: rows.slice(-10).reverse() }; }
`;
}
