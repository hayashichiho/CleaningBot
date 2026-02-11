/**
 * Slack APIを呼び出してチャンネルメンバーを取得する関数
 */
function fetchChannelMembers(channelId, token) {
  const url = `https://slack.com/api/conversations.members?channel=${channelId}`;
  const options = {
    method: 'get',
    headers: { 'Authorization': `Bearer ${token}` },
    muteHttpExceptions: true
  };
  try {
    const response = UrlFetchApp.fetch(url, options);
    const json = JSON.parse(response.getContentText());

    Logger.log('conversations.members API レスポンス: ' + JSON.stringify(json));

    return json.ok ? json.members : [];
  } catch (e) {
    Logger.log('APIリクエスト中にエラーが発生しました: ' + e.message);
    return [];
  }
}

/**
 * Slack APIを呼び出してユーザー情報を取得する関数
 */
function fetchUserInfo(userId, token) {
  const url = `https://slack.com/api/users.info?user=${userId}`;
  const options = {
    method: 'get',
    headers: { 'Authorization': `Bearer ${token}` },
    muteHttpExceptions: true
  };
  try {
    const response = UrlFetchApp.fetch(url, options);
    const json = JSON.parse(response.getContentText());
    return json.ok ? json.user : null;
  } catch (e) {
    Logger.log('fetchUserInfo APIでエラーが発生しました: ' + e.message);
    return null;
  }
}

/**
 * Slack APIを呼び出してメッセージを投稿する関数
 * @returns {string} 投稿されたメッセージのタイムスタンプ
 */
function postMessage(channelId, text, token) {
  const url = 'https://slack.com/api/chat.postMessage';
  const options = {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    payload: JSON.stringify({
      channel: channelId,
      text: text,
      link_names: true
    }),
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    const json = JSON.parse(response.getContentText());

    if (!json.ok) {
      Logger.log('Slack APIエラー: ' + JSON.stringify(json));
      return null;
    }

    // タイムスタンプを文字列として返し、精度を保つ
    const timestamp = String(json.ts);
    Logger.log('postMessage - 取得したタイムスタンプ: ' + timestamp);
    return timestamp;
  } catch (e) {
    Logger.log('postMessage APIでエラーが発生しました: ' + e.message);
    return null;
  }
}

/**
 * 指定したユーザーとのDMチャンネルを開く
 */
function openDirectMessageChannel(userId, token) {
  const url = 'https://slack.com/api/conversations.open';
  const options = {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    payload: JSON.stringify({
      users: userId
    }),
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    const json = JSON.parse(response.getContentText());
    if (json.ok && json.channel && json.channel.id) {
      return json.channel.id;
    }
    Logger.log('conversations.open APIエラー: ' + JSON.stringify(json));
    return null;
  } catch (e) {
    Logger.log('conversations.open APIでエラーが発生しました: ' + e.message);
    return null;
  }
}

/**
 * ユーザーにDMを送る
 */
function sendDirectMessage(userId, text, token) {
  const dmChannel = openDirectMessageChannel(userId, token);
  if (!dmChannel) {
    Logger.log('DMチャンネル取得に失敗したため、メッセージを送れませんでした: ' + userId);
    return false;
  }
  return Boolean(postMessage(dmChannel, text, token));
}

/**
 * 前回のメッセージへのリアクションを取得する関数
 * @returns {Array} リアクションの配列
 */
function getReactions(channelId, timestamp, token) {
  // タイムスタンプが文字列であることを確認
  const tsString = String(timestamp);
  Logger.log('getReactions - 使用するタイムスタンプ: ' + tsString);

  const url = `https://slack.com/api/reactions.get?channel=${channelId}&timestamp=${tsString}&full=true`;

  const options = {
    method: 'get',
    headers: { 'Authorization': `Bearer ${token}` },
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    const json = JSON.parse(response.getContentText());

    Logger.log('reactions.get API レスポンス: ' + JSON.stringify(json));

    if (json.ok && json.message) {
      return json.message.reactions || [];
    } else {
      Logger.log('リアクション取得に失敗: ' + (json.error || 'Unknown error'));
      return null;
    }
  } catch (e) {
    Logger.log('リアクション取得APIでエラーが発生しました: ' + e.message);
    return null;
  }
}
