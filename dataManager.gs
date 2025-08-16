/**
* 指定したIDのスプレッドシートを取得
*/
function getSpreadsheet() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

/**
* 「Data」シートを取得
*/
function getDataSheet() {
  const sheet = getSpreadsheet().getSheetByName('Data');
  if (!sheet) {
    return getSpreadsheet().insertSheet('Data');
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

  // データがない場合
  if (sheet.getLastRow() < 2) {
    return {
      WEEK_NUMBER: 0,
      assignedTasks: [],
      consecutiveDays: 0,
      messageTimestamp: ''
    };
  }

  // データ読み込み
  const header = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const data = sheet.getRange(2, 1, 1, sheet.getLastColumn()).getValues()[0];

  // タスクデータ取得
  let assignedTasks = [];
  try {
    const tasksData = data[header.indexOf('assignedTasks')];
    if (tasksData) {
      assignedTasks = JSON.parse(tasksData);
    }
  } catch (e) {
    Logger.log('タスクデータ読み込みに失敗しました: ' + e.message);
    assignedTasks = [];
  }

  // 時間データ取得
  let messageTimestamp = '';
  const tsIndex = header.indexOf('messageTimestamp');
  if (tsIndex !== -1 && data[tsIndex] !== null && data[tsIndex] !== undefined) {
    messageTimestamp = String(data[tsIndex]);

    if (messageTimestamp.includes('E') || messageTimestamp.includes('e')) {
      messageTimestamp = parseFloat(messageTimestamp).toFixed(6);
    }
    Logger.log('loadData - 読み込んだmessageTimestamp: ' + messageTimestamp);
  }

  return {
    WEEK_NUMBER: Number(data[header.indexOf('WEEK_NUMBER')] || 0),
    assignedTasks: assignedTasks,
    consecutiveDays: Number(data[header.indexOf('consecutiveDays')] || 0),
    messageTimestamp: messageTimestamp
  };
}

/**
 * スプレッドシートにデータを保存します。
 * @param {object} data 保存するデータ
 */
function saveData(data) {
  const sheet = getDataSheet();
  sheet.clearContents();

  // ヘッダーとデータを準備（固定順序で）
  const header = ['WEEK_NUMBER', 'assignedTasks', 'consecutiveDays', 'messageTimestamp'];
  const values = [
    data.WEEK_NUMBER || 0,
    JSON.stringify(data.assignedTasks || []),
    data.consecutiveDays || 0,
    data.messageTimestamp ? String(data.messageTimestamp) : ''
  ];

  Logger.log('saveData - 保存するデータの詳細:');
  Logger.log('  WEEK_NUMBER: ' + values[0]);
  Logger.log('  assignedTasks: ' + values[1]);
  Logger.log('  consecutiveDays: ' + values[2]);
  Logger.log('  messageTimestamp: ' + values[3]);

  // ヘッダー行を設定
  sheet.getRange(1, 1, 1, header.length).setValues([header]);

  // データ行を設定
  sheet.getRange(2, 1, 1, values.length).setValues([values]);

  // messageTimestamp列を明示的にテキスト形式に設定
  const tsColumn = header.indexOf('messageTimestamp') + 1;
  sheet.getRange(2, tsColumn).setNumberFormat('@');

  Logger.log('saveData - データを保存しました');

  // 保存後の確認
  Utilities.sleep(1000); // 1秒待つ
  const savedData = loadData();
  Logger.log('保存後の確認読み込み: ' + JSON.stringify(savedData));
}
