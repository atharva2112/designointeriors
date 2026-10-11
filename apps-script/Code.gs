/**
 * Designo Interiors — website form handler (Google Apps Script)
 *
 * Paste this into the Apps Script editor of the "Designo enquiries" Google Sheet
 * (Extensions → Apps Script), then Deploy → New deployment → Web app.
 *
 * What it does for every form submitted on the website:
 *   1. Adds a row to a tab named after the form (created automatically).
 *   2. Saves any uploaded CV into the Drive folder "Designo website uploads".
 *   3. Emails everyone listed for that form in the admin (Settings → Notifications).
 *   4. Sends a WhatsApp alert through CallMeBot to every number listed for that form.
 *
 * Script properties (Project Settings → Script properties):
 *   SETTINGS_URL          https://designointeriors.com/settings/notifications.json
 *   CALLMEBOT_919820111353  <the API key CallMeBot sent to that number>
 *   (add one CALLMEBOT_<number> line for each WhatsApp number)
 */

var LABELS = { quote: 'Quotes', consultation: 'Consultations', careers: 'Careers', referral: 'Referrals', ecovisions: 'EcoVisions' };
var FALLBACK = { emails: ['designo@designointeriors.com', 'designo371@gmail.com'], whatsapp: ['919820111353'] };
var FOLDER = 'Designo website uploads';

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    var data = JSON.parse(e.postData.contents);
    if (data.website) return reply({ ok: true }); // spam trap
    var form = String(data.form || 'other').replace(/[^a-z]/g, '');
    var file = data.file; delete data.file; delete data.website;

    if (file && file.data) {
      var blob = Utilities.newBlob(Utilities.base64Decode(file.data), file.type || 'application/octet-stream', stamp() + ' ' + (data.name || '') + ' — ' + file.name);
      var saved = folder().createFile(blob);
      data.file = saved.getUrl();
    }

    var row = saveRow(form, data);
    var route = routing(form);
    var label = LABELS[form] || form;
    var lines = Object.keys(data).filter(function (k) { return k !== 'form' && data[k] !== ''; }).map(function (k) { return k + ': ' + data[k]; });

    if (route.emails.length) {
      MailApp.sendEmail({
        to: route.emails.join(','),
        subject: 'Website · ' + label + ' · ' + (data.name || data.email || 'New submission'),
        replyTo: isEmail(data.email) ? data.email : undefined,
        htmlBody: '<p style="font:15px/1.5 Arial,sans-serif">New ' + label.toLowerCase() + ' submission from designointeriors.com</p><table style="font:14px/1.5 Arial,sans-serif;border-collapse:collapse">' +
          lines.map(function (l) { var i = l.indexOf(': '); return '<tr><td style="padding:4px 16px 4px 0;color:#4C5752;vertical-align:top">' + esc(l.slice(0, i)) + '</td><td style="padding:4px 0">' + esc(l.slice(i + 2)) + '</td></tr>'; }).join('') +
          '</table><p style="font:13px/1.5 Arial,sans-serif;color:#4C5752">Saved to row ' + row + ' of the “' + label + '” tab.</p>'
      });
    }

    var props = PropertiesService.getScriptProperties();
    var short = '*' + label + '* — ' + (data.name || '') + (data.phone ? ' · ' + data.phone : '') + (data.type ? ' · ' + data.type : '') + (data.day ? ' · ' + data.day + ' ' + (data.time || '') : '');
    route.whatsapp.forEach(function (num) {
      var key = props.getProperty('CALLMEBOT_' + num);
      if (!key) return;
      UrlFetchApp.fetch('https://api.callmebot.com/whatsapp.php?phone=' + num + '&text=' + encodeURIComponent(short) + '&apikey=' + encodeURIComponent(key), { muteHttpExceptions: true });
    });

    return reply({ ok: true });
  } catch (err) {
    console.error(err);
    return reply({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function doGet() { return reply({ ok: true, service: 'Designo forms' }); }

function saveRow(form, data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var name = LABELS[form] || form;
  var sh = ss.getSheetByName(name) || ss.insertSheet(name);
  var headers = sh.getLastRow() ? sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0] : [];
  if (!headers.length) { headers = ['Received']; sh.appendRow(headers); sh.setFrozenRows(1); sh.getRange(1, 1, 1, 1).setFontWeight('bold'); }
  Object.keys(data).forEach(function (k) {
    if (k !== 'form' && headers.indexOf(k) === -1) { headers.push(k); sh.getRange(1, headers.length).setValue(k).setFontWeight('bold'); }
  });
  sh.appendRow(headers.map(function (h) { return h === 'Received' ? new Date() : (data[h] == null ? '' : data[h]); }));
  return sh.getLastRow();
}

function routing(form) {
  var cache = CacheService.getScriptCache();
  var raw = cache.get('settings');
  if (!raw) {
    var url = PropertiesService.getScriptProperties().getProperty('SETTINGS_URL');
    try { if (url) { raw = UrlFetchApp.fetch(url, { muteHttpExceptions: true }).getContentText(); JSON.parse(raw); cache.put('settings', raw, 300); } } catch (e) { raw = null; }
  }
  var forms = {};
  try { forms = JSON.parse(raw || '{}').forms || {}; } catch (e) {}
  var r = forms[form] || FALLBACK;
  return {
    emails: (r.emails || []).filter(isEmail),
    whatsapp: (r.whatsapp || []).map(function (n) { return String(n).replace(/\D/g, ''); }).filter(String)
  };
}

function folder() { var it = DriveApp.getFoldersByName(FOLDER); return it.hasNext() ? it.next() : DriveApp.createFolder(FOLDER); }
function stamp() { return Utilities.formatDate(new Date(), 'Asia/Kolkata', 'yyyy-MM-dd HHmm'); }
function isEmail(s) { return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(s || '')); }
function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
function reply(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

/** Run once from the editor to grant permissions and send yourself a test alert. */
function testSetup() {
  var res = doPost({ postData: { contents: JSON.stringify({ form: 'quote', name: 'Test enquiry', email: 'designo371@gmail.com', phone: '9820111353', type: 'Corporate office', message: 'Setup test — delete this row.' }) } });
  console.log(res.getContent());
}
