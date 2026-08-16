/* ============================================================
   Git Challenge Tracker — client
   ============================================================ */

const store = {
  token: localStorage.getItem("gct_token"),
  user: null,
  activities: {},
  lessons: {}, // day -> markdown, cached for the session
  view: "dashboard",
  openDay: null,
  dayTab: null, // "lesson" | "practice" within the open day
};

const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const ICO = {
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 12.5 9 17l10.5-10.5"/></svg>',
  arrowL: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 6l-6 6 6 6"/></svg>',
  arrowR: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 6l6 6-6 6"/></svg>',
  play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5z"/></svg>',
  flame: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3s5 4.5 5 9a5 5 0 0 1-10 0c0-2 1-3.5 1-3.5S7 11 7 13a5 5 0 0 0 10 0"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7.5V12l3 2"/></svg>',
  target: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r=".9" fill="currentColor"/></svg>',
  gauge: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M4 17a8 8 0 1 1 16 0"/><path d="M12 17l4-5"/></svg>',
  book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19v18H6.5A2.5 2.5 0 0 1 4 18.5z"/><path d="M8 8h7M8 12h7"/></svg>',
  chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
  saved: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 12.5 9 17l10.5-10.5"/></svg>',
  lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
};

const ACHIEVEMENTS = [
  { icon: "&#127793;", name: "First Commit",  desc: "Complete day 1",         test: (s) => s.done >= 1 },
  { icon: "&#9889;",   name: "Momentum",      desc: "Reach a 5-day streak",   test: (s) => s.best >= 5 },
  { icon: "&#128293;", name: "Week One",      desc: "Complete 7 days",        test: (s) => s.done >= 7 },
  { icon: "&#9881;",   name: "Fundamentals",  desc: "Clear phase 1",          test: (s) => s.byPhase[1] >= 10 },
  { icon: "&#9201;",   name: "Ten Hours",     desc: "Log 10 hours of work",   test: (s) => s.minutes >= 600 },
  { icon: "&#9986;",   name: "Reflective",    desc: "Write 10 journal entries", test: (s) => s.journal >= 10 },
  { icon: "&#9968;",   name: "Halfway",       desc: "Complete 15 days",       test: (s) => s.done >= 15 },
  { icon: "&#129309;", name: "Collaborator",  desc: "Clear phase 2",          test: (s) => s.byPhase[2] >= 10 },
  { icon: "&#127942;", name: "Git Fluent",    desc: "Complete all 30 days",   test: (s) => s.done >= 30 },
];

/* ---------------------------- api ---------------------------- */

async function api(method, path, body) {
  let res;
  try {
    res = await fetch(path, {
      method,
      headers: { "Content-Type": "application/json", ...(store.token ? { Authorization: `Bearer ${store.token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("Server unreachable — is the tracker window still open?");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

function toast(msg, isError) {
  const el = $("#toast");
  el.textContent = msg;
  el.classList.toggle("err", !!isError);
  el.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove("show"), 2400);
}

/* ---------------------------- auth ---------------------------- */

let signupMode = false;

/* Mirrors the server's rules (server.js) so users get instant feedback
   instead of a round-trip for obviously bad input. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function setFieldError(field, msg) {
  const input = $(`#${field}`);
  const box = $(`#${field}Error`);
  box.textContent = msg;
  box.classList.toggle("hidden", !msg);
  input.setAttribute("aria-invalid", msg ? "true" : "false");
}

function clearAuthErrors() {
  for (const f of ["name", "email", "password"]) setFieldError(f, "");
  $("#authError").classList.add("hidden");
}

function validateAuthForm() {
  const email = $("#email").value.trim();
  const password = $("#password").value;
  let firstBad = null;

  if (signupMode) {
    const name = $("#name").value.trim();
    if (!name) { setFieldError("name", "Enter your name."); firstBad = firstBad || "name"; }
    else setFieldError("name", "");
  }

  if (!email) { setFieldError("email", "Enter your email address."); firstBad = firstBad || "email"; }
  else if (email.length > 254 || !EMAIL_RE.test(email)) { setFieldError("email", "Enter a valid email address, like you@example.com."); firstBad = firstBad || "email"; }
  else setFieldError("email", "");

  if (!password) { setFieldError("password", "Enter your password."); firstBad = firstBad || "password"; }
  else if (signupMode && password.length < 8) { setFieldError("password", "Password must be at least 8 characters."); firstBad = firstBad || "password"; }
  else setFieldError("password", "");

  if (firstBad) $(`#${firstBad}`).focus();
  return !firstBad;
}

for (const f of ["name", "email", "password"]) {
  $(`#${f}`).addEventListener("input", () => setFieldError(f, ""));
}

function paintAuthMode() {
  $("#nameField").classList.toggle("hidden", !signupMode);
  $("#pwHint").classList.toggle("hidden", !signupMode);
  $("#name").required = signupMode;
  $("#authTitle").textContent = signupMode ? "Create your account" : "Sign in";
  $("#authSub").textContent = signupMode
    ? "Everything is stored locally on this machine."
    : "Pick up where you left off.";
  $("#authSubmit").textContent = signupMode ? "Create account" : "Sign in";
  $("#toggleText").textContent = signupMode ? "Already have an account?" : "Don't have an account yet?";
  $("#toggleMode").textContent = signupMode ? "Sign in" : "Create one";
  $("#password").autocomplete = signupMode ? "new-password" : "current-password";
  clearAuthErrors();
}

$("#toggleMode").onclick = () => { signupMode = !signupMode; paintAuthMode(); };

$("#pwToggle").onclick = () => {
  const input = $("#password");
  const show = input.type === "password";
  input.type = show ? "text" : "password";
  $("#pwToggle").textContent = show ? "Hide" : "Show";
  $("#pwToggle").setAttribute("aria-label", show ? "Hide password" : "Show password");
  input.focus();
};

$("#authForm").onsubmit = async (e) => {
  e.preventDefault();
  if (!validateAuthForm()) return;
  const btn = $("#authSubmit");
  btn.disabled = true;
  try {
    const body = {
      email: $("#email").value.trim(),
      password: $("#password").value,
      ...(signupMode ? { name: $("#name").value.trim() } : {}),
    };
    const { token, user } = await api("POST", signupMode ? "/api/auth/signup" : "/api/auth/login", body);
    store.token = token;
    store.user = user;
    localStorage.setItem("gct_token", token);
    $("#password").value = "";
    await boot();
  } catch (err) {
    const box = $("#authError");
    box.textContent = err.message;
    box.classList.remove("hidden");
  } finally {
    btn.disabled = false;
  }
};

$("#logoutBtn").onclick = () => {
  stopTimer();
  timer = { seconds: 0, handle: null, day: null };
  localStorage.removeItem(TIMER_KEY);
  localStorage.removeItem("gct_token");
  Object.assign(store, { token: null, user: null, activities: {}, lessons: {}, view: "dashboard", openDay: null, dayTab: null });
  $("#app").classList.add("hidden");
  $("#auth").classList.remove("hidden");
  paintAuthMode();
};

/* ---------------------------- derived ---------------------------- */

function dayPct(day) {
  const tasks = store.activities[day]?.tasks;
  if (!tasks) return 0;
  return TASKS.filter((t) => tasks[t.key]).length / TASKS.length;
}

function hasReflection(a) {
  return Object.values(a?.reflection || {}).some((v) => String(v || "").trim());
}

function stats() {
  const all = Object.values(store.activities);
  const done = all.filter((a) => a.completed).length;
  const minutes = all.reduce((n, a) => n + (a.minutes || 0), 0);
  const confs = all.map((a) => a.confidence).filter((c) => typeof c === "number");

  const byPhase = { 1: 0, 2: 0, 3: 0 };
  for (const a of all) if (a.completed) byPhase[CURRICULUM[a.day - 1].phase]++;

  let streak = 0;
  for (let d = 30; d >= 1; d--) {
    if (store.activities[d]?.completed) streak++;
    else if (streak > 0) break;
  }
  let best = 0, run = 0;
  for (let d = 1; d <= 30; d++) {
    if (store.activities[d]?.completed) best = Math.max(best, ++run);
    else run = 0;
  }

  return {
    done, minutes, byPhase, streak, best,
    pct: Math.round((done / 30) * 100),
    avgConf: confs.length ? confs.reduce((a, b) => a + b, 0) / confs.length : null,
    avgMin: done ? Math.round(minutes / done) : 0,
    journal: all.filter(hasReflection).length,
    inProgress: all.filter((a) => !a.completed && dayPct(a.day) > 0).length,
  };
}

/* Reading gate — mirrors the server's rule: day 1 is always open; each
   later day opens once the previous day's lesson is marked read. The
   frontier is the first unread day; everything at or before it is
   accessible, everything past it is locked. */
function frontierDay() {
  for (let d = 1; d <= 30; d++) if (!store.activities[d]?.lessonRead) return d;
  return 31; // every lesson read — nothing is locked
}

const dayAccessible = (d) => d <= frontierDay();

/* First day still worth working on — never points past the reading frontier. */
const nextDay = () => {
  const frontier = Math.min(frontierDay(), 30);
  for (let d = 1; d <= frontier; d++) if (!store.activities[d]?.completed) return d;
  return frontier;
};

/* ---------------------------- chrome ---------------------------- */

function paintChrome() {
  const s = stats();
  const C = 2 * Math.PI * 22;
  $("#ring").setAttribute("stroke-dasharray", C);
  $("#ring").setAttribute("stroke-dashoffset", C * (1 - s.done / 30));
  $("#ringPct").textContent = `${s.pct}%`;
  $("#wDays").innerHTML = `${s.done}<span style="font-size:13px;color:var(--text-mute);font-weight:500">/30</span>`;
  $("#wSub").textContent = s.streak ? `${s.streak}-day streak` : "days complete";
  $("#navDay").textContent = store.openDay || nextDay();
  $("#navJournal").textContent = s.journal;
  $("#userName").textContent = store.user.name;
  $("#avatar").textContent = (store.user.name.trim()[0] || "?").toUpperCase();
  $("#userSub").textContent = `${(s.minutes / 60).toFixed(1)}h logged`;

  $("#phaseMini").innerHTML = [1, 2, 3].map((p) => {
    const n = s.byPhase[p];
    const color = n === 10 ? "var(--green)" : n > 0 ? "var(--blue)" : "var(--layer-3)";
    return `<div class="phase-mini-row">
      <div class="top"><b>${esc(PHASES[p].name)}</b><span class="num">${n}/10</span></div>
      <div class="track"><i style="width:${n * 10}%;background:${color}"></i></div>
    </div>`;
  }).join("");
}

$$("#nav button[data-view]").forEach((btn) => {
  btn.onclick = () => go(btn.dataset.view);
});

function go(view, day) {
  store.view = view;
  if (day) {
    if (day !== store.openDay) store.dayTab = null;
    store.openDay = day;
  }
  if (view === "today" && !store.openDay) store.openDay = nextDay();
  $$("#nav button[data-view]").forEach((b) => b.classList.toggle("active", b.dataset.view === view));
  render();
}

$("#themeBtn").onclick = () => {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  localStorage.setItem("gct_theme", next);
};

$("#exportBtn").onclick = async () => {
  try {
    const res = await fetch("/api/export", { headers: { Authorization: `Bearer ${store.token}` } });
    if (!res.ok) throw new Error("Export failed");
    const url = URL.createObjectURL(await res.blob());
    const a = document.createElement("a");
    a.href = url;
    a.download = "git-challenge-progress.json";
    a.click();
    URL.revokeObjectURL(url);
    toast("Progress exported");
  } catch (err) {
    toast(err.message, true);
  }
};

/* ---------------------------- render ---------------------------- */

const VIEWS = { dashboard: viewDashboard, today: viewDay, journal: viewJournal, stats: viewStats };
const WIRES = { dashboard: wireDashboard, today: wireDay, stats: wireStats };

/* ---- chart tooltip layer (shared) -----------------------------------
   Values go in via textContent — labels are data, never markup. */

function tipShow(x, y, value, label) {
  const el = $("#vizTip");
  $("#vizTipV").textContent = value;
  $("#vizTipL").textContent = label;
  el.classList.add("show");
  el.setAttribute("aria-hidden", "false");
  const r = el.getBoundingClientRect();
  el.style.left = `${Math.min(Math.max(8, x + 14), window.innerWidth - r.width - 8)}px`;
  el.style.top = `${Math.min(Math.max(8, y - r.height - 12), window.innerHeight - r.height - 8)}px`;
}

function tipHide() {
  const el = $("#vizTip");
  el.classList.remove("show");
  el.setAttribute("aria-hidden", "true");
}

function bindTips(root) {
  if (!root) return;
  root.addEventListener("pointermove", (e) => {
    const t = e.target.closest("[data-tip-v]");
    if (t) tipShow(e.clientX, e.clientY, t.dataset.tipV, t.dataset.tipL);
    else tipHide();
  });
  root.addEventListener("pointerleave", tipHide);
  root.addEventListener("focusin", (e) => {
    const t = e.target.closest("[data-tip-v]");
    if (!t) return;
    const r = t.getBoundingClientRect();
    tipShow(r.left + r.width / 2, r.top, t.dataset.tipV, t.dataset.tipL);
  });
  root.addEventListener("focusout", tipHide);
}

/* 12-point sparkline: line in the de-emphasis hue, current point accented */
function sparkline(values) {
  const pts = values.slice(-12);
  if (pts.length < 2) return "";
  const w = 64, h = 26, max = Math.max(...pts, 1);
  const xy = pts.map((v, i) => [
    ((i / (pts.length - 1)) * (w - 6) + 3).toFixed(1),
    (h - 3 - (v / max) * (h - 8)).toFixed(1),
  ]);
  const [cx, cy] = xy[xy.length - 1];
  return `<svg class="spark" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true">
    <polyline points="${xy.map((p) => p.join(",")).join(" ")}"/>
    <circle cx="${cx}" cy="${cy}" r="3"/>
  </svg>`;
}

function render() {
  paintChrome();
  $("#main").innerHTML = VIEWS[store.view]();
  WIRES[store.view]?.();
  window.scrollTo({ top: 0 });
}

function tile(label, icon, value, unit, note, tint, spark = "") {
  return `<div class="tile" style="--tint:${tint}">
    <div class="eyebrow">${icon}${esc(label)}</div>
    <div class="v">${value}${unit ? `<small>${unit}</small>` : ""}</div>
    <div class="note">${esc(note)}</div>${spark}
  </div>`;
}

function achievementCard(s) {
  const rows = ACHIEVEMENTS.map((a) => {
    const got = a.test(s);
    return `<div class="achv-row ${got ? "got" : ""}">
      <div class="achv-ico">${a.icon}</div>
      <div class="achv-txt"><strong>${a.name}</strong><span>${esc(a.desc)}</span></div>
      ${got ? '<span class="chip g">earned</span>' : ""}
    </div>`;
  }).join("");
  const got = ACHIEVEMENTS.filter((a) => a.test(s)).length;
  return `<div class="card">
    <div class="card-head"><h2>Milestones</h2><span class="aside num">${got}/${ACHIEVEMENTS.length}</span></div>
    <div class="card-body tight"><div class="achv">${rows}</div></div>
  </div>`;
}

/* ---------------------------- dashboard ---------------------------- */

function viewDashboard() {
  const s = stats();
  const nd = nextDay();
  const lesson = CURRICULUM[nd - 1];
  const started = dayPct(nd) > 0;

  const phases = [1, 2, 3].map((p) => {
    const days = CURRICULUM.filter((d) => d.phase === p);
    const n = s.byPhase[p];
    const cells = days.map((d) => {
      const pct = dayPct(d.day);
      const act = store.activities[d.day];
      const done = act?.completed;
      const locked = !dayAccessible(d.day);
      const cls = ["day-cell", done ? "done" : pct > 0 ? "partial" : "", d.day === nd ? "next" : "", locked ? "locked" : ""].filter(Boolean).join(" ");
      const chip = locked
        ? `<span class="chip lock" title="Read day ${d.day - 1}'s lesson to unlock">${ICO.lock}</span>`
        : done
          ? `<span class="chip g">done</span>`
          : d.day === nd
            ? `<span class="chip a">next</span>`
            : pct > 0
              ? `<span class="chip b">${Math.round(pct * 100)}%</span>`
              : act?.lessonRead
                ? `<span class="chip b">read</span>`
                : "";
      return `<button class="${cls}" data-day="${d.day}" aria-label="Day ${d.day}: ${esc(d.title)}${locked ? " (locked)" : ""}">
        <div class="top"><span class="dnum">DAY ${String(d.day).padStart(2, "0")}</span>${chip}</div>
        <span class="dtitle">${esc(d.title)}</span>
        <span class="track"><i style="width:${pct * 100}%;background:${done ? "var(--green)" : "var(--blue)"}"></i></span>
      </button>`;
    }).join("");

    return `<section class="phase-sec">
      <div class="phase-sec-head">
        <div class="phase-badge">${p}</div>
        <div class="txt"><h3>${esc(PHASES[p].name)}</h3><span>${esc(PHASES[p].blurb)}</span></div>
        <span class="ratio num">${n}/10</span>
      </div>
      <div class="day-grid">${cells}</div>
    </section>`;
  }).join("");

  const remainingHours = ((30 - s.done) * (s.avgMin || 90) / 60).toFixed(1);

  const hour = new Date().getHours();
  const hello = hour < 5 ? "Working late" : hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const today = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  const firstName = store.user.name.trim().split(/\s+/)[0];

  const minutesSeries = Array.from({ length: 30 }, (_, i) => store.activities[i + 1]?.minutes || 0)
    .filter((m, i) => m > 0 || store.activities[i + 1]);

  const finished = s.done === 30;

  const hero = finished
    ? `<div class="hero">
        <div class="txt">
          <span class="badge g">Challenge complete</span>
          <h2>All 30 days done. You're Git fluent. &#127881;</h2>
          <p>${(s.minutes / 60).toFixed(1)} hours of deliberate practice across ${s.done} sessions — best streak ${s.best} days.</p>
        </div>
        <button class="btn" id="heroStart">View your statistics</button>
      </div>`
    : `<div class="hero">
        <div class="txt">
          <span class="badge a">${s.done === 0 && !started ? "Start here" : started ? "In progress" : "Up next"} &middot; Day ${nd} of 30</span>
          <h2>${esc(lesson.title)}</h2>
          <p>${s.done === 0 && !started ? "Your first 90-minute session. The checklist walks you through it block by block." : esc(lesson.goal)}</p>
        </div>
        <button class="btn" id="heroStart">${ICO.play} ${started ? "Resume session" : s.done === 0 ? "Start day 1" : store.activities[nd]?.lessonRead ? "Start session" : "Read the lesson"}</button>
      </div>`;

  return `
    <div class="greet">${hello}, ${esc(firstName)} &middot; ${esc(today)}</div>
    ${hero}

    <div class="tiles">
      ${tile("Days complete", ICO.target, s.done, "/30", `${30 - s.done} remaining`, "var(--chart-green)")}
      ${tile("Current streak", ICO.flame, s.streak, s.streak === 1 ? " day" : " days", `Best run: ${s.best}`, "var(--chart-orange)")}
      ${tile("Time invested", ICO.clock, (s.minutes / 60).toFixed(1), "h", `${s.avgMin || 0} min per session`, "var(--chart-blue)", sparkline(minutesSeries))}
      ${tile("Avg confidence", ICO.gauge, s.avgConf ? s.avgConf.toFixed(1) : "—", s.avgConf ? "/5" : "", s.avgConf ? "Self-rated" : "Rate after a session", "var(--chart-purple)")}
    </div>

    <div class="cols">
      <div class="card"><div class="card-body flush">${phases}</div></div>

      <div class="rail">
        ${finished
          ? `<div class="card">
              <div class="card-head"><h2>Well earned</h2><span class="badge g">30/30</span></div>
              <div class="card-body">
                <p style="color:var(--text-dim);font-size:13px;margin-bottom:16px">Every day, every phase, done. Revisit any session from the map below, or export your full journal as a keepsake.</p>
                <div class="kv"><span>Total time</span><b class="num">${(s.minutes / 60).toFixed(1)} h</b></div>
                <div class="kv"><span>Best streak</span><b class="num">${s.best} days</b></div>
                <div class="kv"><span>Journal entries</span><b class="num">${s.journal}</b></div>
                <button class="btn btn-block" id="railStart" style="margin-top:16px">Export progress</button>
              </div>
            </div>`
          : `<div class="card">
              <div class="card-head"><h2>Up next</h2><span class="badge">Day ${nd}</span></div>
              <div class="card-body">
                <h3 style="font-size:16px;margin-bottom:4px">${esc(lesson.title)}</h3>
                <p style="color:var(--text-dim);font-size:13px;margin-bottom:16px">${esc(lesson.goal)}</p>
                <div class="kv"><span>Phase</span><b>${lesson.phase} &middot; ${esc(PHASES[lesson.phase].name)}</b></div>
                <div class="kv"><span>Session length</span><b>90 min</b></div>
                <div class="kv"><span>Lesson</span><b>${store.activities[nd]?.lessonRead ? "Read" : store.activities[nd]?.readPct ? `${store.activities[nd].readPct}% read` : "Not read yet"}</b></div>
                <div class="kv"><span>Checklist items</span><b>${TASKS.filter((t) => store.activities[nd]?.tasks?.[t.key]).length}/${TASKS.length}</b></div>
                <button class="btn btn-block" id="railStart" style="margin-top:16px">${started ? "Resume" : "Begin"} day ${nd}</button>
              </div>
            </div>`}

        <div class="card">
          <div class="card-head"><h2>Pace</h2></div>
          <div class="card-body">
            <div class="kv"><span>Sessions logged</span><b class="num">${s.done + s.inProgress}</b></div>
            <div class="kv"><span>In progress</span><b class="num">${s.inProgress}</b></div>
            <div class="kv"><span>Avg per session</span><b class="num">${s.avgMin || 0} min</b></div>
            <div class="kv"><span>Est. time remaining</span><b class="num">${remainingHours} h</b></div>
            <div class="kv"><span>Journal entries</span><b class="num">${s.journal}</b></div>
          </div>
        </div>

        ${achievementCard(s)}
      </div>
    </div>`;
}

function wireDashboard() {
  $$(".day-cell").forEach((c) => { c.onclick = () => go("today", Number(c.dataset.day)); });
  const finished = stats().done === 30;
  $("#heroStart").onclick = finished ? () => go("stats") : () => go("today", nextDay());
  $("#railStart").onclick = finished ? () => $("#exportBtn").click() : () => go("today", nextDay());
}

/* ---------------------------- day ---------------------------- */

function viewLockedDay(day) {
  const frontier = Math.min(frontierDay(), 30);
  const gate = CURRICULUM[frontier - 1];
  const lesson = CURRICULUM[day - 1];
  const readPct = store.activities[frontier]?.readPct || 0;

  return `
    <div class="page-head">
      <div class="lede">
        <a class="back-link" id="backLink" href="#">${ICO.arrowL} All days</a>
        <div style="display:flex;align-items:center;gap:9px;flex-wrap:wrap;margin-bottom:7px">
          <span class="badge">${ICO.lock} Day ${day} &middot; Locked</span>
          <span class="chip">Phase ${lesson.phase} &middot; ${esc(PHASES[lesson.phase].name)}</span>
        </div>
        <h1>${esc(lesson.title)}</h1>
        <p>Lessons unlock in order — one day at a time.</p>
      </div>
    </div>

    <div class="card"><div class="locked-panel">
      <div class="lock-badge">${ICO.lock}</div>
      <h2>Day ${day} is still locked</h2>
      <p>Finish reading <b>Day ${frontier} — ${esc(gate.title)}</b> to keep moving.
         ${readPct ? `You're ${readPct}% of the way through it.` : "You haven't started it yet."}</p>
      <button class="btn" id="goFrontier">${ICO.play} ${readPct ? "Continue" : "Open"} day ${frontier}'s lesson</button>
    </div></div>`;
}

function lessonFootHTML(day) {
  const a = store.activities[day];
  if (a?.lessonRead) {
    return `
      <div class="read-done">${ICO.saved} Lesson read${day < 30 ? ` &middot; day ${day + 1} unlocked` : " &middot; that was the last one"}</div>
      <div class="lesson-foot-btns">
        <button class="btn" id="toPractice">Start the practice checklist</button>
        ${day < 30 ? `<button class="btn-ghost" id="toNextLesson">Day ${day + 1} lesson ${ICO.arrowR}</button>` : ""}
      </div>`;
  }
  return `
    <div class="read-hint" id="readHint">${ICO.lock} Read to the end to mark this lesson as read${day < 30 ? ` and unlock day ${day + 1}` : ""}.</div>
    <div class="lesson-foot-btns">
      <button class="btn" id="markRead" disabled>Mark as read${day < 30 ? ` — unlock day ${day + 1}` : ""}</button>
    </div>`;
}

function viewDay() {
  const day = store.openDay || nextDay();
  if (!dayAccessible(day)) return viewLockedDay(day);

  const lesson = CURRICULUM[day - 1];
  const a = store.activities[day] || { tasks: {}, reflection: {}, minutes: 0, confidence: null };
  const pct = dayPct(day);
  const doneCount = TASKS.filter((t) => a.tasks?.[t.key]).length;
  const plannedLeft = TASKS.filter((t) => !a.tasks?.[t.key]).reduce((n, t) => n + t.minutes, 0);
  const tab = store.dayTab || (a.lessonRead ? "practice" : "lesson");
  store.dayTab = tab;
  const nextLocked = day < 30 && !dayAccessible(day + 1);

  const checks = TASKS.map((t) => `
    <label class="check-row ${a.tasks?.[t.key] ? "on" : ""}">
      <input type="checkbox" data-task="${t.key}" ${a.tasks?.[t.key] ? "checked" : ""}>
      <span class="box">${ICO.check}</span>
      <span class="lbl">${esc(t.label)}</span>
      <span class="mins num">${t.minutes} min</span>
    </label>`).join("");

  const questions = REFLECTION_QUESTIONS.map((q) => `
    <div class="rq">
      <label for="rq-${q.key}">${esc(q.label)}</label>
      <textarea id="rq-${q.key}" data-reflect="${q.key}" placeholder="Write a sentence or two…">${esc(a.reflection?.[q.key] || "")}</textarea>
    </div>`).join("");

  const conf = [1, 2, 3, 4, 5].map((n) => `<button data-conf="${n}" class="${a.confidence === n ? "on" : ""}">${n}</button>`).join("");
  const C = 2 * Math.PI * 30;

  const mainCol = tab === "lesson"
    ? `<div class="col-stack">
        <div class="card lesson-card">
          <div class="lesson-progress" aria-hidden="true"><i id="readBar" style="width:${a.lessonRead ? 100 : a.readPct || 0}%"></i></div>
          <div class="card-body lesson-body">
            <div class="lesson-prose" id="lessonProse"><div class="lesson-loading">Loading lesson…</div></div>
            <div id="lessonEnd" aria-hidden="true"></div>
            <div class="lesson-foot" id="lessonFoot"></div>
          </div>
        </div>
      </div>`
    : `<div class="col-stack">
        <div class="card">
          <div class="card-head">
            <h2>Session checklist</h2>
            <span class="aside num" id="checkAside">${doneCount}/${TASKS.length} &middot; ${plannedLeft} min left</span>
          </div>
          <div class="card-body">${checks}</div>
        </div>

        <div class="card">
          <div class="card-head">
            <h2>Reflection checkpoint</h2>
            <span class="autosave" id="autosaveState">Autosaves as you type</span>
          </div>
          <div class="card-body">${questions}</div>
        </div>
      </div>`;

  return `
    <div class="page-head">
      <div class="lede">
        <a class="back-link" id="backLink" href="#">${ICO.arrowL} All days</a>
        <div style="display:flex;align-items:center;gap:9px;flex-wrap:wrap;margin-bottom:7px">
          <span class="badge ${a.completed ? "g" : "a"}" id="dayBadge">Day ${day} &middot; ${a.completed ? "Complete" : `${Math.round(pct * 100)}% done`}</span>
          <span class="chip">Phase ${lesson.phase} &middot; ${esc(PHASES[lesson.phase].name)}</span>
          ${a.lessonRead ? '<span class="chip g">lesson read</span>' : ""}
        </div>
        <h1>${esc(lesson.title)}</h1>
        <p>${esc(lesson.goal)}</p>
      </div>
      <div class="actions day-nav">
        <button class="btn-ghost" id="prevDay" ${day === 1 ? "disabled" : ""}>${ICO.arrowL} Prev</button>
        <button class="btn-ghost" id="nextDayBtn" ${day === 30 || nextLocked ? "disabled" : ""} ${nextLocked ? 'title="Finish reading this lesson first"' : ""}>Next ${nextLocked ? ICO.lock : ICO.arrowR}</button>
      </div>
    </div>

    <div class="seg" role="tablist" aria-label="Day sections">
      <button class="seg-btn ${tab === "lesson" ? "on" : ""}" data-tab="lesson" role="tab" aria-selected="${tab === "lesson"}">
        ${ICO.book} Lesson ${a.lessonRead ? `<span class="seg-check">${ICO.saved}</span>` : ""}
      </button>
      <button class="seg-btn ${tab === "practice" ? "on" : ""}" data-tab="practice" role="tab" aria-selected="${tab === "practice"}">
        ${ICO.target} Practice &amp; reflection
      </button>
    </div>

    <div class="cols">
      ${mainCol}

      <div class="rail">
        <div class="card">
          <div class="card-head"><h2>Progress</h2></div>
          <div class="card-body" style="display:flex;align-items:center;gap:18px">
            <svg width="74" height="74" viewBox="0 0 74 74" style="flex-shrink:0">
              <circle cx="37" cy="37" r="30" fill="none" stroke="var(--layer-3)" stroke-width="7"/>
              <circle id="dayRing" cx="37" cy="37" r="30" fill="none" stroke="${a.completed ? "var(--green)" : "var(--blue)"}" stroke-width="7"
                      stroke-linecap="round" transform="rotate(-90 37 37)"
                      stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - pct)}"/>
              <text id="dayRingTxt" x="37" y="42" text-anchor="middle" font-size="17" font-weight="700" fill="var(--text)">${Math.round(pct * 100)}%</text>
            </svg>
            <div style="min-width:0;flex:1">
              <div class="kv"><span>Lesson</span><b id="kvLesson">${a.lessonRead ? "Read" : `${a.readPct || 0}% read`}</b></div>
              <div class="kv"><span>Checked</span><b class="num" id="kvChecked">${doneCount}/${TASKS.length}</b></div>
              <div class="kv"><span>Logged</span><b class="num" id="minsLogged">${a.minutes || 0} min</b></div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-head"><h2>Timer</h2><span class="aside">Target 90 min</span></div>
          <div class="card-body">
            <div class="timer">
              <div class="clock" id="timerClock">00:00</div>
              <div class="state" id="timerState">Not running</div>
            </div>
            <div class="timer-btns">
              <button class="btn" id="timerToggle">Start</button>
              <button class="btn-ghost" id="timerReset">Reset</button>
              <button class="btn-ghost span2" id="timerCommit">Add elapsed to day ${day}</button>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-head"><h2>Confidence</h2></div>
          <div class="card-body">
            <div class="conf">${conf}</div>
            <div class="conf-scale"><span>Lost</span><span>Could teach it</span></div>
          </div>
        </div>
      </div>
    </div>`;
}

function paintDayProgress(day) {
  const a = store.activities[day] || { tasks: {} };
  const pct = dayPct(day);
  const doneCount = TASKS.filter((t) => a.tasks?.[t.key]).length;
  const left = TASKS.filter((t) => !a.tasks?.[t.key]).reduce((n, t) => n + t.minutes, 0);
  const C = 2 * Math.PI * 30;

  const ring = $("#dayRing");
  if (ring) {
    ring.setAttribute("stroke-dashoffset", C * (1 - pct));
    ring.setAttribute("stroke", a.completed ? "var(--green)" : "var(--blue)");
  }
  const txt = $("#dayRingTxt");
  if (txt) txt.textContent = `${Math.round(pct * 100)}%`;

  const kv = $("#kvChecked");
  if (kv) kv.textContent = `${doneCount}/${TASKS.length}`;

  const aside = $("#checkAside");
  if (aside) aside.textContent = `${doneCount}/${TASKS.length} · ${left} min left`;

  const badge = $("#dayBadge");
  if (badge) {
    badge.textContent = `Day ${day} · ${a.completed ? "Complete" : `${Math.round(pct * 100)}% done`}`;
    badge.className = `badge ${a.completed ? "g" : "a"}`;
  }
}

/* The timer is bound to the day it was started on and survives both page
   refreshes and navigation — switching days must never discard logged time. */
const TIMER_KEY = "gct_timer";

function restoreTimer() {
  try {
    const raw = JSON.parse(localStorage.getItem(TIMER_KEY));
    if (raw && Number.isInteger(raw.day) && raw.day >= 1 && raw.day <= 30 &&
        Number.isInteger(raw.seconds) && raw.seconds > 0) {
      return { seconds: raw.seconds, handle: null, day: raw.day };
    }
  } catch { /* corrupt entry — start fresh */ }
  return { seconds: 0, handle: null, day: null };
}

let timer = restoreTimer();

function persistTimer() {
  if (timer.day && timer.seconds > 0) {
    localStorage.setItem(TIMER_KEY, JSON.stringify({ day: timer.day, seconds: timer.seconds }));
  } else {
    localStorage.removeItem(TIMER_KEY);
  }
}

function stopTimer() {
  clearInterval(timer.handle);
  timer.handle = null;
  persistTimer();
}

function paintTimer() {
  const el = $("#timerClock");
  if (!el) return;
  const m = String(Math.floor(timer.seconds / 60)).padStart(2, "0");
  const s = String(timer.seconds % 60).padStart(2, "0");
  el.textContent = `${m}:${s}`;
  const viewed = store.openDay;
  const elsewhere = timer.day && timer.day !== viewed ? ` — timing day ${timer.day}` : "";
  const state = $("#timerState");
  state.textContent = (timer.handle ? "Running" : timer.seconds ? "Paused" : "Not running") + elsewhere;
  state.classList.toggle("run", !!timer.handle);
  $("#timerToggle").textContent = timer.handle ? "Pause" : timer.seconds ? "Resume" : "Start";
  const commit = $("#timerCommit");
  if (commit) commit.textContent = `Add elapsed to day ${timer.day || viewed}`;
}

function wireDay() {
  const day = store.openDay || nextDay();

  $("#backLink").onclick = (e) => { e.preventDefault(); go("dashboard"); };

  if (!dayAccessible(day)) {
    $("#goFrontier").onclick = () => { store.dayTab = "lesson"; go("today", Math.min(frontierDay(), 30)); };
    return;
  }

  $("#prevDay").onclick = () => go("today", Math.max(1, day - 1));
  $("#nextDayBtn").onclick = () => { if (day < 30 && dayAccessible(day + 1)) go("today", day + 1); };

  $$(".seg-btn").forEach((b) => {
    b.onclick = () => {
      if (b.dataset.tab === store.dayTab) return;
      store.dayTab = b.dataset.tab;
      render();
    };
  });

  if (store.dayTab === "lesson") wireLesson(day);

  $$("[data-task]").forEach((box) => {
    box.onchange = async () => {
      box.closest(".check-row").classList.toggle("on", box.checked);
      const was = store.activities[day]?.completed;
      await save(day, { tasks: { [box.dataset.task]: box.checked } });
      // Patch the affected nodes rather than re-rendering — a full render would
      // discard whatever the user has typed into the reflection fields.
      paintDayProgress(day);
      if (!was && store.activities[day]?.completed) {
        const ringSvg = $("#dayRing")?.closest("svg");
        if (ringSvg) {
          ringSvg.classList.add("celebrate");
          setTimeout(() => ringSvg.classList.remove("celebrate"), 650);
        }
        toast(`Day ${day} complete. Nice work.`);
      }
    };
  });

  $$("[data-conf]").forEach((btn) => {
    btn.onclick = async () => {
      $$("[data-conf]").forEach((b) => b.classList.toggle("on", b === btn));
      await save(day, { confidence: Number(btn.dataset.conf) });
    };
  });

  // Debounced autosave: reflections persist 800ms after the user stops typing.
  let reflectTimer = null;
  $$("[data-reflect]").forEach((box) => {
    box.oninput = () => {
      const st = $("#autosaveState");
      if (st) { st.classList.remove("ok"); st.textContent = "Saving…"; }
      clearTimeout(reflectTimer);
      reflectTimer = setTimeout(async () => {
        const reflection = {};
        $$("[data-reflect]").forEach((t) => { reflection[t.dataset.reflect] = t.value; });
        await save(day, { reflection });
        const done = $("#autosaveState");
        if (done) { done.classList.add("ok"); done.innerHTML = `${ICO.saved} Saved`; }
      }, 800);
    };
  });

  paintTimer();

  $("#timerToggle").onclick = () => {
    if (timer.handle) {
      stopTimer();
    } else {
      if (timer.seconds === 0) timer.day = day; // fresh start binds to the viewed day
      timer.handle = setInterval(() => { timer.seconds++; persistTimer(); paintTimer(); }, 1000);
    }
    paintTimer();
  };

  $("#timerReset").onclick = () => {
    stopTimer();
    timer.seconds = 0;
    timer.day = null;
    persistTimer();
    paintTimer();
  };

  $("#timerCommit").onclick = async () => {
    const target = timer.day || day;
    const add = Math.round(timer.seconds / 60);
    if (!add) return toast("Timer has not reached a full minute yet", true);
    await save(target, { minutes: (store.activities[target]?.minutes || 0) + add });
    stopTimer();
    timer.seconds = 0;
    timer.day = null;
    persistTimer();
    paintTimer();
    if (target === day) $("#minsLogged").textContent = `${store.activities[target].minutes} min`;
    toast(`Added ${add} min to day ${target}`);
  };
}

async function save(day, patch) {
  try {
    store.activities[day] = await api("PUT", "/api/activities", { day, patch });
    paintChrome();
  } catch (err) {
    toast(err.message, true);
  }
}

/* ---------------------------- lesson reader ---------------------------- */

let lessonObserver = null;
let lessonReachedEnd = false;
let readPctTimer = null;

/* One window-level scroll listener for the whole app; it no-ops unless a
   lesson is on screen. Re-renders replace #main's children, so per-render
   listeners on window would otherwise pile up. */
window.addEventListener("scroll", onLessonScroll, { passive: true });

async function wireLesson(day) {
  lessonReachedEnd = Boolean(store.activities[day]?.lessonRead);
  wireFoot(day);

  const prose = $("#lessonProse");
  try {
    if (!store.lessons[day]) {
      const { markdown } = await api("GET", `/api/lesson?day=${day}`);
      store.lessons[day] = markdown;
    }
  } catch (err) {
    if (prose) prose.innerHTML = `<div class="lesson-loading">${esc(err.message)}</div>`;
    return;
  }

  // The user may have navigated away while the lesson was downloading.
  if (store.view !== "today" || store.openDay !== day || store.dayTab !== "lesson") return;

  // Drop the markdown's own H1 — the page header already carries the title.
  const md = store.lessons[day].replace(/^\s*# .*\n/, "");
  prose.innerHTML = renderMarkdown(md);

  lessonObserver?.disconnect();
  lessonObserver = new IntersectionObserver((entries) => {
    if (!entries.some((e) => e.isIntersecting) || lessonReachedEnd) return;
    lessonReachedEnd = true;
    const btn = $("#markRead");
    if (btn) btn.disabled = false;
    const hint = $("#readHint");
    if (hint) hint.innerHTML = `${ICO.saved} You reached the end — mark it read once it has sunk in.`;
  });
  lessonObserver.observe($("#lessonEnd"));
  onLessonScroll();
}

function onLessonScroll() {
  const prose = $("#lessonProse");
  const bar = $("#readBar");
  if (!prose || !bar || store.view !== "today") return;
  const day = store.openDay;
  const a = store.activities[day];

  const r = prose.getBoundingClientRect();
  if (r.height < 40) return; // still loading
  const pct = Math.round(Math.min(1, Math.max(0, (window.innerHeight - r.top) / r.height)) * 100);
  const shown = a?.lessonRead ? 100 : Math.max(pct, a?.readPct || 0);
  bar.style.width = `${shown}%`;

  const kv = $("#kvLesson");
  if (kv && !a?.lessonRead) kv.textContent = `${shown}% read`;

  // Persist the high-water mark, lightly debounced; losing one is harmless.
  if (!a?.lessonRead && pct > (a?.readPct || 0) + 4) {
    clearTimeout(readPctTimer);
    readPctTimer = setTimeout(async () => {
      try {
        store.activities[day] = await api("PUT", "/api/activities", { day, patch: { readPct: Math.min(100, pct) } });
      } catch { /* retried on the next scroll */ }
    }, 900);
  }
}

function wireFoot(day) {
  const foot = $("#lessonFoot");
  if (!foot) return;
  foot.innerHTML = lessonFootHTML(day);

  const mark = $("#markRead");
  if (mark) {
    mark.disabled = !lessonReachedEnd;
    mark.onclick = async () => {
      mark.disabled = true;
      try {
        store.activities[day] = await api("POST", "/api/lesson/read", { day });
        paintChrome();
        toast(day < 30 ? `Lesson read — day ${day + 1} unlocked` : "Final lesson read. The whole path is open.");
        wireFoot(day);
        const bar = $("#readBar");
        if (bar) bar.style.width = "100%";
        const kv = $("#kvLesson");
        if (kv) kv.textContent = "Read";
        const nb = $("#nextDayBtn");
        if (nb && day < 30) { nb.disabled = false; nb.innerHTML = `Next ${ICO.arrowR}`; nb.removeAttribute("title"); }
      } catch (err) {
        toast(err.message, true);
        mark.disabled = false;
      }
    };
  }

  const toPractice = $("#toPractice");
  if (toPractice) toPractice.onclick = () => { store.dayTab = "practice"; render(); };
  const toNext = $("#toNextLesson");
  if (toNext) toNext.onclick = () => { store.dayTab = "lesson"; go("today", day + 1); };
}

/* ---------------------------- journal ---------------------------- */

function viewJournal() {
  const s = stats();
  const entries = Object.values(store.activities).filter(hasReflection).sort((a, b) => b.day - a.day);

  const body = entries.length
    ? entries.map((a) => {
        const lesson = CURRICULUM[a.day - 1];
        const answers = REFLECTION_QUESTIONS
          .filter((q) => String(a.reflection?.[q.key] || "").trim())
          .map((q) => `<div class="rq"><label>${esc(q.label)}</label><p>${esc(a.reflection[q.key])}</p></div>`)
          .join("");
        return `<div class="card">
          <div class="card-head">
            <span class="phase-badge">${a.day}</span>
            <h2>${esc(lesson.title)}</h2>
            ${a.confidence ? `<span class="chip ${a.confidence >= 4 ? "g" : "b"}">confidence ${a.confidence}/5</span>` : ""}
          </div>
          <div class="card-body">${answers}</div>
        </div>`;
      }).join("")
    : `<div class="card"><div class="empty">
        <div class="ico">${ICO.book}</div>
        <strong>No reflections yet</strong>
        <p>Answer the reflection questions at the end of a session and they will collect here, newest first.</p>
      </div></div>`;

  const lowConf = Object.values(store.activities)
    .filter((a) => typeof a.confidence === "number" && a.confidence <= 2)
    .sort((a, b) => a.confidence - b.confidence);

  return `
    <div class="page-head"><div class="lede">
      <h1>Reflection Journal</h1>
      <p>${entries.length} ${entries.length === 1 ? "entry" : "entries"} &middot; your own words, newest first</p>
    </div></div>

    <div class="cols">
      <div class="col-stack">${body}</div>
      <div class="rail">
        <div class="card">
          <div class="card-head"><h2>Journal at a glance</h2></div>
          <div class="card-body">
            <div class="kv"><span>Entries written</span><b class="num">${entries.length}</b></div>
            <div class="kv"><span>Days complete</span><b class="num">${s.done}</b></div>
            <div class="kv"><span>Avg confidence</span><b class="num">${s.avgConf ? s.avgConf.toFixed(1) + "/5" : "—"}</b></div>
          </div>
        </div>
        <div class="card">
          <div class="card-head"><h2>Worth revisiting</h2><span class="aside">Confidence &le; 2</span></div>
          <div class="card-body ${lowConf.length ? "tight" : ""}">
            ${lowConf.length
              ? lowConf.map((a) => `<div class="achv-row got" style="cursor:default">
                  <div class="achv-ico" style="background:var(--red-soft);filter:none;opacity:1">${a.confidence}</div>
                  <div class="achv-txt"><strong>Day ${a.day}</strong><span>${esc(CURRICULUM[a.day - 1].title)}</span></div>
                </div>`).join("")
              : `<p style="color:var(--text-mute);font-size:13px">Nothing flagged. Any session you rate 1 or 2 shows up here so you know what to circle back to.</p>`}
          </div>
        </div>
        ${achievementCard(s)}
      </div>
    </div>`;
}

/* ---------------------------- stats ---------------------------- */

function viewStats() {
  const s = stats();

  const heat = Array.from({ length: 30 }, (_, i) => {
    const d = i + 1;
    const pct = Math.round(dayPct(d) * 100);
    const locked = !dayAccessible(d);
    const lvl = [store.activities[d]?.completed ? "l3" : pct >= 50 ? "l2" : pct > 0 ? "l1" : "", locked ? "lk" : ""].filter(Boolean).join(" ");
    const status = locked ? "locked" : store.activities[d]?.completed ? "complete" : pct > 0 ? `${pct}% done` : "not started";
    return `<button class="${lvl}" data-day="${d}"
      data-tip-v="${status}" data-tip-l="Day ${d} — ${esc(CURRICULUM[i].title)}"
      aria-label="Open day ${d}, ${esc(CURRICULUM[i].title)}, ${status}">${d}</button>`;
  }).join("");

  const logged = Object.values(store.activities).filter((a) => a.minutes || a.completed).sort((a, b) => a.day - b.day);
  const peak = Math.max(120, ...logged.map((a) => a.minutes || 0));

  // Single-series columns: one hue, rounded data-end, square baseline. The
  // dashed 90-minute line carries the target; exact values live in the
  // tooltip and the session-log table below.
  const bars = logged.map((a) => {
    const m = a.minutes || 0;
    return `<div class="col" tabindex="0" data-day="${a.day}"
      data-tip-v="${m} min" data-tip-l="Day ${a.day} — ${esc(CURRICULUM[a.day - 1].title)}"
      aria-label="Day ${a.day}: ${m} minutes"><i style="height:${(m / peak) * 100}%"></i></div>`;
  }).join("");
  const barLabels = logged.map((a) => `<span>${a.day}</span>`).join("");
  const goalTop = 18 + (1 - 90 / peak) * 158;

  const rows = logged.length
    ? logged.map((a) => {
        const l = CURRICULUM[a.day - 1];
        const pct = dayPct(a.day);
        return `<tr>
          <td class="num">${a.day}</td>
          <td class="link">${esc(l.title)}</td>
          <td class="num">${l.phase}</td>
          <td class="num">${a.minutes || 0} min</td>
          <td class="num">${a.confidence ? a.confidence + "/5" : "—"}</td>
          <td>${a.completed ? '<span class="chip g">done</span>' : `<span class="chip b">${Math.round(pct * 100)}%</span>`}</td>
        </tr>`;
      }).join("")
    : `<tr><td colspan="6"><div class="empty">
        <div class="ico">${ICO.chart}</div><strong>Nothing logged yet</strong>
        <p>Complete checklist items or log time on a session and it will appear here.</p>
      </div></td></tr>`;

  return `
    <div class="page-head"><div class="lede">
      <h1>Statistics</h1>
      <p>Your 30-day challenge, measured</p>
    </div><div class="actions">
      <button class="btn-ghost" id="statsExport">Export JSON</button>
    </div></div>

    <div class="tiles">
      ${tile("Completion", ICO.target, s.pct, "%", `${s.done} of 30 days`, "var(--chart-green)")}
      ${tile("Total time", ICO.clock, (s.minutes / 60).toFixed(1), "h", "Target is 45 h", "var(--chart-blue)")}
      ${tile("Avg per session", ICO.gauge, s.avgMin, " min", "Goal is 90 min", "var(--chart-orange)")}
      ${tile("Best streak", ICO.flame, s.best, s.best === 1 ? " day" : " days", `Current: ${s.streak}`, "var(--chart-purple)")}
    </div>

    <div class="cols">
      <div class="col-stack">
        <div class="card">
          <div class="card-head"><h2>Progress map</h2><span class="aside">Click a day to open it</span></div>
          <div class="card-body">
            <div class="heat" id="heatMap">${heat}</div>
            <div class="legend">
              <span>Not started</span>
              <i style="background:var(--layer-3)"></i>
              <i style="background:var(--heat-1)"></i>
              <i style="background:var(--heat-2)"></i>
              <i style="background:var(--heat-3)"></i>
              <span>Complete</span>
            </div>
          </div>
        </div>

        ${logged.length ? `<div class="card">
          <div class="card-head"><h2>Minutes per session</h2><span class="aside">Dashed line marks the 90-minute target</span></div>
          <div class="card-body">
            <div class="bars-scroll">
              <div class="bars-wrap" id="barChart">
                <div class="goal-line" style="top:${goalTop.toFixed(1)}px"><span>90 min target</span></div>
                <div class="bars">${bars}</div>
                <div class="bars-x">${barLabels}</div>
              </div>
            </div>
          </div>
        </div>` : ""}

        <div class="card">
          <div class="card-head"><h2>Session log</h2><span class="aside num">${logged.length} ${logged.length === 1 ? "entry" : "entries"}</span></div>
          <div class="card-body flush"><div class="tbl-wrap"><table class="tbl">
            <thead><tr><th>Day</th><th>Topic</th><th>Phase</th><th>Time</th><th>Confidence</th><th>Status</th></tr></thead>
            <tbody>${rows}</tbody>
          </table></div></div>
        </div>
      </div>

      <div class="rail">
        <div class="card">
          <div class="card-head"><h2>By phase</h2></div>
          <div class="card-body">
            ${[1, 2, 3].map((p) => {
              const n = s.byPhase[p];
              const mins = Object.values(store.activities)
                .filter((a) => CURRICULUM[a.day - 1].phase === p)
                .reduce((t, a) => t + (a.minutes || 0), 0);
              return `<div style="margin-bottom:16px">
                <div class="phase-mini-row"><div class="top">
                  <b>${esc(PHASES[p].name)}</b><span class="num">${n}/10 &middot; ${(mins / 60).toFixed(1)}h</span>
                </div><div class="track"><i style="width:${n * 10}%;background:${n === 10 ? "var(--green)" : "var(--blue)"}"></i></div></div>
              </div>`;
            }).join("")}
          </div>
        </div>
        ${achievementCard(s)}
      </div>
    </div>`;
}

function wireStats() {
  $("#statsExport").onclick = () => $("#exportBtn").click();
  bindTips($("#heatMap"));
  bindTips($("#barChart"));
  const openDay = (e) => {
    const t = e.target.closest("[data-day]");
    if (t) { tipHide(); go("today", Number(t.dataset.day)); }
  };
  $("#heatMap")?.addEventListener("click", openDay);
  $("#barChart")?.addEventListener("click", openDay);
  $("#barChart")?.addEventListener("keydown", (e) => { if (e.key === "Enter") openDay(e); });
}

/* ---------------------------- boot ---------------------------- */

async function boot() {
  const theme = localStorage.getItem("gct_theme");
  if (theme) document.documentElement.dataset.theme = theme;

  const showAuth = () => {
    $("#auth").classList.remove("hidden");
    $("#app").classList.add("hidden");
    paintAuthMode();
  };

  if (!store.token) return showAuth();

  try {
    store.user = await api("GET", "/api/me");
    store.activities = await api("GET", "/api/activities");
  } catch {
    localStorage.removeItem("gct_token");
    store.token = null;
    return showAuth();
  }

  $("#auth").classList.add("hidden");
  $("#app").classList.remove("hidden");
  store.openDay = nextDay();
  render();
}

document.addEventListener("keydown", (e) => {
  if (!store.user || e.target.matches("input, textarea")) return;
  if (e.key === "g") go("dashboard");
  if (e.key === "s") go("today");
  if (e.key === "j") go("journal");
  if (e.key === "?") toast("g dashboard · s session · j journal");
});

boot();
