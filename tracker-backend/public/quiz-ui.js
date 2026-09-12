(() => {
  "use strict";

  const STYLE_ID = "mcq-ui-style";

  const esc = (v) =>
    String(v ?? "").replace(
      /[&<>"']/g,
      (c) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[c])
    );

  /* ---------------------------------------------------------
     Helpers
  --------------------------------------------------------- */

  const userKey = () =>
    (typeof store !== "undefined" && store.user?.id) ||
    localStorage.getItem("gct_user_id") ||
    "guest";

  function day() {
    return typeof store !== "undefined" && store.view === "today"
      ? Number(store.openDay || 0)
      : 0;
  }

  function activity(d) {
    return typeof store !== "undefined"
      ? (store.activities?.[d] || {})
      : {};
  }

  function progress(d) {
    const a = activity(d);

    return Math.round(
      [
        "concept",
        "walkthrough",
        "exerciseA",
        "exerciseB",
        "exerciseC",
        "challenge",
        "reflection"
      ].filter((key) => a.tasks?.[key]).length / 7 * 100
    );
  }

  function quizKey(d) {
    return `gct_quiz_${userKey()}_${d}`;
  }

  function savedQuiz(d) {
    try {
      return JSON.parse(
        localStorage.getItem(quizKey(d)) || "null"
      );
    } catch {
      return null;
    }
  }

  /*
    A day can be opened when:

    1. It is Day 1, OR
    2. The previous day's:
       - lesson has been read
       - MCQ score >= 70%
       - practice progress > 70%
  */
  function gate(d) {
    const q = savedQuiz(d);

    return Boolean(
      activity(d).lessonRead &&
      q &&
      q.score >= 70 &&
      progress(d) > 70
    );
  }

  function canOpen(target) {
    return target <= 1 || gate(target - 1);
  }

  /* ---------------------------------------------------------
     Styles
  --------------------------------------------------------- */

  function styles() {
    if (document.getElementById(STYLE_ID)) return;

    const s = document.createElement("style");

    s.id = STYLE_ID;

    s.textContent = `
      .mcq-card .mcq-q {
        padding: 18px 0;
        border-bottom: 1px solid var(--border);
      }

      .mcq-card .mcq-q:first-child {
        padding-top: 0;
      }

      .mcq-card .mcq-q:last-child {
        border-bottom: 0;
      }

      .mcq-question {
        font-weight: 650;
        line-height: 1.55;
        margin-bottom: 12px;
      }

      .mcq-options {
        display: grid;
        gap: 8px;
      }

      .mcq-option {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        width: 100%;
        text-align: left;
        padding: 11px 13px;
        border: 1px solid var(--border);
        border-radius: 10px;
        background: var(--layer-2);
        color: var(--text);
        cursor: pointer;
      }

      .mcq-option:hover {
        border-color: var(--text-mute);
      }

      .mcq-option.selected {
        border-color: var(--blue);
        background: var(--blue-soft);
      }

      .mcq-option input {
        margin-top: 3px;
        accent-color: var(--blue);
      }

      .mcq-index {
        color: var(--text-mute);
        font-size: 12px;
        margin-bottom: 5px;
      }

      .mcq-result {
        margin-top: 14px;
        padding: 12px 14px;
        border-radius: 10px;
        background: var(--layer-2);
        font-size: 13px;
        line-height: 1.5;
      }

      .mcq-result.pass {
        background: var(--green-soft);
      }

      .mcq-result.fail {
        background: var(--red-soft);
      }

      .mcq-explanation {
        margin-top: 8px;
        color: var(--text-dim);
        font-size: 12px;
      }

      .mcq-actions {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
        margin-top: 16px;
      }

      .mcq-gate {
        color: var(--text-mute);
        font-size: 12px;
      }

      .lesson-return {
        margin-top: 18px;
        padding-top: 16px;
        border-top: 1px solid var(--border);
        display: flex;
      }

      .lesson-return .btn-ghost {
        display: inline-flex;
        align-items: center;
        gap: 7px;
      }

      .gate-locked {
        opacity: .65;
        cursor: not-allowed !important;
      }
    `;

    document.head.appendChild(s);
  }

  /* ---------------------------------------------------------
     Gate UI
  --------------------------------------------------------- */

  function enforceGate(d) {
    if (!d || d >= 30) return;

    const ok = gate(d);

    /* ---------------- Next Day button ---------------- */

    const next = document.getElementById("nextDayBtn");

    if (next) {
      const shouldDisable = !ok;

      if (next.disabled !== shouldDisable) {
        next.disabled = shouldDisable;
      }

      const locked = !ok;

      if (
        next.classList.contains("gate-locked") !== locked
      ) {
        next.classList.toggle("gate-locked", locked);
      }

      const title = ok
        ? "Next lesson unlocked"
        : "Pass the MCQ with at least 70% and reach more than 70% practice progress";

      if (next.title !== title) {
        next.title = title;
      }

      const content = ok
        ? `Next ${
            typeof ICO !== "undefined"
              ? ICO.arrowR
              : "→"
          }`
        : `Next ${
            typeof ICO !== "undefined"
              ? ICO.lock
              : "🔒"
          }`;

      /*
        IMPORTANT:
        Only modify innerHTML when the content is actually
        different. This prevents unnecessary DOM mutations.
      */
      if (next.innerHTML !== content) {
        next.innerHTML = content;
      }
    }

    /* ---------------- Next Lesson button ---------------- */

    const toNext = document.getElementById("toNextLesson");

    if (toNext) {
      const shouldDisable = !ok;

      if (toNext.disabled !== shouldDisable) {
        toNext.disabled = shouldDisable;
      }

      const locked = !ok;

      if (
        toNext.classList.contains("gate-locked") !== locked
      ) {
        toNext.classList.toggle("gate-locked", locked);
      }

      const title = ok
        ? "Next lesson unlocked"
        : "Complete the 70% MCQ and >70% progress requirements";

      if (toNext.title !== title) {
        toNext.title = title;
      }

      if (
        !ok &&
        toNext.textContent !== "Next lesson locked"
      ) {
        toNext.textContent = "Next lesson locked";
      }
    }
  }

  /* ---------------------------------------------------------
     Back to Lesson button
  --------------------------------------------------------- */

  function addBackButton(stack) {
    if (!stack) return;

    if (
      stack.querySelector("[data-back-lesson]")
    ) {
      return;
    }

    const wrap = document.createElement("div");

    wrap.className = "lesson-return";

    wrap.innerHTML = `
      <button
        type="button"
        class="btn-ghost"
        data-back-lesson
      >
        ← Back to Lesson
      </button>
    `;

    stack.appendChild(wrap);

    const button = wrap.firstElementChild;

    if (button) {
      button.onclick = () => {
        if (typeof store === "undefined") return;

        store.dayTab = "lesson";

        if (typeof render === "function") {
          render();
        }
      };
    }
  }

  /* ---------------------------------------------------------
     MCQ
  --------------------------------------------------------- */

  async function mountQuiz(d, stack) {
    if (!stack) return;

    /*
      IMPORTANT:
      Do NOT use a global "mounted" boolean.

      app.js replaces #main when render() runs, so the old DOM
      can disappear while this JavaScript file remains loaded.

      The DOM itself is therefore the source of truth.
    */
    if (stack.querySelector(".mcq-card")) {
      return;
    }

    const card = document.createElement("div");

    card.className = "card mcq-card";

    card.innerHTML = `
      <div class="card-head">
        <h2>Real-world knowledge check</h2>
        <span class="aside">70% to pass</span>
      </div>

      <div class="card-body">
        Loading questions…
      </div>
    `;

    /*
      Append BEFORE the first await.

      This is important because if another observer callback
      happens while fetch() is pending, it will already see
      .mcq-card and will not create a duplicate.
    */
    stack.appendChild(card);

    try {
      const response = await fetch(
        "mcq-bank.json",
        {
          cache: "no-store"
        }
      );

      if (!response.ok) {
        throw new Error(
          "Could not load the MCQ bank."
        );
      }

      const bank = await response.json();

      const qs = (
        bank.questions?.[String(d)] || []
      ).slice(0, 4);

      const body = card.querySelector(
        ".card-body"
      );

      if (!body) return;

      const previous = savedQuiz(d);

      /* No questions available */

      if (!qs.length) {
        body.innerHTML = `
          <div class="alert" role="alert">
            No MCQ questions are available for this day.
          </div>
        `;

        return;
      }

      /* Render questions */

      body.innerHTML = `
        <p
          style="
            color:var(--text-dim);
            font-size:13px;
            margin-bottom:14px
          "
        >
          Choose the best answer for each Git/GitHub
          situation. You need at least 70% correct and
          more than 70% practice progress to unlock
          the next lesson.
        </p>

        <form class="mcq-form">

          ${qs.map((q, i) => `
            <div class="mcq-q">

              <div class="mcq-index">
                Question ${i + 1} of ${qs.length}
              </div>

              <div class="mcq-question">
                ${esc(q.question)}
              </div>

              <div class="mcq-options">

                ${q.options.map((o, j) => `
                  <label class="mcq-option">

                    <input
                      type="radio"
                      name="q${i}"
                      value="${j}"
                    >

                    <span>
                      ${esc(o)}
                    </span>

                  </label>
                `).join("")}

              </div>

            </div>
          `).join("")}

          <div class="mcq-actions">

            <button
              class="btn"
              type="submit"
            >
              ${
                previous
                  ? "Retake MCQ"
                  : "Submit answers"
              }
            </button>

            <span class="mcq-gate">
              Progress: ${progress(d)}%
              ${
                previous
                  ? ` · Previous score: ${previous.score}%`
                  : ""
              }
            </span>

          </div>

          <div class="mcq-result-wrap"></div>

        </form>
      `;

      /* -----------------------------------------------------
         Radio button styling
      ----------------------------------------------------- */

      body
        .querySelectorAll("input")
        .forEach((input) => {
          input.onchange = () => {
            body
              .querySelectorAll(
                `input[name="${input.name}"]`
              )
              .forEach((i) => {
                i
                  .closest(".mcq-option")
                  ?.classList.toggle(
                    "selected",
                    i.checked
                  );
              });
          };
        });

      /* -----------------------------------------------------
         Submit
      ----------------------------------------------------- */

      const form = body.querySelector(
        ".mcq-form"
      );

      if (!form) return;

      form.onsubmit = (e) => {
        e.preventDefault();

        /* Collect answers */

        const answers = qs.map((_, i) => {
          const selected = body.querySelector(
            `input[name="q${i}"]:checked`
          );

          return selected
            ? Number(selected.value)
            : null;
        });

        /* Require all answers */

        if (answers.some((x) => x === null)) {
          const resultWrap =
            body.querySelector(
              ".mcq-result-wrap"
            );

          if (resultWrap) {
            resultWrap.innerHTML = `
              <div class="mcq-result fail">
                Answer all questions before submitting.
              </div>
            `;
          }

          return;
        }

        /* Calculate score */

        const correct = qs.reduce(
          (total, q, i) =>
            total +
            (
              answers[i] === q.answer
                ? 1
                : 0
            ),
          0
        );

        const score = Math.round(
          correct / qs.length * 100
        );

        const passed = score >= 70;

        const result = {
          score,
          correct,
          total: qs.length,
          passed,
          submittedAt:
            new Date().toISOString()
        };

        /* Save result */

        localStorage.setItem(
          quizKey(d),
          JSON.stringify(result)
        );

        /* Check both requirements */

        const unlocked =
          passed &&
          progress(d) > 70;

        /* Render result */

        const resultWrap =
          body.querySelector(
            ".mcq-result-wrap"
          );

        if (resultWrap) {
          resultWrap.innerHTML = `
            <div
              class="mcq-result ${
                unlocked
                  ? "pass"
                  : "fail"
              }"
              role="status"
            >

              <b>
                ${score}% —
                ${correct}/${qs.length}
                correct
              </b>

              <div>
                ${
                  unlocked
                    ? `
                      Both requirements are
                      satisfied. The next lesson
                      is unlocked.
                    `
                    : `
                      Next lesson stays locked.
                      Quiz: ${score}%,
                      progress: ${progress(d)}%.
                      Required: quiz ≥70% and
                      progress >70%.
                    `
                }
              </div>

              ${qs.map((q, i) =>
                answers[i] !== q.answer
                  ? `
                    <div
                      class="mcq-explanation"
                    >
                      <b>Q${i + 1}:</b>
                      ${esc(q.explanation)}
                    </div>
                  `
                  : ""
              ).join("")}

            </div>
          `;
        }

        /*
          Update the current page immediately.
        */

        enforceGate(d);

        if (
          typeof paintChrome === "function"
        ) {
          paintChrome();
        }

        /*
          Allow the user to see the result for
          900ms before app.js performs its normal
          render.
        */

        if (
          typeof render === "function"
        ) {
          setTimeout(() => {
            render();
          }, 900);
        }
      };

    } catch (err) {
      const body =
        card.querySelector(".card-body");

      if (body) {
        body.innerHTML = `
          <div
            class="alert"
            role="alert"
          >
            ${esc(err.message)}
          </div>
        `;
      }
    }
  }

  /* ---------------------------------------------------------
     Find practice stack
  --------------------------------------------------------- */

  function findPracticeStack(main) {
    if (!main) return null;

    return (
      main
        .querySelector(
          ".seg-btn[data-tab='practice']"
        )
        ?.closest(".seg")
        ?.nextElementSibling
        ?.querySelector(".col-stack") ||
      null
    );
  }

  /* ---------------------------------------------------------
     Initialize Practice UI
  --------------------------------------------------------- */

  function initializePractice(main, d) {
    if (
      !main ||
      !d ||
      typeof store === "undefined"
    ) {
      return;
    }

    if (store.view !== "today") {
      return;
    }

    if (store.dayTab !== "practice") {
      return;
    }

    const stack = findPracticeStack(main);

    if (!stack) {
      return;
    }

    /*
      Add the lesson return button only once.
    */

    addBackButton(stack);

    /*
      Mount MCQ only when it doesn't already exist.
    */

    if (!stack.querySelector(".mcq-card")) {
      mountQuiz(d, stack);
    }
  }

  /* ---------------------------------------------------------
     Boot
  --------------------------------------------------------- */

  function boot() {
    styles();

    const main =
      document.getElementById("main");

    if (!main) return;

    /* -------------------------------------------------------
       Dashboard day-click protection

       This prevents opening a locked day directly.
    ------------------------------------------------------- */

    document.addEventListener(
      "click",
      (e) => {
        const cell =
          e.target.closest?.(
            ".day-cell[data-day]"
          );

        if (!cell) return;

        const target =
          Number(cell.dataset.day);

        if (!canOpen(target)) {
          e.preventDefault();
          e.stopImmediatePropagation();

          if (
            typeof toast === "function"
          ) {
            toast(
              `Day ${target} is locked — ` +
              `pass Day ${target - 1}'s MCQ ` +
              `with at least 70% and reach ` +
              `more than 70% progress.`,
              true
            );
          }
        }
      },
      true
    );

    /* -------------------------------------------------------
       MutationObserver

       IMPORTANT FIX:

       The old implementation watched #main and then
       modified #main inside the observer without disconnecting.

       That could produce:

       observer
          ↓
       enforceGate()
          ↓
       DOM mutation
          ↓
       observer
          ↓
       enforceGate()
          ↓
       DOM mutation
          ↓
       ...

       This implementation disconnects the observer before
       performing controlled DOM changes.
    ------------------------------------------------------- */

    let observerBusy = false;

    const observer =
      new MutationObserver(() => {
        if (observerBusy) {
          return;
        }

        if (
          typeof store === "undefined"
        ) {
          return;
        }

        if (
          store.view !== "today"
        ) {
          return;
        }

        const d = day();

        if (!d) {
          return;
        }

        observerBusy = true;

        /*
          Stop observing before changing DOM.
        */

        observer.disconnect();

        try {
          /* Update next-day gate */

          enforceGate(d);

          /* Only MCQ on Practice tab */

          initializePractice(
            main,
            d
          );

        } finally {
          /*
            Start observing again after our own
            mutations are complete.
          */

          observer.observe(main, {
            childList: true,
            subtree: true
          });

          observerBusy = false;
        }
      });

    /* -------------------------------------------------------
       Start observing #main
    ------------------------------------------------------- */

    observer.observe(main, {
      childList: true,
      subtree: true
    });

    /* -------------------------------------------------------
       Initial initialization

       This is necessary in case app.js rendered the page
       before quiz-ui.js finished loading.
    ------------------------------------------------------- */

    if (
      typeof store !== "undefined" &&
      store.view === "today"
    ) {
      const d = day();

      if (d) {
        enforceGate(d);

        initializePractice(
          main,
          d
        );
      }
    }
  }

  /* ---------------------------------------------------------
     Start
  --------------------------------------------------------- */

  if (
    document.readyState === "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      boot,
      { once: true }
    );
  } else {
    boot();
  }

})();
