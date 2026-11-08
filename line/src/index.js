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
async function getToken(env) {
  if (cached.token && Date.now() < cached.until) return cached.token;
  const res = await fetch("https://api.line.me/oauth2/v3/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "client_credentials", client_id: env.LINE_CHANNEL_ID, client_secret: env.LINE_CHANNEL_SECRET })
  });
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

export default {
  async fetch(request, env) {
    if (request.method !== "POST") return new Response("kiyaku-line ok");
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
