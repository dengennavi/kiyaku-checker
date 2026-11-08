// LINE返信文のテスト（node test.js）
import { replyFor, HELP } from "./src/format.js";
let fail = 0;
const ok = (c, m) => { console.log((c ? "  ✔ " : "  ✘ ") + m); if (!c) fail++; };
const demo = replyFor("デモ");
console.log(demo);
ok(demo.includes("🔴要確認 2件") && demo.includes("猫"), "「デモ」で猫の条項が🔴");
ok(demo.length < 5000, "LINEの文字数上限（5000）以内");
ok(replyFor("こんにちは") === HELP, "短い文は使い方を返す");
const normal = replyFor("第1条（適用）\n本規約は本サービスの利用に適用されます。\n第2条（料金）\n本サービスは無料でご利用いただけます。解約手数料はかかりません。");
ok(normal.includes("見つかりませんでした"), "該当なしの規約");
ok(replyFor("お問い合わせ").includes("@kiyaku_checker"), "問い合わせはXのDMを案内");
console.log(fail ? `${fail}件失敗` : "すべて成功"); process.exit(fail ? 1 : 0);
