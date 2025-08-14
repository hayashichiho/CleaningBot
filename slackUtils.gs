/**
 * Slack APIを呼び出してチャンネルメンバーを取得します。
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
 * Slack APIを呼び出してユーザー情報を取得します。
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
 * Slack APIを呼び出してメッセージを投稿します。
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
 * 前回のメッセージへのリアクションを取得します。
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
