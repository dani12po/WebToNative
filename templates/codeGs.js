export function getCodeGsTemplate(projectName, profile) {
  const config = JSON.stringify(profile).replace(/</g, '\\u003c');
  return `/** ${projectName} — server Web App */
const APP_CONFIG = ${config};

function doGet() {
  return HtmlService.createHtmlOutputFromFile('app')
    .setTitle('${projectName.replace(/'/g, "\\'")}')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function setupDatabase() { DB_initSchema(); return 'Database siap digunakan.'; }
function apiLogin(username, password) { try { return AUTH_login(username, password); } catch (err) { return { success: false, message: err.message }; } }
function apiRegister(payload) { try { return AUTH_register(payload); } catch (err) { return { success: false, message: err.message }; } }
function apiSaveRecord(payload) { try { return DB_saveRecord(payload); } catch (err) { return { success: false, message: err.message }; } }
function apiGetDashboard(moduleId, userRole) { try { return DB_getDashboard(moduleId, userRole); } catch (err) { return { success: false, message: err.message }; } }
`;
}
