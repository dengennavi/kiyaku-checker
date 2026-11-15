// 判定結果をLINEの返信文にする（Webと同じ判定エンジン・同じ辞書を使う）
import "../../rules.js";
import "../../engine.js";
import "./demo.js";
import "../../sub-finder/subs.js";

export const SITE = "https://dengennavi.github.io/kiyaku-checker/";
const RULES = globalThis.KIYAKU_RULES;
const E = globalThis.KiyakuEngine;
const MAX_ITEMS = 6;
const cut = (s, n) => (s.length > n ? s.slice(0, n) + "…" : s);

export const DISCLAIMER = "※公開している30項目のルールとの一致を機械的に表示しています。法的助言ではありません。";

export const HELP = [
  "📄 規約チェッカーの使い方",
  "",
  "利用規約の文章をコピーして、このトークにそのまま貼って送ってください。",
  "数秒で、気になる条項を色分けしてお返しします。",
  "",
  "🔴 要確認：同意前に必ず読みたい条項",
  "🟡 確認推奨：読んでから判断したい条項",
  "🟢 該当なし：30項目のルールに当たらない条項",
  "",
  "まず試すなら「デモ」と送ってください🐱",
  "",
  "💳 カードの利用明細を貼って送ると、払い続けているサブスクを探します（「サブスク」と送ると使い方）",
  "",
  "※送られた規約は判定にだけ使い、保存しません。"
].join("\n");

export const WELCOME = "友だち追加ありがとうございます！\n\n" + HELP;

export const IMAGE_REPLY = "画像（スクショ）の判定は準備中です🙏\n\n規約の文字をコピーして、文章のまま送ってください。\nコピーできない画面の場合は、Web版もお試しください👇\n" + SITE;

export function analyzeText(text) {
  return E.analyze(text, RULES);
}

export function formatResult(r) {
  if (!r.findings.length) {
    return [
      "📄 判定結果",
      `🔴要確認 0件／🟡確認推奨 0件／🟢該当なし ${r.safe.length}条`,
      "",
      "30項目のルールに該当する条項は見つかりませんでした。",
      "（規約全体に問題がないという意味ではありません）",
      "",
      DISCLAIMER
    ].join("\n");
  }
  const lines = [
    "📄 判定結果",
    `🔴要確認 ${r.danger}件／🟡確認推奨 ${r.caution}件／🟢該当なし ${r.safe.length}条`,
    r.danger ? "⚠️ 同意する前に🔴の条項を必ず確認してください" : "🟡の条項は読んでおきましょう",
    ""
  ];
  // 同じ条項の同じ文への指摘は1つにまとめる（並びは🔴が先）
  const groups = [];
  for (const f of r.findings) {
    const g = groups.find(x => x.clauseIndex === f.clauseIndex && x.sentence === f.sentence);
    if (g) g.items.push(f);
    else groups.push({ clauseIndex: f.clauseIndex, clause: f.clause, sentence: f.sentence, sev: f.sev, items: [f] });
  }
  for (const g of groups.slice(0, MAX_ITEMS)) {
    lines.push(`${g.sev === "danger" ? "🔴" : "🟡"} ${g.clause}`);
    lines.push(`「${cut(g.sentence, 70)}」`);
    for (const f of g.items) lines.push(`→ ${f.rule.plain}${f.note ? "（例外の定めあり）" : ""}`);
    lines.push("");
  }
  if (groups.length > MAX_ITEMS) lines.push(`ほか ${groups.length - MAX_ITEMS}か所`, "");
  lines.push("理由と根拠の法律は、Web版で同じ文章を貼ると詳しく見られます👇", SITE, "", DISCLAIMER);
  return cut(lines.join("\n"), 4900);
}

export const CONTACT = "お問い合わせは、Xのダイレクトメッセージ（@kiyaku_checker）でお願いします🙏\nhttps://x.com/kiyaku_checker\n\nこのLINEは、送られた規約に自動で判定結果を返す専用です。";

const SF = globalThis.SubFinder;

export const SUB_HELP = [
  "💳 サブスク発見の使い方",
  "",
  "クレジットカードの利用明細（Webやアプリの明細の文字）をコピーして、このトークに貼って送ってください。",
  "何か月分かまとめて貼ると、毎月払っているものが分かりやすくなります。",
  "",
  "NETFLIX・APPLE.COM/BILL・GOOGLE などの請求名から、入っているサブスクと解約する場所をお返しします。",
  "",
  "※カード番号や氏名は貼らなくて大丈夫です。送られた明細は判定にだけ使い、保存しません。",
  "",
  "Web版はこちら👇",
  SITE + "sub-finder/"
].join("\n");

// 規約らしい文章か（条番号や「規約」がある）
const looksLikeTerms = t => /第\s*[0-9０-９一二三四五六七八九十百]+\s*条/.test(t) || /規約|約款/.test(t);

export function formatSubs(found) {
  const lines = ["💳 見つかったサブスク：" + found.length + "件", ""];
  for (const f of found.slice(0, 10)) {
    const s = f.sub, amounts = f.lines.map(l => l.amount).filter(Boolean);
    const max = amounts.length ? Math.max(...amounts) : null;
    lines.push("■ " + s.name);
    lines.push("明細で" + f.lines.length + "回" + (max ? "（最大" + max.toLocaleString("ja-JP") + "円）" : "") + (f.lines.length >= 2 ? "　毎月払っているかも" : ""));
    lines.push("解約：" + cut(s.how, 90));
    if (s.page) lines.push("規約の解約・返金ルール👇\n" + SITE + "services/" + s.page + ".html");
    else if (s.bill) lines.push("詳しく👇\n" + SITE + "billing/" + s.bill + ".html");
    lines.push("");
  }
  if (found.length > 10) lines.push("ほか " + (found.length - 10) + "件", "");
  lines.push("明細に出ないサブスク（iPhone・Android・Amazon・携帯料金）の確かめ方はWeb版に👇", SITE + "sub-finder/", "", "※よく使われる請求名を機械的に探しています。見つからなかったものが「入っていない」とは限りません。");
  return cut(lines.join("\n"), 4900);
}

export function replyFor(text) {
  const t = (text || "").trim();
  if (/(問い?合わせ|といあわせ|連絡先|運営者|削除し?て|退会)/.test(t) && t.length < 40) return CONTACT;
  if (/^(デモ|でも|demo|ためす|試す)$/i.test(t)) return formatResult(analyzeText(globalThis.KIYAKU_DEMO_TEXT));
  if (/(サブスク|さぶすく|明細)/.test(t) && t.length < 40) return SUB_HELP;
  if (/^(使い方|つかいかた|ヘルプ|help|\?|？)$/i.test(t)) return HELP;
  if (!looksLikeTerms(t)) {
    const found = SF.find(t);
    if (found.length) return formatSubs(found);
  }
  if (t.length < 40) return HELP;
  return formatResult(analyzeText(t));
}
