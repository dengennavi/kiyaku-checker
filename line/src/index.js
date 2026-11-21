// 規約チェッカー LINEボット：LINEから届いた規約の文章を判定して返信する
// 送られた文章は保存しない（ログにも出さない）
import { replyFor, WELCOME, IMAGE_REPLY } from "./format.js";

async function verify(body, signature, secret) {
  if (!signature || !secret) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  const expected = btoa(String.fromCharCode(...new Uint8Array(mac)));
  return expected === signature;
}

// チャネルIDとシークレットから、15分有効のアクセストークンをその都度発行する（長期トークンを置かない）
let cached = { token: null, until: 0 };
function requestToken(env) {
  return fetch("https://api.line.me/oauth2/v3/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "client_credentials", client_id: env.LINE_CHANNEL_ID, client_secret: env.LINE_CHANNEL_SECRET })
  });
}
async function getToken(env) {
  if (cached.token && Date.now() < cached.until) return cached.token;
  const res = await requestToken(env);
  const d = await res.json();
  cached = { token: d.access_token, until: Date.now() + (d.expires_in - 60) * 1000 };
  return cached.token;
}

async function reply(token, replyToken, text) {
  const res = await fetch("https://api.line.me/v2/bot/message/reply", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ replyToken, messages: [{ type: "text", text }] })
  });
  if (!res.ok) console.log("reply failed", res.status);
}

// トーク画面の下に出すメニュー（リッチメニュー）。画像は tools/make_richmenu.py で作り、サイトに置いてある
const RICHMENU_IMAGE = "https://dengennavi.github.io/kiyaku-checker/line/richmenu.png";
const RICHMENU = {
  size: { width: 2500, height: 843 },
  selected: true,
  name: "kiyaku-menu-v1",
  chatBarText: "メニュー",
  areas: [
    { bounds: { x: 0, y: 0, width: 833, height: 843 }, action: { type: "message", text: "使い方" } },
    { bounds: { x: 833, y: 0, width: 834, height: 843 }, action: { type: "message", text: "引き落とし" } },
    { bounds: { x: 1667, y: 0, width: 833, height: 843 }, action: { type: "uri", uri: "https://dengennavi.github.io/kiyaku-checker/services/" } }
  ]
};

// 毎朝のチェック用：/health でIDとシークレットから実際にトークンを発行してみる（中身は返さない・キャッシュも使わない）
async function health(env) {
  let status = 0;
  try {
    const res = await requestToken(env);
    status = res.status;
    if (res.ok && (await res.json()).access_token) return Response.json({ line: "ok" });
  } catch (e) {}
  return Response.json({ line: "ng", status }, { status: 503 });
}

// /setup-menu を開くと、まだ既定のメニューがなければ作って全員に出す（あれば何もしない）
async function setupMenu(env) {
  const token = await getToken(env);
  const auth = { Authorization: `Bearer ${token}` };
  const cur = await fetch("https://api.line.me/v2/bot/user/all/richmenu", { headers: auth });
  if (cur.ok) return "already set: " + (await cur.json()).richMenuId;
  const made = await fetch("https://api.line.me/v2/bot/richmenu", {
    method: "POST", headers: { ...auth, "Content-Type": "application/json" }, body: JSON.stringify(RICHMENU)
  });
  if (!made.ok) return "create failed " + made.status + " " + (await made.text());
  const { richMenuId } = await made.json();
  const png = await fetch(RICHMENU_IMAGE);
  if (!png.ok) return "image fetch failed " + png.status;
  const up = await fetch(`https://api-data.line.me/v2/bot/richmenu/${richMenuId}/content`, {
    method: "POST", headers: { ...auth, "Content-Type": "image/png" }, body: await png.arrayBuffer()
  });
  if (!up.ok) return "upload failed " + up.status + " " + (await up.text());
  const def = await fetch(`https://api.line.me/v2/bot/user/all/richmenu/${richMenuId}`, { method: "POST", headers: auth });
  if (!def.ok) return "set default failed " + def.status + " " + (await def.text());
  return "done: " + richMenuId;
}

export default {
  async fetch(request, env) {
    if (request.method !== "POST") {
      const path = new URL(request.url).pathname;
      if (request.method === "GET" && path === "/health") return health(env);
      if (path === "/setup-menu") return new Response(await setupMenu(env));
      return new Response("kiyaku-line ok");
    }
    const body = await request.text();
    if (!(await verify(body, request.headers.get("x-line-signature"), env.LINE_CHANNEL_SECRET))) {
      return new Response("bad signature", { status: 401 });
    }
    const { events = [] } = JSON.parse(body);
    for (const ev of events) {
      if (!ev.replyToken) continue;
      let text = null;
      if (ev.type === "follow") text = WELCOME;
      else if (ev.type === "message" && ev.message.type === "text") text = replyFor(ev.message.text);
      else if (ev.type === "message" && ev.message.type === "image") text = IMAGE_REPLY;
      else if (ev.type === "message") text = replyFor("");
      if (text) await reply(await getToken(env), ev.replyToken, text);
    }
    return new Response("ok");
  }
};
