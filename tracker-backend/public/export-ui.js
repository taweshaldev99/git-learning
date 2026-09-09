/* Small compatibility/UI bridge for the dependency-free export module. */
(() => {
  "use strict";
  if (!window.toast) {
    window.toast = (msg, isError) => {
      const el = document.querySelector("#toast");
      if (!el) return;
      el.textContent = String(msg ?? "");
      el.classList.toggle("err", !!isError);
      el.classList.add("show");
      clearTimeout(window.toast._timer);
      window.toast._timer = setTimeout(() => el.classList.remove("show"), 2400);
    };
  }
  const style = document.createElement("style");
  style.textContent = `.export-format-menu{position:fixed;z-index:1000;box-sizing:border-box;padding:6px;border:1px solid var(--border-strong);border-radius:12px;background:var(--layer-2);box-shadow:0 14px 36px rgba(0,0,0,.28)}.export-format-menu[hidden]{display:none}.export-format-menu button{width:100%;display:grid;gap:2px;padding:9px 10px;border:0;border-radius:8px;background:transparent;color:var(--text);text-align:left;cursor:pointer;font:inherit}.export-format-menu button:hover,.export-format-menu button:focus-visible{background:var(--layer-3);outline:none}.export-format-menu strong{font-size:13px;font-weight:700}.export-format-menu span{font-size:11px;color:var(--text-mute);line-height:1.35}#exportBtn:disabled{opacity:.65;cursor:wait}`;
  document.head.appendChild(style);
  const quiz = document.createElement("script");
  quiz.src = "quiz-ui.js";
  quiz.async = false;
  document.body.appendChild(quiz);
})();
