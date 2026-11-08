// 判定結果をLINEの返信文にする（Webと同じ判定エンジン・同じ辞書を使う）
import "../../rules.js";
import "../../engine.js";
import "./demo.js";

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

export function replyFor(text) {
  const t = (text || "").trim();
  if (/^(デモ|でも|demo|ためす|試す)$/i.test(t)) return formatResult(analyzeText(globalThis.KIYAKU_DEMO_TEXT));
  if (/^(使い方|つかいかた|ヘルプ|help|\?|？)$/i.test(t) || t.length < 40) return HELP;
  return formatResult(analyzeText(t));
}
