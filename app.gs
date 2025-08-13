function doPost(e) {
  const config = loadConfig();
  const payload = e.parameter;

  if (payload.command === '/list') {
    showMembersList(config.CHANNEL_ID, config.SLACK_BOT_TOKEN);
    return ContentService.createTextOutput("メンバーリストを表示しました。");
  }

  return ContentService.createTextOutput("");
}
