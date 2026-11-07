const fs = require("fs"), path = require("path");
const RULES = require("../rules.js"), E = require("../engine.js");
let fail = 0;
const expect = (cond, msg) => { console.log((cond ? "  ✔ " : "  ✘ ") + msg); if (!cond) fail++; };
const run = f => E.analyze(fs.readFileSync(path.join(__dirname, "../samples", f), "utf8"), RULES);
const has = (r, id, sev) => r.findings.some(x => x.ruleId === id && (!sev || x.sev === sev));

console.log("RULES:", RULES.length);
expect(RULES.length === 30, "辞書は30項目");
expect(new Set(RULES.map(r => r.id)).size === 30, "IDが重複しない");

const d = run("demo-wifi.txt");
console.log("demo:", d.danger, "危険 /", d.caution, "注意 / 問題なし:", d.safe.join(","));
for (const f of d.findings) console.log(`   [${f.sev}] ${f.ruleId} ${f.clause}: ${f.match}`);
expect(has(d, "ABS-01", "danger"), "猫の無償譲渡 → ABS-01 危険");
expect(has(d, "EXC-01", "danger"), "一切の責任を負わない → EXC-01 危険");
expect(has(d, "PRV-01"), "提携企業等への提供 → PRV-01");
expect(has(d, "CHG-01"), "通知なく規約変更 → CHG-01");
expect(has(d, "SUS-03"), "その他不適切 → SUS-03");
expect(has(d, "JUR-01"), "専属的合意管轄 → JUR-01");
expect(["第1条（目的）", "第2条（利用登録）", "第4条（料金）", "第6条（禁止事項）"].every(l => d.safe.includes(l)), "第1,2,4,6条は問題なし");

const n = run("normal.txt");
console.log("normal:", n.danger, "危険 /", n.caution, "注意");
for (const f of n.findings) console.log(`   [${f.sev}] ${f.ruleId} ${f.clause}: ${f.match}`);
expect(!has(n, "PRV-01"), "「提供することはありません」は不検出");
expect(!has(n, "CXL-01"), "「解約手数料はかかりません」は不検出");
expect(!has(n, "JUR-03"), "日本法準拠は不検出");
expect(has(n, "EXC-01", "caution") && !has(n, "EXC-01", "danger"), "故意・重過失除外ありの免責 → 注意に格下げ");
expect(n.danger === 0, "普通の規約で危険0件");

// 回帰テスト：実在規約の検証（2026-11-07）で見つかった誤検知パターン
const A = s => E.analyze(s, RULES);
const r1 = A("第1条（ID）\n第三者による不正利用について当社は一切の責任を負わないものとします。\n第2条（その他）\n本サービスは無料です。");
expect(!has(r1, "EXC-01", "danger") && has(r1, "EXC-01", "caution"), "第三者による損害の免責 → 注意");
const r2 = A("第1条（免責）\n当社は本サービスに関し一切の責任を負いません。\n第2条（責任の制限）\n当社の故意又は重過失による場合はこの限りではありません。");
expect(!has(r2, "EXC-01", "danger") && r2.findings.find(f => f.ruleId === "EXC-01").note.includes("第2条"), "別条に故意・重過失の例外 → 注意＋条番号表示");
const r3 = A("第1条（知的財産権）\n当社サービスに関する著作権その他一切の知的財産権は、当社に帰属します。\n第2条（投稿）\n本サービスは無料です。");
expect(!has(r3, "COP-01"), "事業者自身の著作権の帰属 → 不検出");
const r4 = A("第1条（投稿）\nユーザーが投稿したコンテンツの著作権は、当社に無償で譲渡されるものとします。\n第2条\n無料です。");
expect(has(r4, "COP-01", "danger"), "ユーザー投稿の著作権譲渡 → 危険");
const r5 = A("1. 定義\nこの規約は本サービスに適用されます。\n2. 免責\n当社は、サービスの変更によって生じた損害について一切の責任を負いません。");
expect(r5.clauseCount === 2 && has(r5, "EXC-01", "danger"), "「1. 見出し」形式の分割＋例外なし全部免除 → 危険");
const r6 = A("第1条（禁止事項）\n人種、民族、信条、性別による差別的な投稿をしてはなりません。\n第2条（変更）\n本サービスの内容は、将来予告なく変更、追加、削除されることがあります。");
expect(!has(r6, "PRV-02") && !has(r6, "SUS-01"), "禁止事項の「信条」・サービス内容の予告なし変更 → 不検出");
const r7 = A("第1条（停止）\n当社は、事前の通知なく、ユーザーのアカウントを停止できるものとします。\n第2条\n無料です。");
expect(has(r7, "SUS-01"), "通知なしのアカウント停止 → SUS-01");
console.log(fail ? `\n${fail} 件失敗` : "\nすべて成功");
process.exit(fail ? 1 : 0);
