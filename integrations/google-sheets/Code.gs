const CONFIG = Object.freeze({
  SPREADSHEET_ID: '1z5Z3pmTMMVJpX0CSulH4AhnJPoU6zmeKLdJeWPsq6y0',
  SHEET_NAME: 'Lançamentos',
  FIRST_DATA_ROW: 3,
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
    validateRequest_(payload);

    let result;
    if (payload.action === 'appendExpense') {
      result = appendExpense_(payload.expense || {});
    } else if (payload.action === 'deleteExpense') {
      result = deleteExpense_(payload.expenseId, payload.row);
    } else if (payload.action === 'listExpenses') {
      result = listExpenses_();
    } else {
      throw new Error('Ação não reconhecida.');
    }

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

function listExpenses_() {
  const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) throw new Error('A aba "Lançamentos" não foi encontrada.');

  const lastRow = sheet.getLastRow();
  if (lastRow < CONFIG.FIRST_DATA_ROW) return { entries: [] };

  const properties = PropertiesService.getScriptProperties().getProperties();
  const idsByRow = {};

  Object.keys(properties).forEach(function (key) {
    if (key.indexOf(CONFIG.DEDUPE_PREFIX) !== 0) return;
    const row = Number(properties[key]);
    if (Number.isInteger(row)) {
      idsByRow[row] = key.slice(CONFIG.DEDUPE_PREFIX.length);
    }
  });

  const values = sheet
    .getRange(CONFIG.FIRST_DATA_ROW, 1, lastRow - CONFIG.FIRST_DATA_ROW + 1, 11)
    .getValues();
  const entries = [];

  values.forEach(function (columns, index) {
    const row = CONFIG.FIRST_DATA_ROW + index;
    const hasContent = columns.some(function (value) {
      return String(value === null || value === undefined ? '' : value).trim() !== '';
    });
    if (!hasContent) return;

    const date = formatDateKey_(columns[0]);
    entries.push({
      id: idsByRow[row] || 'sheet-row-' + row,
      sheetRow: row,
      synced: true,
      date: date,
      description: String(columns[1] || '').trim() || 'Lançamento da planilha',
      category: String(columns[2] || '').trim() || 'Outros/imprevistos',
      person: String(columns[4] || '').trim() || 'Pablo',
      account: String(columns[5] || '').trim() || 'Outra conta',
      paymentMethod: String(columns[7] || '').trim() || 'Outro',
      amount: Number(columns[8]) || 0,
      notes: String(columns[10] || '').trim(),
      createdAt: date ? date + 'T12:00:00-03:00' : new Date().toISOString(),
    });
  });

  entries.sort(function (a, b) {
    return b.sheetRow - a.sheetRow;
  });

  return { entries: entries };
}

function deleteExpense_(expenseId, requestedRow) {
  const id = String(expenseId || '').trim();
  if (!id) throw new Error('Identificador do lançamento ausente.');

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const properties = PropertiesService.getScriptProperties();
    const dedupeKey = CONFIG.DEDUPE_PREFIX + id;
    const storedRow = properties.getProperty(dedupeKey);
    const row = Number(storedRow || requestedRow);

    if (!Number.isInteger(row) || row < CONFIG.FIRST_DATA_ROW) {
      return { deleted: false, missing: true };
    }

    const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAME);
    if (!sheet) throw new Error('A aba "Lançamentos" não foi encontrada.');

    sheet.getRange(row, 1, 1, 11).clearContent();
    if (storedRow) properties.deleteProperty(dedupeKey);
    SpreadsheetApp.flush();

    return { deleted: true, missing: false, row };
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

function formatDateKey_(value) {
  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value.getTime())) {
    return Utilities.formatDate(
      value,
      Session.getScriptTimeZone() || 'America/Sao_Paulo',
      'yyyy-MM-dd',
    );
  }

  const text = String(value || '').trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(text);
  if (iso) return iso[1] + '-' + iso[2] + '-' + iso[3];

  const brazilian = /^(\d{2})\/(\d{2})\/(\d{4})/.exec(text);
  if (brazilian) return brazilian[3] + '-' + brazilian[2] + '-' + brazilian[1];
  return '';
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

function validateRequest_(payload) {
  const propertyName = ['WRITE', 'TOKEN'].join('_');
  const expectedToken = PropertiesService.getScriptProperties().getProperty(propertyName);

  if (!expectedToken) {
    throw new Error('A configuração de acesso ainda não foi concluída.');
  }
  if (!payload || !payload.token || payload.token !== expectedToken) {
    throw new Error('Acesso não autorizado.');
  }
}

function jsonResponse_(value) {
  return ContentService
    .createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}