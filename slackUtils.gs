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
  const response = UrlFetchApp.fetch(url, options);
  const json = JSON.parse(response.getContentText());
  return json.ok ? json.members : [];
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
  const response = UrlFetchApp.fetch(url, options);
  const json = JSON.parse(response.getContentText());
  return json.ok ? json.user : null;
}

/**
 * Slack APIを呼び出してメッセージを投稿します。
 * @returns {string} 投稿されたメッセージのタイムスタンプ
 */
function postMessage(channelId, text, token) {
  const url = 'https://slack.com/api/chat.postMessage';
  const options = {
    method: 'post',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    payload: JSON.stringify({ channel: channelId, text: text, link_names: true }),
    muteHttpExceptions: true
  };
  const response = UrlFetchApp.fetch(url, options);
  const json = JSON.parse(response.getContentText());
  return json.ok ? json.ts : null;
}

/**
 * 前回のメッセージへのリアクションを取得します。
 * @returns {Array} リアクションの配列
 */
function getReactions(channelId, timestamp, token) {
  const url = `https://slack.com/api/reactions.get?channel=${channelId}&timestamp=${timestamp}`;
  const options = {
    method: 'get',
    headers: { 'Authorization': `Bearer ${token}` },
    muteHttpExceptions: true
  };
  const response = UrlFetchApp.fetch(url, options);
  const json = JSON.parse(response.getContentText());
  return json.ok && json.message ? json.message.reactions : null;
}
