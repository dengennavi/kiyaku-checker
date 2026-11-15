/* サブスク発見：カード明細の文字から、サブスクらしき請求を探す。
 * 明細はブラウザの中だけで調べ、どこにも送らない。
 *
 * 辞書の書き方
 *   keys : 明細に出やすい名前（全角・半角、大文字・小文字の違いは自動でそろえる）
 *   not  : これを含む行は除く（買い物など、サブスクでない請求と区別するため）
 *   page : 規約まとめページ（services/<page>.html）があれば、その名前
 *   how  : 解約する場所（「設定のどこか」まで。細かい手順は公式の案内に任せる）
 */
(function (root) {
  "use strict";

  var DIRECT = "公式サイトかアプリの「アカウント」設定から解約します。iPhone・Android のアプリ内で申し込んだ場合は、Apple・Google Play 側で解約します。";

  var SUBS = [
    // ── まとめ払い（中にいくつものサブスクが入っていることがある） ──
    { id: "apple", name: "Apple（App Store・iCloud+・Apple Music など）", group: "まとめ",
      keys: ["APPLE.COM/BILL", "APPLE.COM", "ITUNES"],
      desc: "iPhone で申し込んだサブスク（iCloud+、Apple Music、ほかの会社のアプリの有料プランなど）は、まとめてこの名前で請求されます。中身は iPhone で確認できます。",
      how: "iPhone の「設定」→ いちばん上の自分の名前 →「サブスクリプション」で、入っているものの一覧と解約ができます。",
      page: "apple" },
    { id: "google", name: "Google（Google Play・Google One・YouTube など）", group: "まとめ",
      keys: ["GOOGLE"], not: ["YOUTUBE"],
      desc: "Android のアプリの有料プラン、Google One（容量の追加）などは、Google の名前で請求されます。",
      how: "Google Play アプリ → 右上のプロフィール →「お支払いと定期購入」→「定期購入」で一覧と解約ができます。",
      page: "google-play" },
    { id: "amazon-prime", name: "Amazonプライム", group: "まとめ",
      keys: ["AMAZON PRIME", "AMAZONPRIME", "AMZN PRIME", "アマゾンプライム", "AMAZONプライム", "プライム会費"],
      desc: "Amazon の会員サービスです。Prime Video の見放題などが含まれます。",
      how: "Amazon の「アカウントサービス」→「プライム」の会員情報から手続きします。" },
    { id: "amazon-digital", name: "Amazon のデジタルサービス（Kindle Unlimited・Prime Video チャンネルなど）", group: "まとめ",
      keys: ["AMAZON DIGITAL", "AMAZON CHANNELS", "KINDLE UNLIMITED", "KINDLE SVCS", "PRIME VIDEO"],
      desc: "Kindle Unlimited や Prime Video のチャンネル（追加の見放題）などの請求です。",
      how: "Amazon の「アカウントサービス」→「メンバーシップおよび購読」で一覧と解約ができます。" },

    // ── 動画 ──
    { id: "netflix", name: "Netflix", group: "動画", keys: ["NETFLIX", "ネットフリックス"], how: DIRECT, page: "netflix" },
    { id: "disney", name: "Disney+（ディズニープラス）", group: "動画", keys: ["DISNEY PLUS", "DISNEYPLUS", "DISNEY+", "ディズニープラス", "ディズニー プラス"], how: DIRECT, page: "disney-plus" },
    { id: "hulu", name: "Hulu", group: "動画", keys: ["HULU", "フールー", "HJホールディングス"], how: DIRECT, page: "hulu" },
    { id: "unext", name: "U-NEXT", group: "動画", keys: ["U-NEXT", "UNEXT", "ユーネクスト"], how: DIRECT },
    { id: "dazn", name: "DAZN", group: "動画", keys: ["DAZN", "ダゾーン"], how: DIRECT, page: "dazn" },
    { id: "abema", name: "ABEMA プレミアム", group: "動画", keys: ["ABEMA", "アベマ"], how: DIRECT },
    { id: "dmm", name: "DMM（DMM TV など）", group: "動画", keys: ["DMM"], how: DIRECT },
    { id: "fod", name: "FOD プレミアム", group: "動画", keys: ["FOD"], how: DIRECT },
    { id: "wowow", name: "WOWOW", group: "動画", keys: ["WOWOW"], how: DIRECT },
    { id: "lemino", name: "Lemino", group: "動画", keys: ["LEMINO"], how: DIRECT },
    { id: "danime", name: "dアニメストア", group: "動画", keys: ["Dアニメ"], how: DIRECT },
    { id: "telasa", name: "TELASA", group: "動画", keys: ["TELASA", "テラサ"], how: DIRECT },
    { id: "youtube", name: "YouTube Premium・YouTube Music", group: "動画", keys: ["YOUTUBE"], how: "YouTube アプリの右上のプロフィール →「購入とメンバーシップ」から解約します。iPhone で申し込んだ場合は Apple 側で解約します。", page: "youtube-premium" },

    // ── 音楽・本・ラジオ ──
    { id: "spotify", name: "Spotify", group: "音楽・本", keys: ["SPOTIFY", "スポティファイ"], how: DIRECT, page: "spotify" },
    { id: "amazon-music", name: "Amazon Music Unlimited", group: "音楽・本", keys: ["AMAZON MUSIC", "AMAZONMUSIC"], how: "Amazon Music の設定、または Amazon の「メンバーシップおよび購読」から解約します。", page: "amazon-music-unlimited" },
    { id: "audible", name: "Audible", group: "音楽・本", keys: ["AUDIBLE", "オーディブル"], how: "解約すると使っていないコインはすぐ消えます。先に使い切ってから、Audible の Web サイトのアカウントサービスで解約します。", page: "audible" },
    { id: "linemusic", name: "LINE MUSIC", group: "音楽・本", keys: ["LINE MUSIC", "LINEMUSIC", "LINEミュージック"], how: DIRECT },
    { id: "awa", name: "AWA", group: "音楽・本", keys: ["AWA INC", "AWA株式会社"], how: DIRECT },
    { id: "radiko", name: "radiko プレミアム", group: "音楽・本", keys: ["RADIKO", "ラジコ"], how: DIRECT, page: "radiko" },
    { id: "cmoa", name: "コミックシーモア", group: "音楽・本", keys: ["CMOA", "シーモア", "NTTソルマーレ"], how: DIRECT, page: "cmoa" },
    { id: "rakuten-magazine", name: "楽天マガジン・楽天ミュージックなど", group: "音楽・本", keys: ["楽天マガジン", "楽天ミュージック", "RAKUTEN MAGAZINE", "RAKUTEN MUSIC"], how: "楽天の各サービスの「会員情報」や「契約情報」から解約します。" },
    { id: "nikkei", name: "日経電子版", group: "音楽・本", keys: ["日経電子版", "NIKKEI"], how: DIRECT },

    // ── AI・仕事のツール ──
    { id: "chatgpt", name: "ChatGPT（OpenAI）", group: "AI・ツール", keys: ["OPENAI", "CHATGPT"], how: DIRECT, page: "chatgpt" },
    { id: "claude", name: "Claude（Anthropic）", group: "AI・ツール", keys: ["ANTHROPIC", "CLAUDE.AI"], how: DIRECT },
    { id: "microsoft", name: "Microsoft 365 など（Microsoft）", group: "AI・ツール", keys: ["MICROSOFT", "MSBILL", "マイクロソフト"], not: ["XBOX"], how: "Microsoft アカウントの「サービスとサブスクリプション」から解約します。", page: "microsoft-365" },
    { id: "adobe", name: "Adobe（Creative Cloud・Acrobat など）", group: "AI・ツール", keys: ["ADOBE", "アドビ"], how: "年間契約の毎月払いプランは、途中で解約すると残りの期間の料金の50%を請求されることがあります。先に契約の種類を確認してから、Adobe アカウントで手続きします。", page: "adobe" },
    { id: "canva", name: "Canva", group: "AI・ツール", keys: ["CANVA"], how: DIRECT, page: "canva" },
    { id: "dropbox", name: "Dropbox", group: "AI・ツール", keys: ["DROPBOX"], how: DIRECT, page: "dropbox" },
    { id: "evernote", name: "Evernote", group: "AI・ツール", keys: ["EVERNOTE", "エバーノート"], how: DIRECT, page: "evernote" },
    { id: "zoom", name: "Zoom", group: "AI・ツール", keys: ["ZOOM.US", "ZOOM.COM", "ZOOM VIDEO", "ZOOM COMMUNICATIONS"], how: "自動更新を止めるには、次の更新の30日前までの連絡が必要なことがあります。Zoom の Web サイトの「請求」から手続きします。", page: "zoom" },
    { id: "notion", name: "Notion", group: "AI・ツール", keys: ["NOTION"], how: DIRECT },
    { id: "duolingo", name: "Duolingo", group: "AI・ツール", keys: ["DUOLINGO"], how: "アカウントを消しただけでは止まりません。ログインして解約の手続きをします。", page: "duolingo" },
    { id: "1password", name: "1Password", group: "AI・ツール", keys: ["1PASSWORD", "AGILEBITS"], how: DIRECT },
    { id: "nordvpn", name: "NordVPN", group: "AI・ツール", keys: ["NORDVPN", "NORD VPN"], how: DIRECT },
    { id: "expressvpn", name: "ExpressVPN", group: "AI・ツール", keys: ["EXPRESSVPN"], how: DIRECT },

    // ── ゲーム ──
    { id: "playstation", name: "PlayStation Plus など（PlayStation）", group: "ゲーム", keys: ["PLAYSTATION", "SONY INTERACTIVE"], how: "PS5・PS4 の設定、または PlayStation の Web サイトの「サブスクリプション管理」で自動更新を止めます。", page: "playstation-plus" },
    { id: "nintendo", name: "Nintendo Switch Online など（任天堂）", group: "ゲーム", keys: ["NINTENDO", "ニンテンドー", "任天堂"], how: "ニンテンドーアカウントの「ショップメニュー」から自動継続購入を止めます。" },
    { id: "xbox", name: "Xbox Game Pass", group: "ゲーム", keys: ["XBOX"], how: "Microsoft アカウントの「サービスとサブスクリプション」か、Xbox 本体から解約します。", page: "xbox-game-pass" },

    // ── そのほか ──
    { id: "lyp", name: "LYPプレミアム（旧 Yahoo!プレミアム）", group: "そのほか", keys: ["LYPプレミアム", "LYP PREMIUM", "YAHOOプレミアム", "YAHOO!プレミアム"], how: "申し込んだ方法（Web・アプリ・携帯会社）によって解約する場所が違います。" },
    { id: "uberone", name: "Uber One", group: "そのほか", keys: ["UBER ONE"], how: DIRECT },
    { id: "x", name: "X Premium（旧 Twitter）", group: "そのほか", keys: ["X CORP", "TWITTER"], how: DIRECT },
    { id: "discord", name: "Discord Nitro", group: "そのほか", keys: ["DISCORD"], how: DIRECT },
    { id: "chocozap", name: "chocoZAP", group: "そのほか", keys: ["CHOCOZAP", "チョコザップ"], how: DIRECT },
    { id: "pixiv", name: "pixiv プレミアム", group: "そのほか", keys: ["PIXIV"], how: DIRECT },
    { id: "niconico", name: "ニコニコ プレミアム会員", group: "そのほか", keys: ["ニコニコ", "NICONICO", "ドワンゴ", "DWANGO"], how: DIRECT }
  ];

  // 全角・半角、大文字・小文字、カタカナの小書きなどをそろえる
  function norm(s) {
    return String(s).normalize("NFKC").toUpperCase().replace(/\s+/g, " ");
  }

  // 金額らしい数字を取り出す（例: 1,490 / ¥990 / 2,189円）
  function amountOf(line) {
    var m = line.match(/[¥￥]\s?([0-9][0-9,]*)|([0-9][0-9,]{1,})\s?円/);
    if (!m) {
      var all = line.match(/(?:^|\s)([0-9]{1,3}(?:,[0-9]{3})+|[0-9]{3,6})(?=\s|$)/g);
      if (!all) return null;
      m = [null, all[all.length - 1].trim()];
    }
    var n = parseInt((m[1] || m[2]).replace(/,/g, ""), 10);
    return isFinite(n) && n > 0 && n < 1000000 ? n : null;
  }

  function find(text) {
    var lines = String(text).split(/\r?\n/).map(function (l) { return l.trim(); }).filter(Boolean);
    var hits = {};
    lines.forEach(function (raw) {
      var line = norm(raw);
      for (var i = 0; i < SUBS.length; i++) {
        var s = SUBS[i];
        var hit = s.keys.some(function (k) { return line.indexOf(norm(k)) !== -1; });
        if (!hit) continue;
        if (s.not && s.not.some(function (k) { return line.indexOf(norm(k)) !== -1; })) continue;
        if (!hits[s.id]) hits[s.id] = { sub: s, lines: [] };
        hits[s.id].lines.push({ text: raw, amount: amountOf(raw) });
        break; // 1行は1つのサービスにだけ数える（辞書の上にあるものを優先）
      }
    });
    return SUBS.filter(function (s) { return hits[s.id]; }).map(function (s) { return hits[s.id]; });
  }

  var api = { SUBS: SUBS, find: find, norm: norm, amountOf: amountOf };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.SubFinder = api;
})(this);
