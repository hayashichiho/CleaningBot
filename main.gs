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

/**
 * 木曜時点で未リアクションのメンバーにDMでリマインドする
 */
function sendReminderDMs() {
  Logger.log('--- 🔔 リマインダー送信開始 ---');

  try {
    const config = loadConfig();
    const currentData = loadData();

    if (!currentData.messageTimestamp) {
      Logger.log('リマインダー送信をスキップ: messageTimestamp がありません');
      return;
    }

    if (!currentData.assignedTasks || currentData.assignedTasks.length === 0) {
      Logger.log('リマインダー送信をスキップ: assignedTasks が空です');
      return;
    }

    const incompleteTasks = processCompletedTasks(
      config.CHANNEL_ID,
      currentData.messageTimestamp,
      currentData.assignedTasks
    );

    if (!incompleteTasks || incompleteTasks.length === 0) {
      Logger.log('未リアクションのメンバーはいません。DM送信なし。');
      return;
    }

    let successCount = 0;

    incompleteTasks.forEach(task => {
      const reminderText =
        `こんにちは！お掃除がまだ完了していないみたいです．\n` +
        `担当エリア: ${task.location}\n` +
        `土曜日までに掃除とチェンネルの投稿へのリアクションをお願いします．\n` +
        `※掃除方法は，「隔週の掃除担当」チャンネルのファイルタブに記載しています．`
        ;

      if (sendDirectMessage(task.userId, reminderText, config.SLACK_BOT_TOKEN)) {
        successCount += 1;
      }
    });

    Logger.log(`リマインダー送信完了: ${successCount}/${incompleteTasks.length}件のDMを送信しました`);
  } catch (error) {
    Logger.log('sendReminderDMsでエラーが発生しました: ' + error.toString());
    Logger.log('スタックトレース: ' + error.stack);
  }

  Logger.log('--- 🔔 リマインダー送信終了 ---');
}
