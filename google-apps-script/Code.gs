/**
 * ============================================================================
 * Animation Guild Uganda — Google Sheets intake
 * ============================================================================
 *
 * WHAT THIS IS
 *   The Apps Script that backs the secretariat's spreadsheet. The website
 *   posts a hidden form to this script's /exec URL (see SHEET_ENDPOINT in
 *   src/lib/googleSheet.js) and the script appends one row per submission.
 *
 * WHY A WEB APP AND NOT THE SHEETS API
 *   Google Apps Script's doPost() returns no CORS headers, so a browser
 *   fetch() to it is always blocked. Posting a real <form> into a hidden
 *   <iframe> is a normal navigation, which the browser allows cross-origin.
 *   That is why the site never sees a response and treats "posted" as success.
 *
 * ⚠️ DEPLOYMENT
 *   Deploy → New deployment → Web app → Execute as: Me,
 *   Who has access: Anyone. After every change here, redeploy — the published
 *   URL keeps running the OLD code until you do.
 *
 * ⚠️ SHEET ID
 *   Set SHEET_ID to the ID from the spreadsheet URL:
 *     https://docs.google.com/spreadsheets/d/<SHEET_ID>/edit
 *   Leave it as '' to fall back to the active spreadsheet this script is
 *   bound to, which is the usual setup ("Bound to" when creating the script).
 *
 * ADDING A COLUMN
 *   Append its header to the relevant HEADERS array below AND its field name
 *   to the matching row builder. If the sheet already has data, also insert a
 *   column in that position in the spreadsheet itself — the script writes by
 *   position, so the order in the array is the order in the sheet.
 * ============================================================================
 */

/** Leave '' to use the bound spreadsheet. */
const SHEET_ID = ''

/** Tab names. Created on demand if they do not exist yet. */
const CONTACT_TAB = 'Contact'
const MEMBERSHIP_TAB = 'Membership'
const SIGNUP_TAB = 'Signups'

/**
 * Column order for the Sign-ups tab.
 *
 * The six portfolio* columns are written from the tiles in
 * src/data/portfolio.js (PORTFOLIO_LINKS). The ids must match:
 *   linkedin | instagram | behance | dribbble | web | other
 *
 * portfolioSummary is the same links joined into one cell ("LinkedIn,
 * Instagram") so the sheet can be sorted or filtered by platform without
 * reading six separate columns.
 */
const SIGNUP_HEADERS = [
  'Submitted',
  'Name',
  'Email',
  'Phone',
  'Country code',
  'Date of birth',
  'Category',
  'Institution',
  'Profession',
  'Portfolio — LinkedIn',
  'Portfolio — Instagram',
  'Portfolio — Behance',
  'Portfolio — Dribbble',
  'Portfolio — Web',
  'Portfolio — Other',
  'Portfolio (summary)',
  'Status'
]

const CONTACT_HEADERS = ['Submitted', 'Name', 'Email', 'Phone', 'Service', 'Message']

const MEMBERSHIP_HEADERS = [
  'Submitted',
  'Name',
  'Email',
  'Phone',
  'Profession',
  'Category',
  'Country'
]

/** Router. The site's `type` field picks the tab. */
function doPost(e) {
  const data = (e && e.parameter) || {};
  const type = String(data.type || '').trim();

  try {
    switch (type) {
      case 'signup':
        appendRow(SIGNUP_TAB, SIGNUP_HEADERS, signupRow(data));
        break;
      case 'membership':
        appendRow(MEMBERSHIP_TAB, MEMBERSHIP_HEADERS, membershipRow(data));
        break;
      case 'contact':
        appendRow(CONTACT_TAB, CONTACT_HEADERS, contactRow(data));
        break;
      default:
        // Unknown type: write it to a Diagnostics tab rather than dropping it
        // silently, so a typo in the site is visible instead of mysterious.
        appendRow(
          'Diagnostics',
          ['Submitted', 'Type', 'Payload'],
          [nowIso(), type || '(blank)', JSON.stringify(data)]
        );
    }
  } catch (error) {
    // Log so it shows up in the Apps Script execution log. The browser never
    // sees this response, so this is the only trace of a failed write.
    console.error('Sheet write failed for type=' + type, error);
  }

  // Always a 200 with a small HTML body: the form POST lands here inside an
  // iframe and any non-2XX would surface as a console error on the site.
  return htmlResponse('ok');
}

/** The member sign-up row — one column per portfolio platform. */
function signupRow(d) {
  return [
    nowIso(),
    text(d.name),
    text(d.email),
    text(d.phone),
    text(d.countryCode),
    text(d.dateOfBirth),
    text(d.category),
    text(d.school),
    text(d.profession),
    text(d.portfolioLinkedin),
    text(d.portfolioInstagram),
    text(d.portfolioBehance),
    text(d.portfolioDribbble),
    text(d.portfolioWeb),
    text(d.portfolioOther),
    text(d.portfolioSummary),
    'pending' // the secretariat flips this once the application is reviewed
  ];
}

function membershipRow(d) {
  return [
    nowIso(),
    text(d.name),
    text(d.email),
    text(d.phone),
    text(d.artistType),
    text(d.category),
    text(d.country)
  ];
}

function contactRow(d) {
  return [
    nowIso(),
    text(d.name),
    text(d.email),
    text(d.phone),
    text(d.service),
    text(d.message)
  ];
}
/**
 * Append one row, creating the tab and its header row if they are missing.
 * The check is cheap and only runs on the first submission to a new tab.
 */
function appendRow(tabName, headers, values) {
  const sheet = getSheet_(tabName);

  // A blank tab has no header; write one before the first data row so the
  // columns stay labelled for whoever opens the spreadsheet.
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
    // The timestamp reads better as text than as a raw serial number.
    sheet.getRange(1, 1).setNumberFormat('@');
  }

  sheet.appendRow(values);
}

function getSheet_(tabName) {
  const ss = SHEET_ID
    ? SpreadsheetApp.openById(SHEET_ID)
    : SpreadsheetApp.getActiveSpreadsheet();
  const existing = ss.getSheetByName(tabName);

  if (existing) return existing;

  // insertSheet returns the new sheet; it is never the active tab, so it is
  // safe to create on the fly.
  return ss.insertSheet(tabName);
}

/** Read a form field as trimmed text. Anything missing becomes ''. */
function text(value) {
  return value === undefined || value === null ? '' : String(value).trim();
}

function nowIso() {
  return new Date().toISOString();
}

function htmlResponse(text_) {
  return ContentService.createTextOutput(text_).setMimeType(
    ContentService.MimeType.HTML
  );
}

/**
 * Convenience for the secretariat: jump to the sign-ups tab from the
 * spreadsheet menu. Not used by the site.
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Guild intake')
    .addItem('Open sign-ups tab', function () {
      getSheet_(SIGNUP_TAB).activate();
    })
    .addToUi();
}