/**
 * メイン実行関数
 */
function main() {
  Logger.log('--- 🤖 スクリプト開始 ---');

  try {
    // 設定を読み込み
    const config = loadConfig();
    Logger.log('config読み込み完了: ' + JSON.stringify(config));

    // 既存データを読み込み
    const currentData = loadData();
    Logger.log('スプレッドシートから読み込んだデータ: ' + JSON.stringify(currentData));

    // 前回のタスクの完了状況を確認
    let incompleteTasks = [];
    if (currentData.messageTimestamp) {
      Logger.log('前回のメッセージのタイムスタンプ: ' + currentData.messageTimestamp);
      incompleteTasks = processCompletedTasks(
        config.CHANNEL_ID,
        currentData.messageTimestamp,
        currentData.assignedTasks
      );
    } else {
      Logger.log('前回のタイムスタンプがないため、リアクション処理をスキップします');
      incompleteTasks = currentData.assignedTasks;
    }

    Logger.log('リアクション処理後の未完了タスク: ' + JSON.stringify(incompleteTasks));

    // 新しいタスクを割り当て
    const result = assignTasks(
      config.CHANNEL_ID,
      currentData.WEEK_NUMBER,
      incompleteTasks,
      currentData.consecutiveDays,
      config.SLACK_BOT_TOKEN
    );

    Logger.log('割り当て完了後の結果: ' + JSON.stringify(result));

    // 結果をスプレッドシートに保存（データ構造を確認）
    const dataToSave = {
      WEEK_NUMBER: result.WEEK_NUMBER,
      assignedTasks: result.assignedTasks,
      consecutiveDays: result.consecutiveDays,
      messageTimestamp: result.messageTimestamp
    };

    Logger.log('保存予定のデータ: ' + JSON.stringify(dataToSave));
    saveData(dataToSave);
    Logger.log('新しいデータをスプレッドシートに保存しました。');

  } catch (error) {
    Logger.log('エラーが発生しました: ' + error.toString());
    Logger.log('スタックトレース: ' + error.stack);
  }

  Logger.log('--- ✅ スクリプト終了 ---');
}
