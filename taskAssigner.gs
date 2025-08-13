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
  if (!timestamp) return assignedTasks;

  const reactions = getReactions(channelId, timestamp, SLACK_BOT_TOKEN);
  if (reactions) {
    const userWhoReacted = new Set();
    reactions.forEach(reaction => {
      reaction.users.forEach(userId => userWhoReacted.add(userId));
    });

    // リアクションしたユーザーのタスクを完了と見なす
    return assignedTasks.filter(task => !userWhoReacted.has(task.userId));
  }
  return assignedTasks;
}

/**
 * 掃除当番を割り当て、Slackにメッセージを投稿します。
 * @returns {object} 新しい状態データ
 */
function assignTasks(channelId, WEEK_NUMBER, incompleteTasks, consecutiveDays, token) {
  // メンバー情報の更新と振り分け
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

  // 未完了タスクの処理
  let messageTextPlase = '';
  let newConsecutiveDays = consecutiveDays;
  if (incompleteTasks.length > 0) {
    newConsecutiveDays = 0;
    messageTextPlase += '前回の掃除を完了していないメンバーです\n次回は掃除をお願いします\n';
    incompleteTasks.forEach(task => {
      messageTextPlase += `${task.location}: <@${task.userId}>\n`;
    });
  } else {
    newConsecutiveDays += 1;
    const thankYouMessage = thanksMessage[Math.floor(Math.random() * thanksMessage.length)];
    messageTextPlase += `全員が掃除を完了しました！これで${newConsecutiveDays}週連続で全員が掃除を完了しました！\n${thankYouMessage}\n`;
  }

  // 今週の掃除当番を割り当て
  const newWEEK_NUMBER = (WEEK_NUMBER % 2 === 0) ? WEEK_NUMBER + 1 : WEEK_NUMBER - 1;
  let newAssignedTasks = [];
  const is_AGroup = (newWEEK_NUMBER % 2 === 0);
  const cleaningAreas = shuffle(getLocations());
  let messageText = '';

  const groupAMembers = shuffle(Object.values(members).filter(user => user.group === 'A'));
  const groupBMembers = shuffle(Object.values(members).filter(user => user.group === 'B'));

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

  // Slackにメッセージを投稿して、タイムスタンプを保存
  const newMessageTimestamp = postMessage(channelId, `${messageTextPlase}\n${messageText}`, token);

  return {
    newWEEK_NUMBER,
    newAssignedTasks,
    newConsecutiveDays,
    newMessageTimestamp
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
