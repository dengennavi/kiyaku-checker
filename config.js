// 公開前にここだけ設定する
window.KIYAKU_CONFIG = {
  siteUrl: "",                               // 公開URL（シェア用。空なら現在のURL）
  // 先行登録（Googleフォーム「規約チェッカー 先行登録」→ スプレッドシート「規約チェッカー 集計」）
  signupAction: "https://docs.google.com/forms/d/e/1FAIpQLSfg6jGXK1tC2Xpo9RLOC_PXTSxaHh7mVqFeF77x-bwzl7WzMg/formResponse",
  signupEntry: "entry.1531211207",           // メールアドレス
  signupServicesEntry: "entry.1266492725",   // 見張ってほしいサービス
  signupRoleEntry: "entry.2046909833",       // 立場（user / business）
  signupSourceEntry: "entry.1219591175",     // 経路（result / report）
  // 誤検知報告（Googleフォーム「規約チェッカー 誤検知報告」）
  reportAction: "https://docs.google.com/forms/d/e/1FAIpQLSdZwMaibUlkb2ad5QagQ0GLmP1K_mtEawzlea44TsUhlDhJow/formResponse",
  reportEntry: "entry.2283972",
  reportMail: ""
};
