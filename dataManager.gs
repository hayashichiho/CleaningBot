function getSpreadsheet() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function getDataSheet() {
  const sheet = getSpreadsheet().getSheetByName('Data');
  if (!sheet) {
    return getSpreadsheet().insertSheet('Data');
  }
  return sheet;
}

function getConfigSheet() {
  const sheet = getSpreadsheet().getSheetByName('Config');
  if (!sheet) {
    Logger.log('Config sheet not found. Please create a sheet named "Config".');
    return null;
  }
  return sheet;
}

/**
 * スプレッドシートの「Config」シートから設定情報を読み込みます。
 * @returns {object} 設定情報
 */
function loadConfig() {
  // config.gsに定数として設定した値を返します
  return {
    SLACK_BOT_TOKEN: SLACK_BOT_TOKEN,
    CHANNEL_ID: CHANNEL_ID,
    YOUR_BOT_USER_ID: YOUR_BOT_USER_ID
  };
}


/**
 * スプレッドシートからデータを読み込みます。
 * @returns {object} ボットの状態データ
 */
function loadData() {
  const sheet = getDataSheet();
  if (sheet.getLastRow() < 2) {
    return {
      WEEK_NUMBER: 0,
      assignedTasks: [],
      consecutiveDays: 0,
      messageTimestamp: ''
    };
  }
  const header = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const data = sheet.getRange(2, 1, 1, sheet.getLastColumn()).getValues()[0];

  let assignedTasks = [];
  try {
    assignedTasks = JSON.parse(data[header.indexOf('assignedTasks')]);
  } catch (e) {
    Logger.log('Failed to parse assignedTasks JSON.');
  }

  return {
    WEEK_NUMBER: data[header.indexOf('WEEK_NUMBER')],
    assignedTasks: assignedTasks,
    consecutiveDays: data[header.indexOf('consecutiveDays')],
    messageTimestamp: data[header.indexOf('messageTimestamp')],
  };
}

/**
 * スプレッドシートにデータを保存します。
 * @param {object} data 保存するデータ
 */
function saveData(data) {
  const sheet = getDataSheet();
  sheet.clearContents();

  const header = Object.keys(data);
  const values = Object.values(data);

  // assignedTasksをJSON文字列に変換
  values[header.indexOf('assignedTasks')] = JSON.stringify(values[header.indexOf('assignedTasks')]);

  sheet.getRange(1, 1, 1, header.length).setValues([header]);
  sheet.getRange(2, 1, 1, values.length).setValues([values]);
}
