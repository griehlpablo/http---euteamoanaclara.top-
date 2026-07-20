const CONFIG = Object.freeze({
  SPREADSHEET_ID: '1z5Z3pmTMMVJpX0CSulH4AhnJPoU6zmeKLdJeWPsq6y0',
  SHEET_NAME: 'Lançamentos',
  FIRST_DATA_ROW: 3,
  TOKEN_PROPERTY: 'WRITE_TOKEN',
  DEDUPE_PREFIX: 'expense:',
});

function doGet() {
  return jsonResponse_({
    ok: true,
    service: 'gastos-pablo-ana',
    sheet: CONFIG.SHEET_NAME,
  });
}

function doPost(event) {
  try {
    const payload = parsePayload_(event);
    const expectedToken = PropertiesService.getScriptProperties().getProperty(CONFIG.TOKEN_PROPERTY);

    if (!expectedToken) {
      throw new Error('O código secreto ainda não foi configurado nas propriedades do script.');
    }
    if (!payload.token || payload.token !== expectedToken) {
      throw new Error('Código secreto inválido.');
    }
    if (payload.action !== 'appendExpense') {
      throw new Error('Ação não reconhecida.');
    }

    const result = appendExpense_(payload.expense || {});
    return jsonResponse_({ ok: true, ...result });
  } catch (error) {
    console.error(error);
    return jsonResponse_({
      ok: false,
      error: error && error.message ? error.message : String(error),
    });
  }
}

function appendExpense_(expense) {
  validateExpense_(expense);

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const properties = PropertiesService.getScriptProperties();
    const dedupeKey = CONFIG.DEDUPE_PREFIX + expense.id;
    const previousRow = properties.getProperty(dedupeKey);

    if (previousRow) {
      return { duplicate: true, row: Number(previousRow) };
    }

    const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAME);
    if (!sheet) throw new Error('A aba "Lançamentos" não foi encontrada.');

    const row = findNextEmptyRow_(sheet);
    const date = parseLocalDate_(expense.date);
    const month = new Date(date.getFullYear(), date.getMonth(), 1, 12, 0, 0);
    const amount = Number(expense.amount);

    sheet.getRange(row, 1, 1, 11).setValues([[
      date,
      String(expense.description || '').trim(),
      String(expense.category || '').trim(),
      'Gasto',
      String(expense.person || '').trim(),
      String(expense.sourceAccount || '').trim(),
      String(expense.destinationAccount || '').trim(),
      String(expense.paymentMethod || '').trim(),
      amount,
      month,
      String(expense.notes || '').trim(),
    ]]);

    sheet.getRange(row, 1).setNumberFormat('dd/mm/yyyy');
    sheet.getRange(row, 9).setNumberFormat('R$ #,##0.00');
    sheet.getRange(row, 10).setNumberFormat('mmmm "de" yyyy');

    properties.setProperty(dedupeKey, String(row));
    SpreadsheetApp.flush();

    return { duplicate: false, row };
  } finally {
    lock.releaseLock();
  }
}

function findNextEmptyRow_(sheet) {
  const maxRows = sheet.getMaxRows();
  const count = Math.max(1, maxRows - CONFIG.FIRST_DATA_ROW + 1);
  const values = sheet
    .getRange(CONFIG.FIRST_DATA_ROW, 1, count, 1)
    .getDisplayValues();
  const emptyIndex = values.findIndex((row) => !String(row[0] || '').trim());

  if (emptyIndex >= 0) return CONFIG.FIRST_DATA_ROW + emptyIndex;

  sheet.insertRowAfter(maxRows);
  return maxRows + 1;
}

function parsePayload_(event) {
  if (!event || !event.postData || !event.postData.contents) {
    throw new Error('Corpo da solicitação ausente.');
  }

  try {
    return JSON.parse(event.postData.contents);
  } catch (error) {
    throw new Error('O corpo enviado não é um JSON válido.');
  }
}

function parseLocalDate_(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ''));
  if (!match) throw new Error('Data inválida. Use o formato AAAA-MM-DD.');

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day, 12, 0, 0);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    throw new Error('Data inexistente.');
  }

  return date;
}

function validateExpense_(expense) {
  if (!expense || typeof expense !== 'object') throw new Error('Lançamento ausente.');
  if (!String(expense.id || '').trim()) throw new Error('Identificador do lançamento ausente.');
  if (!String(expense.description || '').trim()) throw new Error('Descrição obrigatória.');
  if (!String(expense.category || '').trim()) throw new Error('Categoria obrigatória.');
  if (!String(expense.person || '').trim()) throw new Error('Quem pagou é obrigatório.');
  if (!String(expense.sourceAccount || '').trim()) throw new Error('Conta de saída obrigatória.');
  if (!String(expense.paymentMethod || '').trim()) throw new Error('Forma de pagamento obrigatória.');

  const amount = Number(expense.amount);
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('Valor inválido.');
}

function jsonResponse_(value) {
  return ContentService
    .createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}
