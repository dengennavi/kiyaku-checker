/* 規約チェッカー 判定エンジン（ブラウザ内で完結。規約テキストはどこにも送信しない） */
(function (root) {
  const RANK = { danger: 2, caution: 1 };

  function normalize(text) {
    return text
      .replace(/\r\n?/g, "\n")
      .replace(/[０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
      .replace(/[ \t　]+/g, " ");
  }

  // 「第N条」で条項に分割。見出しがなければ空行で段落分割
  function splitClauses(text) {
    const t = normalize(text).trim();
    const head = /(?=^\s*第\s*[0-9一二三四五六七八九十百]+\s*条)/m;
    let parts = t.split(head).map(s => s.trim()).filter(Boolean);
    // 「1. 定義」のような番号見出し（短い行・句点なし）でも分割
    const numHead = /(?=^\s*[0-9]{1,2}\s*[.．]\s*[^\s0-9.．][^。\n]{0,40}$)/m;
    if (parts.length < 2) parts = t.split(numHead).map(s => s.trim()).filter(Boolean);
    if (parts.length < 2) parts = t.split(/\n\s*\n/).map(s => s.trim()).filter(Boolean);
    return parts.map((body, i) => {
      const m = body.match(/^\s*(第\s*[0-9一二三四五六七八九十百]+\s*条(?:\s*[（(][^）)\n]{0,30}[）)])?|[0-9]{1,2}\s*[.．]\s*[^。\n]{1,40}(?=\n))/);
      const label = m ? m[1].replace(/\s+/g, "") : (i === 0 && parts.length > 1 ? "前文" : `段落${i + 1}`);
      const text = m ? body.slice(m[0].length) : body;
      return { index: i, label, body: text };
    });
  }

  function splitSentences(body) {
    const flat = body.replace(/\n+/g, "");
    return flat.split(/(?<=[。！？!?])/).map(s => s.trim()).filter(s => s.length > 1);
  }

  function analyze(text, rules) {
    const clauses = splitClauses(text);
    const findings = [];
    // 文書全体の例外規定（例：別条の「故意・重過失を除く」）をルールごとに探す
    const docSave = {};
    for (const rule of rules) {
      if (!rule.docMitigate) continue;
      const c = clauses.find(c => rule.docMitigate.test(c.body.replace(/\n+/g, "")));
      if (c) docSave[rule.id] = c.label;
    }
    for (const c of clauses) {
      const flatClause = c.body.replace(/\n+/g, "");
      const sentences = splitSentences(c.body);
      for (const rule of rules) {
        if (rule.enabled === false) continue;
        let best = null;
        for (const s of sentences) {
          if (rule.exclude && rule.exclude.test(s)) continue;
          for (const p of rule.patterns) {
            const re = p instanceof RegExp ? p : p.re;
            const m = s.match(re);
            if (!m) continue;
            const sev = (p instanceof RegExp ? null : p.sev) || rule.sev;
            if (!best || RANK[sev] > RANK[best.sev]) best = { sev, sentence: s, match: m[0] };
          }
        }
        if (!best) continue;
        let note = null;
        if (best.sev === "danger" && rule.mitigate && rule.mitigate.test(flatClause)) {
          best.sev = "caution"; note = rule.mitigateNote;
        } else if (best.sev === "danger" && rule.soften && rule.soften.test(best.sentence)) {
          best.sev = "caution"; note = rule.softenNote;
        } else if (best.sev === "danger" && docSave[rule.id]) {
          best.sev = "caution"; note = rule.docMitigateNote.replace("{clause}", docSave[rule.id]);
        }
        findings.push({ ruleId: rule.id, rule, clause: c.label, clauseIndex: c.index, ...best, note });
      }
    }
    findings.sort((a, b) => RANK[b.sev] - RANK[a.sev] || a.clauseIndex - b.clauseIndex);
    const hit = new Set(findings.map(f => f.clauseIndex));
    const safe = clauses.filter(c => !hit.has(c.index) && c.label !== "前文").map(c => c.label);
    return {
      clauseCount: clauses.length,
      danger: findings.filter(f => f.sev === "danger").length,
      caution: findings.filter(f => f.sev === "caution").length,
      findings,
      safe
    };
  }

  const api = { analyze, splitClauses, splitSentences, normalize };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.KiyakuEngine = api;
})(this);
