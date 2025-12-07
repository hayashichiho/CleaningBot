/**
 * main関数のロジックをテストするが、Slack投稿・スプレッドシート保存は行わない
 */
function testMainLogic() {
  Logger.log('--- 🧪 testMainLogic 開始 ---');

  try {
    // 設定を読み込み
    const config = loadConfig();
    Logger.log('config読み込み完了: ' + JSON.stringify(config));

    // 既存データを読み込み（ダミーデータでテストしたい場合はここを編集）
    const currentData = loadData();
    Logger.log('スプレッドシートから読み込んだデータ: ' + JSON.stringify(currentData));

    // 前回のタスクの完了状況を確認
    let incompleteTasks = [];
    if (currentData.messageTimestamp) {
      Logger.log('前回のメッセージのタイムスタンプ: ' + currentData.messageTimestamp);
      // Slack APIを呼ばず、ダミーで空配列を返す場合は下記を有効化
      // incompleteTasks = [];
      // 通常通りロジックを使う場合は下記
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

    // 新しいタスクを割り当て（Slack投稿しないバージョンを自作）
    const result = assignTasksWithoutPost(
      config.CHANNEL_ID,
      currentData.WEEK_NUMBER,
      incompleteTasks,
      currentData.consecutiveDays,
      config.SLACK_BOT_TOKEN
    );

    Logger.log('割り当て完了後の結果: ' + JSON.stringify(result));

    // 保存も投稿もせず、結果のみ表示
    Logger.log('--- 🧪 testMainLogic 終了 ---');
  } catch (error) {
    Logger.log('エラーが発生しました: ' + error.toString());
    Logger.log('スタックトレース: ' + error.stack);
  }
}

/**
 * assignTasksのSlack投稿・タイムスタンプ取得部分を除いたテスト用関数
 */
function assignTasksWithoutPost(channelId, WEEK_NUMBER, incompleteTasks, consecutiveDays, token) {
  Logger.log('--- assignTasksWithoutPost関数開始 ---');

  // メンバー情報の更新と振り分け
  const memberIds = fetchChannelMembers(channelId, token);
  Logger.log('取得したメンバーIDの数: ' + memberIds.length);

  let members = {};
  for (const memberId of memberIds) {
    const user = fetchUserInfo(memberId, token);
    if (user && !user.is_bot && user.id !== YOUR_BOT_USER_ID) {
      const group = getGroup(user.real_name);
      if (group) {
        members[user.id] = { user: user.id, name: user.real_name, group: group };
      } else {
        Logger.log('ユーザーのグループが見つかりません: ' + user.real_name);
      }
    }
  }
  Logger.log('グループ分けされたメンバー数: ' + Object.keys(members).length);

  // 未完了タスクの処理
  let messageTextPlase = '';
  let newConsecutiveDays = consecutiveDays;
  if (incompleteTasks.length > 0) {
    Logger.log('未完了タスクが見つかりました。');
    newConsecutiveDays = 0;
    messageTextPlase += '前回の掃除を完了していないメンバーです\n次回は掃除をお願いします\n';
    incompleteTasks.forEach(task => {
      messageTextPlase += `${task.location}: <@${task.userId}>\n`;
    });
  } else {
    Logger.log('全員が前回の掃除を完了しました。');
    newConsecutiveDays += 1;
    const thankYouMessage = thanksMessage[Math.floor(Math.random() * thanksMessage.length)];
    messageTextPlase += `全員が掃除を完了しました！これで${newConsecutiveDays}週連続で全員が掃除を完了しました！\n${thankYouMessage}\n`;
  }

  // 今週の掃除当番を割り当て
  const newWEEK_NUMBER = (WEEK_NUMBER % 2 === 0) ? WEEK_NUMBER + 1 : WEEK_NUMBER - 1;
  let newAssignedTasks = [];
  const is_AGroup = (newWEEK_NUMBER % 2 === 0);
  const cleaningAreas = getLocations();
  Logger.log('掃除場所の数: ' + cleaningAreas.length);

  let messageText = '';

  const groupAMembers = shuffle(Object.values(members).filter(user => user.group === 'A'));
  const groupBMembers = shuffle(Object.values(members).filter(user => user.group === 'B'));
  Logger.log(`グループAのメンバー数: ${groupAMembers.length}, グループBのメンバー数: ${groupBMembers.length}`);

  if (is_AGroup) {
    messageText += `今週の掃除担当はグループAです\n`;
    for (let i = 0; i < cleaningAreas.length; i++) {
      const member = groupAMembers[i % groupAMembers.length];
      messageText += `${cleaningAreas[i]}: <@${member.user}>\n`;
      newAssignedTasks.push({ userId: member.user, location: cleaningAreas[i] });
    }
  } else {
    messageText += `今週の掃除担当はグループBです\n`;
    for (let i = 0; i < cleaningAreas.length; i++) {
      const member = groupBMembers[i % groupBMembers.length];
      messageText += `${cleaningAreas[i]}: <@${member.user}>\n`;
      newAssignedTasks.push({ userId: member.user, location: cleaningAreas[i] });
    }
  }

  Logger.log('割り当てられたタスク数: ' + newAssignedTasks.length);

  // Slack投稿・タイムスタンプ取得は行わない
  Logger.log('投稿するメッセージ（テスト用）:\n' + (messageTextPlase + '\n' + messageText));

  Logger.log('--- assignTasksWithoutPost関数終了 ---');

  return {
    WEEK_NUMBER: newWEEK_NUMBER,
    assignedTasks: newAssignedTasks,
    consecutiveDays: newConsecutiveDays,
    messageTimestamp: '' // 投稿しないので空
  };
}
