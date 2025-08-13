/**
 * この関数は時間主導型トリガーによって実行されます。
 * 毎週日曜日の15:00に掃除当番の割り当てを行います。
 */
function performScheduledTasks() {
  const config = loadConfig();
  const { WEEK_NUMBER, assignedTasks, consecutiveDays, messageTimestamp } = loadData();

  // 前回のリアクションを処理し、タスクを更新
  let updatedAssignedTasks = processCompletedTasks(config.CHANNEL_ID, messageTimestamp, assignedTasks);

  // 掃除当番の割り当てとメッセージの送信
  const result = assignTasks(
    config.CHANNEL_ID,
    WEEK_NUMBER,
    updatedAssignedTasks,
    consecutiveDays,
    config.SLACK_BOT_TOKEN
  );

  // 新しいデータをスプレッドシートに保存
  saveData({
    WEEK_NUMBER: result.newWEEK_NUMBER,
    assignedTasks: result.newAssignedTasks,
    consecutiveDays: result.newConsecutiveDays,
    messageTimestamp: result.newMessageTimestamp,
  });
}
