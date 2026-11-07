/**
 * 規約チェッカー：Googleフォーム自動作成スクリプト
 * 使い方：script.google.com →「新しいプロジェクト」→ このコードを全部貼る → ▶実行（関数 setup）
 * 実行ログに出る「ここから〜ここまで」をロンに貼り返してください。
 */
function setup() {
  // ① 先行登録フォーム
  const signup = FormApp.create('規約チェッカー 先行登録');
  signup.setDescription('使っているサービスの「損する変更」だけ通知（準備中）の先行登録です。');
  const sEmail = signup.addTextItem().setTitle('メールアドレス').setRequired(true);
  const sSvc = signup.addTextItem().setTitle('見張ってほしいサービス');
  const sRole = signup.addTextItem().setTitle('立場');
  const sSrc = signup.addTextItem().setTitle('経路');
  configure(signup);

  // ② 誤検知報告フォーム
  const report = FormApp.create('規約チェッカー 誤検知報告');
  const rBody = report.addParagraphTextItem().setTitle('報告内容').setRequired(true);
  configure(report);

  // 回答を1つのスプレッドシートに集計（登録数＝行数）
  const ss = SpreadsheetApp.create('規約チェッカー 集計');
  signup.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
  report.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());

  const ids = form => {
    const r = form.createResponse();
    form.getItems().forEach(it => {
      const t = it.getType() === FormApp.ItemType.PARAGRAPH_TEXT ? it.asParagraphTextItem() : it.asTextItem();
      r.withItemResponse(t.createResponse('x'));
    });
    return (r.toPrefilledUrl().match(/entry\.\d+/g) || []);
  };
  const s = ids(signup), r = ids(report);
  const action = f => f.getPublishedUrl().replace(/\/viewform.*$/, '/formResponse');

  const out = {
    signupAction: action(signup), signupEntry: s[0], signupServicesEntry: s[1], signupRoleEntry: s[2], signupSourceEntry: s[3],
    reportAction: action(report), reportEntry: r[0],
    sheetUrl: ss.getUrl()
  };
  Logger.log('===== ここから =====\n' + JSON.stringify(out, null, 2) + '\n===== ここまで =====');
}

function configure(form) {
  form.setCollectEmail(false);
  form.setLimitOneResponsePerUser(false);
  form.setShowLinkToRespondAgain(false);
  try { form.setRequireLogin(false); } catch (e) { /* 個人アカウントでは不要 */ }
}
