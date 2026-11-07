/* 画面制御 S01〜S06・E01（ブラウザの戻るにも対応） */
(function () {
  const RULES = window.KIYAKU_RULES, E = window.KiyakuEngine, C = window.KIYAKU_CONFIG || {};
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const SEV = { danger: "🔴要確認", caution: "🟡確認推奨" };
  const SCREENS = ["S01", "S02", "S03", "S04", "S05", "S06", "E01", "RULES"];
  let last = null, currentClause = null;

  // ── 画面遷移 ──
  function show(id, push = true) {
    for (const s of SCREENS) $(s).hidden = s !== id;
    if (push && id !== "S03") history.pushState({ id }, "", "#" + id);
    window.scrollTo(0, 0);
  }
  window.addEventListener("popstate", e => {
    let id = (e.state && e.state.id) || "S01";
    if (["S04", "S05", "S06"].includes(id) && !last) id = "S01";
    show(id, false);
  });
  history.replaceState({ id: "S01" }, "", location.pathname + location.search);
  document.addEventListener("click", e => {
    const t = e.target.closest("[data-go],[data-back],[data-home],[data-v2]");
    if (!t) return;
    e.preventDefault();
    if (t.dataset.v2 !== undefined) { $("v2msg").hidden = false; return; }
    if (t.dataset.back !== undefined) return history.back();
    if (t.dataset.home !== undefined) return show("S01");
    if (t.dataset.clear !== undefined) { $("terms").value = ""; updateCount(); }
    if (t.dataset.go === "S06") prepareReport();
    show(t.dataset.go);
  });

  // ── S02 入力 ──
  const updateCount = () => { $("count").textContent = $("terms").value.length.toLocaleString() + "字"; };
  $("terms").addEventListener("input", updateCount);

  function error(title, body) { $("eTitle").textContent = title; $("eBody").textContent = body; show("E01"); }

  function check() {
    const text = $("terms").value.trim();
    if (!text) return error("規約が入力されていません", "利用規約の本文を貼り付けてください。");
    if (text.length < 10) return error("規約が短すぎます", "本文が10文字未満のため判定できませんでした。利用規約の本文を貼り付けてください。");
    if (!/[぀-ヿ一-鿿]/.test(text)) return error("規約が読めません", "日本語の文章が見つかりませんでした。v1は日本語の規約のみ対応しています。");
    show("S03");
    const steps = document.querySelectorAll("#S03 [data-step]");
    steps.forEach(li => li.className = "");
    let p = 0;
    const tick = setInterval(() => {
      p = Math.min(p + 4, 100);
      $("bar").style.width = p + "%";
      steps.forEach((li, i) => li.className = p >= (i + 1) * 33 ? "done" : p >= i * 33 ? "now" : "");
      if (p >= 100) {
        clearInterval(tick);
        try { last = E.analyze(text, RULES); last.text = text; render(last); show("S04"); }
        catch (err) { console.error(err); error("解析に失敗しました", "テキストを確認して、もう一度お試しください。"); }
      }
    }, 50);
  }
  $("check").onclick = check;
  $("demo").onclick = () => { $("terms").value = window.KIYAKU_DEMO; updateCount(); show("S02"); setTimeout(check, 300); };

  // ── S04 結果 ──
  const hl = (sentence, match, sev) => esc(sentence).replace(esc(match), `<mark class="${sev}">${esc(match)}</mark>`);

  function render(r) {
    const first = r.text.split("\n")[0].trim();
    $("docTitle").textContent = (first.length <= 40 && !/^第/.test(first) ? first : "貼り付けた規約") + "／" + r.text.length.toLocaleString() + "字";
    $("nDanger").textContent = r.danger; $("nCaution").textContent = r.caution; $("nSafe").textContent = r.safe.length;
    $("verdict").textContent = r.danger ? "⚠️ 同意する前に、🔴の条項を必ず確認してください"
      : r.caution ? "🔴の条項は検出されませんでした。🟡の条項は読んでおきましょう"
      : "30項目のルールに該当する条項は検出されませんでした（規約全体が問題ないという意味ではありません）";
    const ul = $("findings"); ul.innerHTML = "";
    r.findings.forEach(f => {
      const li = document.createElement("li"); li.className = f.sev;
      li.innerHTML = `<div class="head"><span>${SEV[f.sev]}</span><code>${f.ruleId}</code></div>
        <div class="clause">${esc(f.clause)}</div>
        <p class="quote">「${hl(f.sentence, f.match, f.sev)}」</p>
        <p class="plain">${esc(f.note ? f.rule.plain + "（例外規定あり）" : f.rule.plain)}</p>`;
      li.onclick = () => openClause(f.clauseIndex);
      ul.appendChild(li);
    });
    $("safeHead").textContent = `🟢該当なし ${r.safe.length}件 ${r.safe.map(s => s.replace(/（.*$/, "")).join("・") || ""}`;
    $("safeList").textContent = r.safe.join("、") || "なし";
  }

  // ── S05 条項詳細（同じ条項の指摘をまとめて表示） ──
  function openClause(idx) {
    const list = last.findings.filter(f => f.clauseIndex === idx);
    currentClause = list;
    const top = list[0];
    $("dTitle").textContent = top.clause.replace(/（.*$/, "") + " の判定";
    $("dBadges").innerHTML = `<span class="t-${top.sev}">${SEV[top.sev]}</span> ` + list.map(f => `<code>${f.ruleId}</code>`).join(" ");
    $("dQuote").innerHTML = "「" + hl(top.sentence, top.match, top.sev) + "」";
    $("dItems").innerHTML = list.map(f => `
      <div class="card item ${f.sev}">
        <h3>${SEV[f.sev]} ${esc(f.rule.title)} <code>${f.ruleId}</code></h3>
        ${f !== top ? `<p class="quote">「${hl(f.sentence, f.match, f.sev)}」</p>` : ""}
        <h4>なぜ確認が必要なのか</h4><p>${esc(f.rule.why)}</p>
        ${f.note ? `<p class="ok">ℹ️ ${esc(f.note)}</p>` : ""}
        <h4>どうすればいい？</h4><p>${esc(f.rule.action)}</p>
        <h4>根拠</h4><p><a href="${esc(f.rule.url)}" target="_blank" rel="noopener">${esc(f.rule.law)} ↗</a></p>
        <p class="sub muted">監修状況：${f.rule.audit.reviewStatus === "reviewed" ? "専門家監修済み" : "専門家の監修前（条文をもとにした初期版）"}</p>
      </div>`).join("");
    $("dDisclaimer").textContent = "⚠ " + RULES.meta.disclaimer;
    show("S05");
  }

  // ── S06 誤検知報告 ──
  function prepareReport() {
    const f = currentClause[0];
    $("rTarget").textContent = `${f.clause}／${currentClause.map(x => x.ruleId).join("・")}`;
    $("rText").value = ""; $("rMsg").hidden = true; $("rNotify").checked = false; $("rEmail").hidden = true;
  }
  $("rNotify").onchange = () => { $("rEmail").hidden = !$("rNotify").checked; };

  function postForm(action, fields) {
    const fd = new FormData();
    for (const k in fields) if (k) fd.append(k, fields[k]);
    return fetch(action, { method: "POST", mode: "no-cors", body: fd });
  }
  function signup(email, source, services = "", role = "") {
    if (!C.signupAction) return Promise.resolve("pending");
    return postForm(C.signupAction, { [C.signupEntry]: email, [C.signupSourceEntry || ""]: source,
      [C.signupServicesEntry || ""]: services, [C.signupRoleEntry || ""]: role }).then(() => "ok");
  }

  $("rSend").onclick = async () => {
    const f = currentClause[0];
    const body = `[辞書v${RULES.meta.dictionaryVersion}] ${f.clause} / ${currentClause.map(x => x.ruleId + ":" + x.match).join(" , ")} / ${$("rText").value.trim()}`;
    try {
      if (C.reportAction) await postForm(C.reportAction, { [C.reportEntry]: body });
      else if (C.reportMail) location.href = `mailto:${C.reportMail}?subject=${encodeURIComponent("誤検知報告")}&body=${encodeURIComponent(body)}`;
      const em = $("rEmail").value.trim();
      if ($("rNotify").checked && em) await signup(em, "report");
    } catch (_) {}
    $("rMsg").textContent = "ありがとうございます！判定の改善に使わせていただきます。"; $("rMsg").hidden = false;
    setTimeout(() => history.back(), 1200);
  };

  document.querySelectorAll(".signupForm").forEach(form => form.onsubmit = async e => {
    e.preventDefault();
    const input = form.querySelector("input[type=email]"), msg = form.parentNode.querySelector(".signupMsg");
    const services = (form.querySelector("[name=services]") || {}).value || "";
    const role = (form.querySelector("[name=role]:checked") || {}).value || "";
    try {
      const r = await signup(input.value.trim(), form.dataset.source, services.trim(), role);
      msg.textContent = r === "ok" ? "✅ 登録しました！準備ができ次第お知らせします。" : "（準備中：登録受付は近日開始します）";
      if (r === "ok") input.value = "";
    } catch (_) { msg.textContent = "送信に失敗しました。時間をおいて再度お試しください。"; }
    msg.hidden = false;
  });

  // ── シェア ──
  function share() {
    if (!last) return;
    const txt = `規約を30項目でチェックしたら 🔴要確認${last.danger}件 / 🟡確認推奨${last.caution}件 でした。\n貼るだけで気になる条項がわかる #規約チェッカー`;
    const url = C.siteUrl || location.href.split("#")[0];
    if (navigator.share && this && this.id === "share") return navigator.share({ text: txt, url }).catch(() => {});
    window.open("https://x.com/intent/post?text=" + encodeURIComponent(txt) + "&url=" + encodeURIComponent(url), "_blank", "noopener");
  }
  $("share").onclick = share; $("shareX").onclick = share;

  // ── 判定基準一覧 ──
  $("dictVer").textContent = `（辞書 v${RULES.meta.dictionaryVersion}／${RULES.meta.releasedAt}）`;
  $("ruleList").innerHTML = RULES.map(r => `<li><b class="t-${r.sev}">${SEV[r.sev]}</b> <code>${r.id}</code> ${esc(r.title)}<br><small class="muted">${esc(r.plain)}｜${esc(r.law)}</small></li>`).join("");
})();
