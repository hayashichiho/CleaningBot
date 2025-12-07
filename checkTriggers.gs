/**
 * 設定されているトリガーを確認する関数
 * UIで設定したトリガーが正しく動作しているかチェックできます
 */
function checkTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  Logger.log('=== トリガー確認結果 ===');
  Logger.log('設定されているトリガー数: ' + triggers.length);

  if (triggers.length === 0) {
    Logger.log('❌ トリガーが設定されていません');
    return;
  }

  triggers.forEach((trigger, index) => {
    Logger.log(`\n--- トリガー ${index + 1} ---`);
    Logger.log('📋 実行する関数: ' + trigger.getHandlerFunction());
    Logger.log('🔧 トリガー種類: ' + getTriggerSourceName(trigger.getTriggerSource()));
    Logger.log('⏰ イベント種類: ' + getEventTypeName(trigger.getEventType()));

    // 時間ベースのトリガーの場合、詳細情報を表示
    if (trigger.getTriggerSource() === ScriptApp.TriggerSource.CLOCK) {
      const eventType = trigger.getEventType();
      if (eventType === ScriptApp.EventType.ON_FORM_SUBMIT) {
        // 週次トリガーの場合
        Logger.log('📅 実行頻度: 週次');
        // 注意: GASのAPIでは曜日や時間の詳細取得に制限があります
      }
    }

    Logger.log('🆔 トリガーID: ' + trigger.getUniqueId());
  });

  Logger.log('\n✅ トリガー確認完了');
}

/**
 * トリガーソースの名前を取得
 */
function getTriggerSourceName(source) {
  switch (source) {
    case ScriptApp.TriggerSource.CLOCK:
      return '時間主導型';
    case ScriptApp.TriggerSource.SPREADSHEETS:
      return 'スプレッドシート';
    case ScriptApp.TriggerSource.FORMS:
      return 'フォーム';
    case ScriptApp.TriggerSource.DOCUMENTS:
      return 'ドキュメント';
    default:
      return '不明';
  }
}

/**
 * イベントタイプの名前を取得
 */
function getEventTypeName(eventType) {
  switch (eventType) {
    case ScriptApp.EventType.CLOCK:
      return '時間ベース';
    case ScriptApp.EventType.ON_EDIT:
      return '編集時';
    case ScriptApp.EventType.ON_FORM_SUBMIT:
      return 'フォーム送信時';
    case ScriptApp.EventType.ON_OPEN:
      return '開いた時';
    default:
      return '不明';
  }
}

/**
 * 特定の関数名のトリガーのみをチェック
 */
function checkMainTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  const mainTriggers = triggers.filter(trigger => trigger.getHandlerFunction() === 'main');

  Logger.log('=== main関数のトリガー確認 ===');
  Logger.log('main関数のトリガー数: ' + mainTriggers.length);

  if (mainTriggers.length === 0) {
    Logger.log('❌ main関数のトリガーが設定されていません');
    Logger.log('💡 GASエディタのトリガー設定で「main」関数の週次トリガーを追加してください');
  } else {
    Logger.log('✅ main関数のトリガーが設定されています');
    mainTriggers.forEach((trigger, index) => {
      Logger.log(`トリガー${index + 1}: ${getTriggerSourceName(trigger.getTriggerSource())}`);
    });
  }
}

/**
 * チャンネルの全メンバーを確認し、groupが見つからないユーザーをログ出力する
 * 実行方法: GASエディタで `checkGroupAssignments()` を実行
 */
function checkGroupAssignments() {
  const cfg = loadConfig();
  const channelId = cfg.CHANNEL_ID;
  const token = cfg.SLACK_BOT_TOKEN;

  Logger.log('=== checkGroupAssignments 開始 ===');
  const memberIds = fetchChannelMembers(channelId, token);
  Logger.log('チャンネルから取得したmember ID数: ' + memberIds.length);

  const unassigned = [];
  const details = [];

  memberIds.forEach(memberId => {
    const user = fetchUserInfo(memberId, token);
    if (!user) {
      Logger.log('ユーザー情報取得失敗: ' + memberId);
      return;
    }

    // ボットや自分自身は無視
    if (user.is_bot || user.id === cfg.YOUR_BOT_USER_ID) {
      return;
    }

    const realName = user.real_name || (user.profile && user.profile.real_name) || '';
    const displayName = (user.profile && user.profile.display_name) || '';
    const group = getGroup(realName);

    details.push({ id: user.id, realName: realName, displayName: displayName, group: group });

    if (!group) {
      unassigned.push({ id: user.id, realName: realName, displayName: displayName });
    }
  });

  Logger.log('--- 全メンバー詳細 ---');
  details.forEach(d => {
    Logger.log(`id=${d.id} real_name="${d.realName}" display_name="${d.displayName}" group=${d.group}`);
  });

  if (unassigned.length === 0) {
    Logger.log('✅ 全員がグループに割り当てられています');
  } else {
    Logger.log(`❌ グループ未割当のユーザー数: ${unassigned.length}`);
    unassigned.forEach(u => {
      Logger.log(`未割当: id=${u.id} real_name="${u.realName}" display_name="${u.displayName}"`);
    });
    Logger.log('考えられる原因: 名前の表記ゆれ（全角/半角スペース，特殊文字），groups.gs のリストに未登録 等');
  }

  Logger.log('=== checkGroupAssignments 終了 ===');
}
