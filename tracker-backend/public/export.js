/* ============================================================
   Git Challenge Tracker — multi-format progress export
   Browser-only generators: JSON, TXT, PDF, DOCX.
   No external services, no new runtime dependencies.
   ============================================================ */

(() => {
  "use strict";

  const FORMAT_META = {
    json: { label: "JSON", ext: "json", mime: "application/json;charset=utf-8" },
    txt:  { label: "Text", ext: "txt", mime: "text/plain;charset=utf-8" },
    pdf:  { label: "PDF", ext: "pdf", mime: "application/pdf" },
    docx: { label: "Word", ext: "docx", mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" },
  };

  const TASK_KEYS = ["concept", "walkthrough", "exerciseA", "exerciseB", "exerciseC", "challenge", "reflection"];
  const PHASE_NAMES = {
    1: "Git Fundamentals",
    2: "GitHub Collaboration",
    3: "Advanced Workflows",
  };

  const escapeXml = (value) => String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

  const formatDate = (value) => {
    if (!value) return "";
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleString();
  };

  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

  function activityEntries(payload) {
    const raw = payload?.activities && typeof payload.activities === "object" ? payload.activities : {};
    return Array.from({ length: 30 }, (_, i) => {
      const day = i + 1;
      const a = raw[day] || raw[String(day)] || {};
      return { day, activity: a && typeof a === "object" ? a : {} };
    });
  }

  function taskCount(activity) {
    const tasks = activity?.tasks && typeof activity.tasks === "object" ? activity.tasks : {};
    return TASK_KEYS.reduce((n, key) => n + (tasks[key] ? 1 : 0), 0);
  }

  function hasWork(activity) {
    if (!activity || typeof activity !== "object") return false;
    if (activity.completed || activity.lessonRead) return true;
    if (taskCount(activity) > 0) return true;
    if (Number(activity.minutes) > 0) return true;
    if (activity.confidence !== null && activity.confidence !== undefined) return true;
    const reflection = activity.reflection && typeof activity.reflection === "object" ? activity.reflection : {};
    return Object.values(reflection).some((v) => String(v ?? "").trim());
  }

  function canonical(payload) {
    const entries = activityEntries(payload);
    const completed = entries.filter(({ activity }) => activity.completed === true).length;
    const minutes = entries.reduce((sum, { activity }) => {
      const value = Number(activity.minutes);
      return sum + (Number.isFinite(value) && value > 0 ? value : 0);
    }, 0);
    const read = entries.filter(({ activity }) => activity.lessonRead === true).length;
    const inProgress = entries.filter(({ activity }) => !activity.completed && hasWork(activity)).length;

    let streak = 0;
    for (let day = 30; day >= 1; day--) {
      if (entries[day - 1].activity.completed === true) streak++;
      else if (streak) break;
    }

    let bestStreak = 0;
    let run = 0;
    for (const { activity } of entries) {
      if (activity.completed === true) bestStreak = Math.max(bestStreak, ++run);
      else run = 0;
    }

    const avgConfidenceValues = entries
      .map(({ activity }) => activity.confidence)
      .filter((value) => typeof value === "number" && Number.isFinite(value));

    return {
      payload,
      entries,
      total: 30,
      completed,
      remaining: 30 - completed,
      percentage: Math.round((completed / 30) * 100),
      read,
      inProgress,
      minutes,
      streak,
      bestStreak,
      avgConfidence: avgConfidenceValues.length
        ? avgConfidenceValues.reduce((a, b) => a + b, 0) / avgConfidenceValues.length
        : null,
    };
  }

  function curriculumFor(day) {
    const row = Array.isArray(window.CURRICULUM) ? window.CURRICULUM[day - 1] : null;
    return row || { day, phase: "", title: `Day ${day}`, goal: "" };
  }

  function statusFor(activity) {
    if (activity?.completed === true) return "Completed";
    if (hasWork(activity)) return "In progress";
    return "Not started";
  }

  function safeName(name) {
    return String(name || "progress").trim().replace(/[^a-z0-9_-]+/gi, "-").replace(/^-+|-+$/g, "") || "progress";
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function fetchExportPayload() {
    let res;
    try {
      res = await fetch("/api/export", {
        method: "GET",
        headers: { Authorization: `Bearer ${localStorage.getItem("gct_token") || ""}` },
      });
    } catch {
      throw new Error("Export failed — the tracker could not be reached.");
    }
    const text = await res.text();
    if (!res.ok) {
      let message = `Export failed (${res.status})`;
      try {
        const error = JSON.parse(text);
        if (error?.error) message = error.error;
      } catch { /* keep status message */ }
      throw new Error(message);
    }
    let payload;
    try {
      payload = JSON.parse(text);
    } catch {
      throw new Error("Export failed — the server returned invalid JSON.");
    }
    if (!payload || typeof payload !== "object" || !payload.activities || typeof payload.activities !== "object") {
      throw new Error("Export failed — the progress payload is incomplete.");
    }
    return { payload, rawJson: text };
  }

  function makeTxt(model) {
    const { payload, entries } = model;
    const lines = [];
    lines.push("GIT CHALLENGE TRACKER — PROGRESS EXPORT");
    lines.push("=".repeat(48));
    lines.push(`User: ${payload.user?.name || "Unknown"}`);
    if (payload.user?.email) lines.push(`Email: ${payload.user.email}`);
    lines.push(`Exported: ${formatDate(payload.exportedAt) || "Not provided"}`);
    lines.push("");
    lines.push("OVERALL PROGRESS");
    lines.push("-".repeat(48));
    lines.push(`Completed: ${model.completed}/${model.total}`);
    lines.push(`Remaining: ${model.remaining}`);
    lines.push(`Completion: ${model.percentage}%`);
    lines.push(`Lessons read: ${model.read}/${model.total}`);
    lines.push(`In progress: ${model.inProgress}`);
    lines.push(`Minutes logged: ${model.minutes}`);
    lines.push(`Current streak: ${model.streak} day(s)`);
    lines.push(`Best streak: ${model.bestStreak} day(s)`);
    if (model.avgConfidence !== null) lines.push(`Average confidence: ${model.avgConfidence.toFixed(1)}/5`);
    lines.push("");
    lines.push("30-DAY STATUS");
    lines.push("-".repeat(48));

    for (const { day, activity } of entries) {
      const c = curriculumFor(day);
      const completedTasks = taskCount(activity);
      lines.push(`Day ${day} — ${c.title}`);
      lines.push(`Phase: ${c.phase ? PHASE_NAMES[c.phase] || `Phase ${c.phase}` : "Not provided"}`);
      lines.push(`Status: ${statusFor(activity)}`);
      lines.push(`Lesson read: ${activity.lessonRead === true ? "Yes" : "No"}`);
      lines.push(`Tasks: ${completedTasks}/7`);
      lines.push(`Minutes: ${Number(activity.minutes) || 0}`);
      if (typeof activity.confidence === "number") lines.push(`Confidence: ${activity.confidence}/5`);
      if (activity.lessonReadAt) lines.push(`Lesson read at: ${formatDate(activity.lessonReadAt)}`);
      lines.push("");
    }

    lines.push("REFLECTION JOURNAL");
    lines.push("-".repeat(48));
    let reflectionCount = 0;
    for (const { day, activity } of entries) {
      const reflection = activity.reflection && typeof activity.reflection === "object" ? activity.reflection : {};
      const answers = Object.entries(reflection).filter(([, value]) => String(value ?? "").trim());
      if (!answers.length) continue;
      reflectionCount += answers.length;
      lines.push(`Day ${day} — ${curriculumFor(day).title}`);
      for (const [key, value] of answers) lines.push(`${key}: ${String(value).trim()}`);
      lines.push("");
    }
    if (!reflectionCount) lines.push("No reflection entries recorded.", "");

    return lines.join("\n");
  }

  /* -------------------------- PDF (image pages) --------------------------
     Canvas rendering is intentional: it preserves the browser's Unicode font
     handling without requiring an embedded font package on Cloudflare. */

  function wrapCanvasText(ctx, text, maxWidth) {
    const words = String(text ?? "").split(/\s+/);
    const lines = [];
    let line = "";
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (ctx.measureText(candidate).width <= maxWidth || !line) line = candidate;
      else { lines.push(line); line = word; }
    }
    if (line) lines.push(line);
    return lines.length ? lines : [""];
  }

  function canvasPage(draw) {
    const canvas = document.createElement("canvas");
    canvas.width = 794;
    canvas.height = 1123;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("PDF export is not supported by this browser.");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#17191c";
    ctx.textBaseline = "top";
    draw(ctx, canvas);
    return canvas;
  }

  function renderPdfPages(model) {
    const pages = [];
    const title = "Git Challenge Tracker";
    const subtitle = "Progress export";
    const margin = 54;
    const contentWidth = 686;
    const lineHeight = 18;

    pages.push(canvasPage((ctx) => {
      ctx.font = "700 34px InterVariable, Arial, sans-serif";
      ctx.fillText(title, margin, 72);
      ctx.font = "500 21px InterVariable, Arial, sans-serif";
      ctx.fillText(subtitle, margin, 118);
      ctx.font = "400 16px InterVariable, Arial, sans-serif";
      ctx.fillStyle = "#5b6470";
      ctx.fillText(`User: ${model.payload.user?.name || "Unknown"}`, margin, 168);
      if (model.payload.user?.email) ctx.fillText(`Email: ${model.payload.user.email}`, margin, 194);
      ctx.fillText(`Exported: ${formatDate(model.payload.exportedAt) || "Not provided"}`, margin, 220);

      ctx.fillStyle = "#17191c";
      ctx.font = "700 20px InterVariable, Arial, sans-serif";
      ctx.fillText("Overall progress", margin, 278);
      ctx.font = "700 48px InterVariable, Arial, sans-serif";
      ctx.fillText(`${model.percentage}%`, margin, 316);
      ctx.font = "400 16px InterVariable, Arial, sans-serif";
      ctx.fillStyle = "#5b6470";
      ctx.fillText(`${model.completed} of ${model.total} days completed`, margin + 116, 330);

      const stats = [
        ["Remaining", model.remaining],
        ["Lessons read", `${model.read}/${model.total}`],
        ["Minutes logged", model.minutes],
        ["Current streak", `${model.streak} day(s)`],
        ["Best streak", `${model.bestStreak} day(s)`],
        ["In progress", model.inProgress],
      ];
      let y = 404;
      for (let i = 0; i < stats.length; i++) {
        const x = margin + (i % 2) * 342;
        if (i && i % 2 === 0) y += 66;
        ctx.fillStyle = "#5b6470";
        ctx.font = "600 13px InterVariable, Arial, sans-serif";
        ctx.fillText(stats[i][0].toUpperCase(), x, y);
        ctx.fillStyle = "#17191c";
        ctx.font = "700 23px InterVariable, Arial, sans-serif";
        ctx.fillText(String(stats[i][1]), x, y + 21);
      }

      ctx.fillStyle = "#5b6470";
      ctx.font = "400 13px InterVariable, Arial, sans-serif";
      ctx.fillText("Generated from the authenticated progress export. No new timestamps or activity are invented.", margin, 930);
    }));

    let current = null;
    let y = 64;

    const newStatusPage = () => canvasPage((ctx) => {
      ctx.font = "700 24px InterVariable, Arial, sans-serif";
      ctx.fillStyle = "#17191c";
      ctx.fillText("30-day status", margin, 52);
    });

    current = newStatusPage();
    const pushStatusHeader = (ctx) => {
      ctx.font = "700 24px InterVariable, Arial, sans-serif";
      ctx.fillStyle = "#17191c";
      ctx.fillText("30-day status", margin, 52);
      ctx.fillStyle = "#8a919b";
      ctx.fillRect(margin, 88, contentWidth, 1);
    };

    // Redraw the page header on the first status page.
    let firstStatus = true;
    for (const { day, activity } of model.entries) {
      if (firstStatus) {
        const ctx = current.getContext("2d");
        pushStatusHeader(ctx);
        y = 112;
        firstStatus = false;
      }
      const c = curriculumFor(day);
      const completedTasks = taskCount(activity);
      const titleLines = wrapCanvasText(ctxFrom(current), `${c.title}`, contentWidth - 84);
      const rowHeight = Math.max(72, 42 + titleLines.length * 18);
      if (y + rowHeight > 1055) {
        pages.push(current);
        current = newStatusPage();
        pushStatusHeader(current.getContext("2d"));
        y = 112;
      }
      const ctx = current.getContext("2d");
      ctx.fillStyle = "#17191c";
      ctx.font = "700 15px InterVariable, Arial, sans-serif";
      ctx.fillText(`Day ${day}`, margin, y);
      ctx.font = "600 14px InterVariable, Arial, sans-serif";
      const status = statusFor(activity);
      ctx.fillText(status, margin + 88, y);
      ctx.font = "400 12px InterVariable, Arial, sans-serif";
      ctx.fillStyle = "#5b6470";
      const phaseText = c.phase ? PHASE_NAMES[c.phase] || `Phase ${c.phase}` : "Phase not provided";
      ctx.fillText(`${phaseText}  •  ${completedTasks}/7 tasks  •  ${Number(activity.minutes) || 0} min`, margin + 88, y + 20);
      ctx.fillText(`Lesson read: ${activity.lessonRead === true ? "Yes" : "No"}`, margin + 88, y + 38);
      if (activity.lessonReadAt) ctx.fillText(`Read at: ${formatDate(activity.lessonReadAt)}`, margin + 286, y + 38);
      ctx.font = "500 13px InterVariable, Arial, sans-serif";
      ctx.fillStyle = "#17191c";
      let ty = y + 58;
      for (const line of titleLines) { ctx.fillText(line, margin, ty); ty += 17; }
      ctx.fillStyle = "#e0e4e9";
      ctx.fillRect(margin, y + rowHeight - 1, contentWidth, 1);
      y += rowHeight;
    }
    pages.push(current);

    // Reflection pages.
    current = null;
    y = 76;
    for (const { day, activity } of model.entries) {
      const reflection = activity.reflection && typeof activity.reflection === "object" ? activity.reflection : {};
      const answers = Object.entries(reflection).filter(([, value]) => String(value ?? "").trim());
      if (!answers.length) continue;
      if (!current) {
        current = canvasPage((ctx) => {
          ctx.font = "700 24px InterVariable, Arial, sans-serif";
          ctx.fillText("Reflection journal", margin, 52);
          ctx.fillStyle = "#8a919b";
          ctx.fillRect(margin, 88, contentWidth, 1);
        });
        y = 112;
      }
      const ctx = current.getContext("2d");
      const heading = `Day ${day} — ${curriculumFor(day).title}`;
      ctx.font = "700 15px InterVariable, Arial, sans-serif";
      const headingLines = wrapCanvasText(ctx, heading, contentWidth);
      let needed = 42 + headingLines.length * 18;
      for (const [key, value] of answers) {
        ctx.font = "600 12px InterVariable, Arial, sans-serif";
        const questionLines = wrapCanvasText(ctx, key, 120);
        ctx.font = "400 12px InterVariable, Arial, sans-serif";
        const answerLines = wrapCanvasText(ctx, String(value).trim(), contentWidth - 130);
        needed += Math.max(questionLines.length, answerLines.length) * 17 + 12;
      }
      if (y + needed > 1055) {
        pages.push(current);
        current = canvasPage((ctx2) => {
          ctx2.font = "700 24px InterVariable, Arial, sans-serif";
          ctx2.fillText("Reflection journal", margin, 52);
          ctx2.fillStyle = "#8a919b";
          ctx2.fillRect(margin, 88, contentWidth, 1);
        });
        y = 112;
      }
      ctx.fillStyle = "#17191c";
      ctx.font = "700 15px InterVariable, Arial, sans-serif";
      for (const line of headingLines) { ctx.fillText(line, margin, y); y += 18; }
      y += 8;
      for (const [key, value] of answers) {
        ctx.font = "600 12px InterVariable, Arial, sans-serif";
        ctx.fillStyle = "#5b6470";
        ctx.fillText(key.toUpperCase(), margin, y);
        y += 16;
        ctx.font = "400 13px InterVariable, Arial, sans-serif";
        ctx.fillStyle = "#17191c";
        const answerLines = wrapCanvasText(ctx, String(value).trim(), contentWidth);
        for (const line of answerLines) { ctx.fillText(line, margin, y); y += lineHeight; }
        y += 10;
      }
      ctx.fillStyle = "#e0e4e9";
      ctx.fillRect(margin, y, contentWidth, 1);
      y += 18;
    }
    if (current) pages.push(current);

    return pages;
  }

  function ctxFrom(canvas) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("PDF export could not create a canvas context.");
    return ctx;
  }

  function jpegBytes(canvas) {
    const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
    const binary = atob(dataUrl.split(",", 2)[1]);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }

  function asciiBytes(text) {
    const out = new Uint8Array(text.length);
    for (let i = 0; i < text.length; i++) out[i] = text.charCodeAt(i) & 0xff;
    return out;
  }

  function concatBytes(...parts) {
    const total = parts.reduce((n, p) => n + p.length, 0);
    const out = new Uint8Array(total);
    let at = 0;
    for (const part of parts) { out.set(part, at); at += part.length; }
    return out;
  }

  function pdfFromCanvases(pages) {
    const objects = [];
    const kids = [];
    const offsets = [0];

    const addObject = (body) => { objects.push(body); return objects.length; };
    const catalogId = addObject(null);
    const pagesId = addObject(null);
    const fontId = addObject(asciiBytes("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"));

    for (const page of pages) {
      const jpg = jpegBytes(page);
      const imgId = addObject(null);
      const pageId = addObject(null);
      const contentId = addObject(null);
      const imageHeader = asciiBytes(
        `<< /Type /XObject /Subtype /Image /Width ${page.width} /Height ${page.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpg.length} >>\nstream\n`
      );
      objects[imgId - 1] = concatBytes(imageHeader, jpg, asciiBytes("\nendstream"));
      const stream = `q\n${page.width} 0 0 ${page.height} 0 0 cm\n/Im0 Do\nQ\n`;
      objects[contentId - 1] = asciiBytes(`<< /Length ${stream.length} >>\nstream\n${stream}endstream`);
      objects[pageId - 1] = asciiBytes(
        `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 595.28 841.89] /Resources << /ProcSet [/PDF /ImageC] /XObject << /Im0 ${imgId} 0 R >> /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentId} 0 R >>`
      );
      kids.push(pageId);
    }

    objects[pagesId - 1] = asciiBytes(`<< /Type /Pages /Count ${kids.length} /Kids [${kids.map((id) => `${id} 0 R`).join(" ")}] >>`);
    objects[catalogId - 1] = asciiBytes(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);

    const chunks = [asciiBytes("%PDF-1.4\n%\xFF\xFF\xFF\xFF\n")];
    let position = chunks[0].length;
    for (let i = 0; i < objects.length; i++) {
      const object = concatBytes(asciiBytes(`${i + 1} 0 obj\n`), objects[i], asciiBytes("\nendobj\n"));
      offsets[i + 1] = position;
      chunks.push(object);
      position += object.length;
    }
    const xrefPos = position;
    const xref = [`xref`, `0 ${objects.length + 1}`, `0000000000 65535 f `];
    for (let i = 1; i <= objects.length; i++) xref.push(`${String(offsets[i]).padStart(10, "0")} 00000 n `);
    xref.push(`trailer`, `<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>`, `startxref`, String(xrefPos), `%%EOF`);
    chunks.push(asciiBytes(`${xref.join("\n")}\n`));
    return concatBytes(...chunks);
  }

  /* -------------------------- DOCX (ZIP/XML) -------------------------- */

  function utf8(text) { return new TextEncoder().encode(String(text ?? "")); }

  function crc32(bytes) {
    let crc = 0xffffffff;
    for (const byte of bytes) {
      crc ^= byte;
      for (let k = 0; k < 8; k++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  function u16(n) { return new Uint8Array([n & 255, (n >>> 8) & 255]); }
  function u32(n) { return new Uint8Array([n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255]); }

  function zipStore(files) {
    const locals = [];
    const centrals = [];
    let offset = 0;
    const dosTime = 0;
    const dosDate = 0;

    for (const file of files) {
      const name = utf8(file.name);
      const data = utf8(file.content);
      const crc = crc32(data);
      const local = concatBytes(
        new Uint8Array([0x50, 0x4b, 0x03, 0x04]), u16(20), u16(0), u16(0), u16(dosTime), u16(dosDate), u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0), name, data
      );
      locals.push(local);
      const central = concatBytes(
        new Uint8Array([0x50, 0x4b, 0x01, 0x02]), u16(20), u16(20), u16(0), u16(0), u16(dosTime), u16(dosDate), u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset), name
      );
      centrals.push(central);
      offset += local.length;
    }

    const centralSize = centrals.reduce((n, p) => n + p.length, 0);
    const centralOffset = offset;
    const end = concatBytes(
      new Uint8Array([0x50, 0x4b, 0x05, 0x06]), u16(0), u16(0), u16(files.length), u16(files.length), u32(centralSize), u32(centralOffset), u16(0)
    );
    return concatBytes(...locals, ...centrals, end);
  }

  function docxParagraph(text, { bold = false, size = 22, color = "17191c" } = {}) {
    const rPr = `${bold ? "<w:b/>" : ""}<w:sz w:val="${size}"/><w:color w:val="${color}"/>`;
    return `<w:p><w:r><w:rPr>${rPr}</w:rPr><w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r></w:p>`;
  }

  function docxTable(rows) {
    const body = rows.map((row, rowIndex) => `<w:tr>${row.map((cell) => `<w:tc><w:tcPr><w:tcW w:w="2200" w:type="dxa"/></w:tcPr>${docxParagraph(cell, { bold: rowIndex === 0, size: rowIndex === 0 ? 19 : 18 })}</w:tc>`).join("")}</w:tr>`).join("");
    return `<w:tbl><w:tblPr><w:tblBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="D9DEE5"/><w:left w:val="single" w:sz="4" w:space="0" w:color="D9DEE5"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="D9DEE5"/><w:right w:val="single" w:sz="4" w:space="0" w:color="D9DEE5"/><w:insideH w:val="single" w:sz="4" w:space="0" w:color="D9DEE5"/><w:insideV w:val="single" w:sz="4" w:space="0" w:color="D9DEE5"/></w:tblBorders></w:tblPr>${body}</w:tbl>`;
  }

  function makeDocx(model) {
    const children = [];
    children.push(docxParagraph("Git Challenge Tracker", { bold: true, size: 34 }));
    children.push(docxParagraph("Progress export", { bold: false, size: 24, color: "5B6470" }));
    children.push(docxParagraph(`User: ${model.payload.user?.name || "Unknown"}`, { size: 20 }));
    if (model.payload.user?.email) children.push(docxParagraph(`Email: ${model.payload.user.email}`, { size: 20 }));
    children.push(docxParagraph(`Exported: ${formatDate(model.payload.exportedAt) || "Not provided"}`, { size: 20 }));
    children.push(docxParagraph(""));
    children.push(docxParagraph("Overall progress", { bold: true, size: 26 }));
    children.push(docxTable([
      ["Metric", "Value"],
      ["Completed", `${model.completed}/${model.total}`],
      ["Remaining", String(model.remaining)],
      ["Completion", `${model.percentage}%`],
      ["Lessons read", `${model.read}/${model.total}`],
      ["In progress", String(model.inProgress)],
      ["Minutes logged", String(model.minutes)],
      ["Current streak", `${model.streak} day(s)`],
      ["Best streak", `${model.bestStreak} day(s)`],
      ...(model.avgConfidence === null ? [] : [["Average confidence", `${model.avgConfidence.toFixed(1)}/5`]]),
    ]));
    children.push(docxParagraph(""));
    children.push(docxParagraph("30-day status", { bold: true, size: 26 }));
    children.push(docxTable([
      ["Day", "Lesson", "Status", "Tasks", "Minutes", "Read"],
      ...model.entries.map(({ day, activity }) => [
        String(day),
        curriculumFor(day).title,
        statusFor(activity),
        `${taskCount(activity)}/7`,
        String(Number(activity.minutes) || 0),
        activity.lessonRead === true ? "Yes" : "No",
      ]),
    ]));

    children.push(docxParagraph(""));
    children.push(docxParagraph("Reflection journal", { bold: true, size: 26 }));
    let reflectionCount = 0;
    for (const { day, activity } of model.entries) {
      const reflection = activity.reflection && typeof activity.reflection === "object" ? activity.reflection : {};
      const answers = Object.entries(reflection).filter(([, value]) => String(value ?? "").trim());
      if (!answers.length) continue;
      reflectionCount += answers.length;
      children.push(docxParagraph(`Day ${day} — ${curriculumFor(day).title}`, { bold: true, size: 21 }));
      for (const [key, value] of answers) {
        children.push(docxParagraph(`${key}:`, { bold: true, size: 19, color: "5B6470" }));
        children.push(docxParagraph(String(value).trim(), { size: 19 }));
      }
    }
    if (!reflectionCount) children.push(docxParagraph("No reflection entries recorded.", { size: 19, color: "5B6470" }));

    const sect = `<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="900" w:right="900" w:bottom="900" w:left="900"/></w:sectPr>`;
    const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${children.join("")}${sect}</w:body></w:document>`;
    const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`;
    const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`;
    const wordRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>`;

    return zipStore([
      { name: "[Content_Types].xml", content: contentTypes },
      { name: "_rels/.rels", content: rels },
      { name: "word/document.xml", content: documentXml },
      { name: "word/_rels/document.xml.rels", content: wordRels },
    ]);
  }

  function injectUi() {
    const button = document.querySelector("#exportBtn");
    if (!button || button.dataset.exportFormatsReady === "true") return false;
    button.dataset.exportFormatsReady = "true";
    button.setAttribute("aria-haspopup", "menu");
    button.setAttribute("aria-expanded", "false");

    const menu = document.createElement("div");
    menu.className = "export-format-menu";
    menu.setAttribute("role", "menu");
    menu.setAttribute("aria-label", "Export format");
    menu.hidden = true;
    menu.innerHTML = [
      ["json", "JSON", "Original machine-readable export"],
      ["pdf", "PDF", "Printable progress report"],
      ["txt", "Text", "Plain-text progress summary"],
      ["docx", "Word", "Editable Microsoft Word document"],
    ].map(([value, label, hint]) => `<button type="button" role="menuitem" data-export-format="${value}"><strong>${label}</strong><span>${hint}</span></button>`).join("");
    document.body.appendChild(menu);

    const close = () => {
      menu.hidden = true;
      button.setAttribute("aria-expanded", "false");
    };
    const position = () => {
      const r = button.getBoundingClientRect();
      const width = Math.min(248, window.innerWidth - 24);
      menu.style.width = `${width}px`;
      const left = clamp(r.left, 12, window.innerWidth - width - 12);
      const preferredTop = r.bottom + 8;
      const menuHeight = menu.offsetHeight || 184;
      const top = preferredTop + menuHeight <= window.innerHeight - 12 ? preferredTop : Math.max(12, r.top - menuHeight - 8);
      menu.style.left = `${left}px`;
      menu.style.top = `${top}px`;
    };
    const open = () => {
      menu.hidden = false;
      button.setAttribute("aria-expanded", "true");
      position();
      menu.querySelector("[data-export-format]")?.focus();
    };

    button.onclick = (event) => {
      event.preventDefault();
      if (menu.hidden) open(); else close();
    };
    button.onkeydown = (event) => {
      if (["Enter", " ", "ArrowDown"].includes(event.key)) {
        event.preventDefault();
        open();
      }
    };
    menu.addEventListener("keydown", (event) => {
      const items = Array.from(menu.querySelectorAll("[data-export-format]"));
      const index = items.indexOf(document.activeElement);
      if (event.key === "Escape") { event.preventDefault(); close(); button.focus(); }
      else if (event.key === "ArrowDown") { event.preventDefault(); items[(index + 1) % items.length]?.focus(); }
      else if (event.key === "ArrowUp") { event.preventDefault(); items[(index - 1 + items.length) % items.length]?.focus(); }
      else if (event.key === "Home") { event.preventDefault(); items[0]?.focus(); }
      else if (event.key === "End") { event.preventDefault(); items.at(-1)?.focus(); }
    });
    document.addEventListener("click", (event) => {
      if (!menu.hidden && !menu.contains(event.target) && event.target !== button) close();
    });
    window.addEventListener("resize", () => { if (!menu.hidden) position(); }, { passive: true });
    window.addEventListener("scroll", () => { if (!menu.hidden) position(); }, { passive: true });

    menu.addEventListener("click", async (event) => {
      const choice = event.target.closest("[data-export-format]");
      if (!choice) return;
      close();
      await exportFormat(choice.dataset.exportFormat);
    });

    return true;
  }

  async function exportFormat(format) {
    const meta = FORMAT_META[format];
    if (!meta) return;
    const button = document.querySelector("#exportBtn");
    if (button) {
      button.disabled = true;
      button.setAttribute("aria-busy", "true");
    }
    try {
      const { payload, rawJson } = await fetchExportPayload();
      const model = canonical(payload);
      const base = `git-challenge-progress-${new Date().toISOString().slice(0, 10)}`;

      if (format === "json") {
        downloadBlob(new Blob([rawJson], { type: meta.mime }), `${base}.json`);
      } else if (format === "txt") {
        downloadBlob(new Blob([makeTxt(model)], { type: meta.mime }), `${base}.txt`);
      } else if (format === "pdf") {
        const pages = renderPdfPages(model);
        const pdfBytes = pdfFromCanvases(pages);
        downloadBlob(new Blob([pdfBytes], { type: meta.mime }), `${base}.pdf`);
      } else if (format === "docx") {
        const docxBytes = makeDocx(model);
        downloadBlob(new Blob([docxBytes], { type: meta.mime }), `${base}.docx`);
      }
      window.toast?.(`${meta.label} export downloaded`);
    } catch (error) {
      window.toast?.(error?.message || "Export failed", true);
    } finally {
      if (button) {
        button.disabled = false;
        button.removeAttribute("aria-busy");
      }
    }
  }

  function boot() {
    if (!injectUi()) return;
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
})();
