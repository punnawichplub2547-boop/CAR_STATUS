/**
 * Bind this script to the Google Sheet that collects the orientation exam
 * Google Form responses. Set an installable "On form submit" trigger
 * (Triggers > Add Trigger > onFormSubmit > From spreadsheet > On form submit)
 * — the simple trigger form (function name reserved by Apps Script) does not
 * reliably fire for Forms-linked Sheets, so it must be installed manually.
 *
 * Before deploying, set these two Script Properties
 * (Project Settings > Script Properties):
 *   WEBHOOK_URL    = https://<your-backend-host>/api/webhook/exam-result
 *   WEBHOOK_SECRET = <same value as backend .env WEBHOOK_SECRET>
 *
 * Expected form questions (edit the COLUMN_MAP below to match the actual
 * question order/titles in the linked response sheet):
 *   - รหัสพนักงาน (empCode)     — REQUIRED so the response can be matched
 *   - ชื่อ-นามสกุล (name)
 *   - อีเมล (email)              — optional, Google Forms can auto-collect this
 *   - หลักสูตรที่สอบ (category)  — must answer exactly "REGULATION" or "SAFETY",
 *                                   e.g. via a dropdown with those two choices
 *   - จำนวนข้อที่ถูก (correctCount)
 *   - จำนวนข้อทั้งหมด (totalQuestions)
 */

function onFormSubmit(e) {
  const props = PropertiesService.getScriptProperties();
  const webhookUrl = props.getProperty('WEBHOOK_URL');
  const webhookSecret = props.getProperty('WEBHOOK_SECRET');

  const values = e.namedValues; // { "question title": [answer], ... }
  const responseId = e.response ? e.response.getId() : Utilities.getUuid();

  const payload = {
    formResponseId: responseId,
    empCode: firstValue(values['รหัสพนักงาน']),
    respondentName: firstValue(values['ชื่อ-นามสกุล']),
    respondentEmail: firstValue(values['อีเมล']) || undefined,
    courseCategory: firstValue(values['หลักสูตรที่สอบ']),
    correctCount: Number(firstValue(values['จำนวนข้อที่ถูก'])),
    totalQuestions: Number(firstValue(values['จำนวนข้อทั้งหมด'])),
    submittedAt: new Date().toISOString(),
  };

  const response = UrlFetchApp.fetch(webhookUrl, {
    method: 'post',
    contentType: 'application/json',
    headers: { 'X-Webhook-Secret': webhookSecret },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  });

  if (response.getResponseCode() >= 300) {
    // Surface failures in the Apps Script execution log so they're not silent.
    console.error('Webhook call failed: ' + response.getResponseCode() + ' ' + response.getContentText());
  }
}

function firstValue(arr) {
  return arr && arr.length ? arr[0] : '';
}
