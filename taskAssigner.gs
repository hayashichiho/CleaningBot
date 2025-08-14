/**
 * メンバーと場所をランダムにシャッフルする関数。
 */
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * 前回のメッセージへのリアクションを処理し、未完了タスクを返します。
 */
function processCompletedTasks(channelId, timestamp, assignedTasks) {
  if (!timestamp) {
    Logger.log('processCompletedTasks - タイムスタンプが空のため、全タスクを未完了として返します');
    return assignedTasks;
  }

  Logger.log('processCompletedTasks - タイムスタンプ: ' + timestamp);
  const reactions = getReactions(channelId, timestamp, SLACK_BOT_TOKEN);

  if (reactions && reactions.length > 0) {
    const userWhoReacted = new Set();
    reactions.forEach(reaction => {
      if (reaction.users && Array.isArray(reaction.users)) {
        reaction.users.forEach(userId => userWhoReacted.add(userId));
      }
    });

    Logger.log('processCompletedTasks - リアクションしたユーザー数: ' + userWhoReacted.size);
    Logger.log('processCompletedTasks - リアクションしたユーザーID: ' + Array.from(userWhoReacted).join(', '));

    // リアクションしたユーザーのタスクを完了と見なす
    const incompleteTasks = assignedTasks.filter(task => !userWhoReacted.has(task.userId));
    Logger.log('processCompletedTasks - 未完了タスク数: ' + incompleteTasks.length);
    return incompleteTasks;
  }

  Logger.log('processCompletedTasks - リアクションが見つからないため、全タスクを未完了として返します');
  return assignedTasks;
}

/**
 * 掃除当番を割り当て、Slackにメッセージを投稿します。
 * @returns {object} 新しい状態データ
 */
function assignTasks(channelId, WEEK_NUMBER, incompleteTasks, consecutiveDays, token) {
  Logger.log('--- assignTasks関数開始 ---');

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
        Logger.log(`メンバー ${user.real_name} はグループA/Bに属していません。`);
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
  const cleaningAreas = shuffle(getLocations());
  Logger.log('掃除場所の数: ' + cleaningAreas.length);

  let messageText = '';

  const groupAMembers = shuffle(Object.values(members).filter(user => user.group === 'A'));
  const groupBMembers = shuffle(Object.values(members).filter(user => user.group === 'B'));
  Logger.log(`グループAのメンバー数: ${groupAMembers.length}, グループBのメンバー数: ${groupBMembers.length}`);

  if (is_AGroup) {
    messageText += `今週の掃除担当はグループAです\n`;
    for (let i = 0; i < groupAMembers.length && i < cleaningAreas.length; i++) {
      messageText += `${cleaningAreas[i]}: <@${groupAMembers[i].user}>\n`;
      newAssignedTasks.push({ userId: groupAMembers[i].user, location: cleaningAreas[i] });
    }
  } else {
    messageText += `今週の掃除担当はグループBです\n`;
    for (let i = 0; i < groupBMembers.length && i < cleaningAreas.length; i++) {
      messageText += `${cleaningAreas[i]}: <@${groupBMembers[i].user}>\n`;
      newAssignedTasks.push({ userId: groupBMembers[i].user, location: cleaningAreas[i] });
    }
  }

  Logger.log('割り当てられたタスク数: ' + newAssignedTasks.length);

  // Slackにメッセージを投稿して、タイムスタンプを保存
  const fullMessageText = `${messageTextPlase}\n${messageText}`;
  Logger.log('投稿するメッセージ:\n' + fullMessageText);
  const newMessageTimestamp = postMessage(channelId, fullMessageText, token);
  Logger.log('assignTasks - 取得したタイムスタンプ: ' + newMessageTimestamp);

  Logger.log('--- assignTasks関数終了 ---');

  return {
    WEEK_NUMBER: newWEEK_NUMBER,
    assignedTasks: newAssignedTasks,
    consecutiveDays: newConsecutiveDays,
    messageTimestamp: newMessageTimestamp || ''
  };
}

/**
 * メンバーリストを表示する関数。
 */
function showMembersList(channelId, token) {
  const memberIds = fetchChannelMembers(channelId, token);
  let members = {};
  for (const memberId of memberIds) {
    const user = fetchUserInfo(memberId, token);
    if (user && !user.is_bot && user.id !== YOUR_BOT_USER_ID) {
      const group = getGroup(user.real_name);
      if (group) {
        members[user.id] = { user: user.id, name: user.real_name, group: group };
      }
    }
  }

  const groupAMembers = Object.values(members).filter(user => user.group === 'A').map(user => user.name);
  const groupBMembers = Object.values(members).filter(user => user.group === 'B').map(user => user.name);

  postMessage(channelId, `グループAのメンバー一覧: ${groupAMembers.join(', ')}`, token);
  postMessage(channelId, `グループBのメンバー一覧: ${groupBMembers.join(', ')}`, token);
}
