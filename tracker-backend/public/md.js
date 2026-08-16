/* ============================================================
   Minimal markdown renderer for lesson files.
   Self-hosted because the CSP allows no CDN scripts. Covers the
   constructs the 30 lessons actually use: headings, hr, fenced
   code, tables, blockquotes, nested lists, bold/italic, inline
   code, links. Everything is HTML-escaped before any markup is
   generated, so lesson content can never inject live HTML.
   ============================================================ */

(() => {
  const escape = (s) =>
    s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* Inline formatting runs on escaped text. Code spans are pulled out
     first — behind private-use-area sentinels that cannot occur in real
     lesson text — so bold/italic/link markup never fires inside them. */
  const SENT_A = "";
  const SENT_B = "";
  const SENT_RE = new RegExp(`${SENT_A}(\\d+)${SENT_B}`, "g");

  function inline(text) {
    const codes = [];
    let out = escape(text.replace(/[]/g, "")).replace(/`([^`]+)`/g, (_, code) => {
      codes.push(`<code>${code}</code>`);
      return `${SENT_A}${codes.length - 1}${SENT_B}`;
    });

    out = out
      .replace(/\*\*\*([^*]+)\*\*\*/g, "<strong><em>$1</em></strong>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*\n]+)\*/g, "<em>$1</em>")
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    return out.replace(SENT_RE, (_, i) => codes[i]);
  }

  const isTableRow = (line) => /^\s*\|.*\|\s*$/.test(line);
  const isTableSep = (line) => /^\s*\|[\s:|-]+\|\s*$/.test(line);

  function tableCells(line) {
    return line.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
  }

  const LIST_RE = /^(\s*)([-*]|\d+\.)\s+(.*)$/;

  function render(src) {
    const lines = String(src).replace(/\r\n?/g, "\n").split("\n");
    const html = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      /* fenced code */
      const fence = /^```(\w*)/.exec(line);
      if (fence) {
        const lang = fence[1];
        const buf = [];
        i++;
        while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]);
        i++; // closing fence
        html.push(
          `<div class="code-block">${lang ? `<span class="code-lang">${escape(lang)}</span>` : ""}` +
          `<pre><code>${escape(buf.join("\n"))}</code></pre></div>`
        );
        continue;
      }

      /* blank */
      if (!line.trim()) { i++; continue; }

      /* horizontal rule */
      if (/^\s*(---+|\*\*\*+|___+)\s*$/.test(line)) { html.push("<hr>"); i++; continue; }

      /* heading */
      const h = /^(#{1,4})\s+(.*)$/.exec(line);
      if (h) {
        const level = h[1].length;
        html.push(`<h${level}>${inline(h[2].trim())}</h${level}>`);
        i++;
        continue;
      }

      /* blockquote */
      if (/^\s*>/.test(line)) {
        const buf = [];
        while (i < lines.length && /^\s*>/.test(lines[i])) buf.push(lines[i++].replace(/^\s*>\s?/, ""));
        html.push(`<blockquote>${buf.map((l) => (l.trim() ? `<p>${inline(l)}</p>` : "")).join("")}</blockquote>`);
        continue;
      }

      /* table */
      if (isTableRow(line) && i + 1 < lines.length && isTableSep(lines[i + 1])) {
        const head = tableCells(line).map((c) => `<th>${inline(c)}</th>`).join("");
        i += 2;
        const rows = [];
        while (i < lines.length && isTableRow(lines[i])) {
          rows.push(`<tr>${tableCells(lines[i++]).map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`);
        }
        html.push(
          `<div class="table-wrap"><table><thead><tr>${head}</tr></thead><tbody>${rows.join("")}</tbody></table></div>`
        );
        continue;
      }

      /* list (ordered / unordered, one nesting level) */
      if (LIST_RE.test(line)) {
        const items = [];
        while (i < lines.length && LIST_RE.test(lines[i])) {
          const [, indent, marker, text] = LIST_RE.exec(lines[i]);
          items.push({ depth: indent.length >= 2 ? 1 : 0, ordered: /\d/.test(marker), text });
          i++;
        }
        html.push(renderList(items));
        continue;
      }

      /* paragraph: consume until a blank line or a structural line */
      const buf = [line];
      i++;
      while (
        i < lines.length && lines[i].trim() &&
        !/^(#{1,4})\s|^```|^\s*>|^\s*(---+)\s*$/.test(lines[i]) &&
        !LIST_RE.test(lines[i]) && !isTableRow(lines[i])
      ) {
        buf.push(lines[i++]);
      }
      html.push(`<p>${buf.map((l) => inline(l.trim())).join("<br>")}</p>`);
    }

    return html.join("\n");
  }

  function renderList(items) {
    let out = "";
    let j = 0;
    const openTag = (o) => (o ? "<ol>" : "<ul>");
    const closeTag = (o) => (o ? "</ol>" : "</ul>");
    const rootOrdered = items[0].ordered;
    out += openTag(rootOrdered);
    while (j < items.length) {
      const it = items[j];
      if (it.depth === 0) {
        /* collect any nested children that follow */
        const kids = [];
        let k = j + 1;
        while (k < items.length && items[k].depth === 1) kids.push(items[k++]);
        out += `<li>${inline(it.text)}`;
        if (kids.length) {
          out += openTag(kids[0].ordered) + kids.map((c) => `<li>${inline(c.text)}</li>`).join("") + closeTag(kids[0].ordered);
        }
        out += "</li>";
        j = k;
      } else {
        /* stray nested item with no parent — render flat */
        out += `<li>${inline(it.text)}</li>`;
        j++;
      }
    }
    out += closeTag(rootOrdered);
    return out;
  }

  window.renderMarkdown = render;
})();
