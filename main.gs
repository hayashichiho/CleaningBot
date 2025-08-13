// メインスクリプト
function performScheduledTasks() {
  Logger.log('--- 🤖 スクリプト開始 ---');

  // データ読み込み
  const config = loadConfig();
  Logger.log('config読み込み完了: ' + JSON.stringify(config));

  const data = loadData();
  const { WEEK_NUMBER, assignedTasks, consecutiveDays, messageTimestamp } = data;
  Logger.log('スプレッドシートから読み込んだデータ: ' + JSON.stringify(data));

  // 前回のリアクションを処理し、タスクを更新
  Logger.log('前回のメッセージのタイムスタンプ: ' + messageTimestamp);
  let updatedAssignedTasks = processCompletedTasks(config.CHANNEL_ID, messageTimestamp, assignedTasks, config.SLACK_BOT_TOKEN);
  Logger.log('リアクション処理後の未完了タスク: ' + JSON.stringify(updatedAssignedTasks));

  // 掃除当番の割り当てとメッセージの送信
  const result = assignTasks(
    config.CHANNEL_ID,
    WEEK_NUMBER,
    updatedAssignedTasks,
    consecutiveDays,
    config.SLACK_BOT_TOKEN
  );
  Logger.log('割り当て完了後の結果: ' + JSON.stringify(result));

  // 新しいデータをスプレッドシートに保存
  saveData({
    WEEK_NUMBER: result.newWEEK_NUMBER,
    assignedTasks: result.newAssignedTasks,
    consecutiveDays: result.newConsecutiveDays,
    messageTimestamp: result.newMessageTimestamp,
  });
  Logger.log('新しいデータをスプレッドシートに保存しました。');

  Logger.log('--- ✅ スクリプト終了 ---');
}
