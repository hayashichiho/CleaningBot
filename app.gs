/**
 * listコマンドの処理関数
 */
function doPost(e) {
  const config = loadConfig();
  const payload = e.parameter;

  if (payload.command === '/list') {
    showMembersList(config.CHANNEL_ID, config.SLACK_BOT_TOKEN);
    return ContentService.createTextOutput("メンバーリストを表示しました。");
  }

  return ContentService.createTextOutput("");
}

/**
 * メンバーリストを表示する関数
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
