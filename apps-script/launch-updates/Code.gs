const LAUNCH_SHEET_NAME = 'Subscribers';
const LAUNCH_SOURCE = 'herbert.computer';
const DEFAULT_CONSENT_VERSION = '2026-08-18-v1';
const ALLOWED_PARENT_ORIGIN = 'https://herbert.computer';

function doPost(event) {
  const params = event && event.parameter ? event.parameter : {};
  const nonce = safeNonce_(params.nonce);

  try {
    validateSubmission_(params);

    const email = normalizeEmail_(params.email);
    const source = String(params.source || '').trim();
    const consentVersion = String(params.consent_version || DEFAULT_CONSENT_VERSION).trim();
    const turnstileSecret = PropertiesService.getScriptProperties().getProperty('TURNSTILE_SECRET');

    if (turnstileSecret && !verifyTurnstile_(params.turnstile_token, turnstileSecret)) {
      throw new Error('bot-verification-failed');
    }

    const lock = LockService.getScriptLock();
    lock.waitLock(5000);
    try {
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(LAUNCH_SHEET_NAME);
      if (!sheet) throw new Error('subscriber-sheet-missing');

      if (!hasEmail_(sheet, email)) {
        sheet.appendRow([
          new Date(),
          email,
          'Pending',
          source,
          consentVersion,
          '',
          '',
          '',
        ]);
      }
    } finally {
      lock.releaseLock();
    }

    return response_('success', nonce);
  } catch (error) {
    console.error(error);
    return response_('error', nonce);
  }
}

function validateSubmission_(params) {
  if (String(params.company_website || '').trim()) throw new Error('honeypot-triggered');

  const elapsedMs = Number(params.elapsed_ms || 0);
  if (!Number.isFinite(elapsedMs) || elapsedMs < 2500 || elapsedMs > 7200000) {
    throw new Error('invalid-submit-time');
  }

  if (String(params.source || '').trim() !== LAUNCH_SOURCE) throw new Error('invalid-source');
  normalizeEmail_(params.email);
}

function normalizeEmail_(value) {
  const email = String(value || '').trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    throw new Error('invalid-email');
  }
  return email;
}

function safeNonce_(value) {
  const nonce = String(value || '');
  return /^[A-Za-z0-9_-]{16,128}$/.test(nonce) ? nonce : '';
}

function hasEmail_(sheet, email) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return false;

  const emails = sheet.getRange(2, 2, lastRow - 1, 1).getDisplayValues();
  return emails.some(function (row) {
    return String(row[0] || '').trim().toLowerCase() === email;
  });
}

function verifyTurnstile_(token, secret) {
  if (!token) return false;

  const response = UrlFetchApp.fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'post',
    payload: {
      secret: secret,
      response: token,
    },
    muteHttpExceptions: true,
  });

  const result = JSON.parse(response.getContentText() || '{}');
  return result.success === true &&
    (!result.hostname || result.hostname === 'herbert.computer') &&
    (!result.action || result.action === 'launch_updates');
}

function response_(status, nonce) {
  const payload = JSON.stringify({
    type: 'herbert-launch-update',
    status: status,
    nonce: nonce,
  }).replace(/</g, '\\u003c');

  return HtmlService.createHtmlOutput(
    '<!doctype html><meta charset="utf-8"><script>' +
      'parent.postMessage(' + payload + ',' + JSON.stringify(ALLOWED_PARENT_ORIGIN) + ');' +
    '</script>'
  ).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
