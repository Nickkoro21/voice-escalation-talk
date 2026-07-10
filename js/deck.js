/* Voice Escalation deck — reveal init + navigation/hide-slides + live transcript.
   English-only. Offline. No KaTeX. Adapted from the thesis-deck nav pattern. */
(function () {
  var deck = new Reveal({
    width: 1280, height: 720,
    margin: 0.05, minScale: 0.2, maxScale: 1.6,
    viewDistance: 3, mobileViewDistance: 1,
    hash: true, slideNumber: 'c/t',
    transition: 'slide', transitionSpeed: 'default', backgroundTransition: 'fade',
    controls: false, progress: true, center: false,
    plugins: [ RevealNotes ]
  });

  /* ---- Table of contents (order MUST match <section> order in index.html) ----
     hide:true => excluded from the linear run-through by default. The Asurion
     block and the Backup block are hidden by default; a preset re-includes them. */
  var TOC = [
    { s:'',            t:'Title' },
    { s:'Intro',       t:'Who I am' },
    { s:'Intro',       t:'Where I am' },
    { s:'Intro',       t:'The winning call (play the video)' },
    { s:'Intro',       t:'The loop: blocked, call, decide, resume' },
    { s:'Context',     t:'The voice agent universe' },
    { s:'Context',     t:'Comparing architectures' },
    { s:'The build',   t:'What I built: the SKILL (3 pillars)' },
    { s:'The build',   t:'The SKILL in detail' },
    { s:'The build',   t:'Skill best practices' },
    { s:'The build',   t:'The agent prompt (I): structure' },
    { s:'The build',   t:'The agent prompt (II): the hard rules' },
    { s:'The build',   t:'The scenario & the planted bugs' },
    { s:'The build',   t:'The agent: setup & options' },
    { s:'The call',    t:'The winning call (live transcript)' },
    { s:'The call',    t:'Handling real people: common mistakes' },
    { s:'The call',    t:'Deep search: call-center comms' },
    { s:'The build',   t:'Call evals (eval-driven loop)' },
    { s:'How it was built', t:'SDD (I): what & why' },
    { s:'How it was built', t:'SDD (II): the workflow' },
    { s:'How it was built', t:'SDD (III): applied to this build' },
    { s:'How it was built', t:'The experience during the build' },
    { s:'Results',     t:'Results overview & leaderboard' },
    { s:'Results',     t:'Part 1 feedback (full text)' },
    { s:'Results',     t:'Part 2 feedback (full text)' },
    { s:'Results',     t:'Takeaways' },
    { s:'What next',   t:'Where I would use voice agents next' },
    { s:'Asurion',     t:'Escalation is your fraud pipeline', hide:true },
    { s:'Asurion',     t:'The three pillars, mapped to fraud DS', hide:true },
    { s:'Asurion',     t:'Where a voice layer fits', hide:true },
    { s:'Asurion',     t:'Your questions (placeholder)', hide:true },
    { s:'Asurion',     t:'Discussion / Q&A', hide:true },
    { s:'Backup',      t:'Full caller prompt (prompt_v6)', hide:true },
    { s:'Backup',      t:'Full agent config (Vocal Bridge)', hide:true },
    { s:'Backup',      t:'The bug code (checkout API)', hide:true }
  ];

  var excluded = new Set();
  TOC.forEach(function (it, h) { if (it.hide) excluded.add(h); });
  var prevH = 0, explicitJump = -1;

  function firstIncluded(from, dir, total) {
    for (var i = from; i >= 0 && i < total; i += dir) { if (!excluded.has(i)) return i; }
    return -1;
  }
  function shownCount() { return TOC.length - excluded.size; }

  /* ---- presets: two audiences from one deck ---- */
  function applyPreset(kind) {
    excluded.clear();
    TOC.forEach(function (it, h) {
      if (kind === 'core' && (it.s === 'Asurion' || it.s === 'Backup')) excluded.add(h);
      if (kind === 'asurion' && it.s === 'Backup') excluded.add(h);
      // kind === 'all' => nothing excluded
    });
    syncNavUI();
  }

  var navEls = null;
  function syncNavUI() {
    if (!navEls) return;
    navEls.rows.forEach(function (row) {
      var h = +row.getAttribute('data-h');
      var chk = row.querySelector('.nav-chk');
      chk.checked = !excluded.has(h);
      row.classList.toggle('excluded', excluded.has(h));
    });
    navEls.count.textContent = '· ' + shownCount() + ' of ' + TOC.length + ' shown';
  }

  function setupNav() {
    var btn = document.createElement('button');
    btn.id = 'navToggle'; btn.type = 'button';
    btn.title = 'Go to slide (m)'; btn.setAttribute('aria-label', 'Go to slide');
    btn.innerHTML = '&#9776;';
    document.body.appendChild(btn);

    var ov = document.createElement('div'); ov.id = 'navOverlay'; ov.hidden = true;
    ov.innerHTML =
      '<div class="nav-panel" role="dialog" aria-label="Go to slide">' +
        '<div class="nav-head">' +
          '<div class="nav-title">Go to slide <span id="navCount"></span></div>' +
          '<div class="nav-actions">' +
            '<button id="navCore" class="nav-preset" type="button" title="VB / DeepLearning.AI run">Core</button>' +
            '<button id="navAsurion" class="nav-preset" type="button" title="Asurion run (adds the fraud/HITL block)">Asurion</button>' +
            '<button id="navAll" type="button">All</button>' +
            '<button id="navNone" type="button">None</button>' +
            '<button id="navClose" type="button" aria-label="Close">&#10005;</button>' +
          '</div>' +
        '</div>' +
        '<div class="nav-hint">Click a title to jump &nbsp;·&nbsp; untick to drop a slide &nbsp;·&nbsp; use Core / Asurion presets to switch audience</div>' +
        '<div class="nav-list" id="navList"></div>' +
      '</div>';
    document.body.appendChild(ov);

    var list = ov.querySelector('#navList');
    var countEl = ov.querySelector('#navCount');
    var rows = [];
    var lastSect = null;
    TOC.forEach(function (item, h) {
      if (item.s && item.s !== lastSect) {
        var sh = document.createElement('div'); sh.className = 'nav-sect';
        sh.textContent = item.s; list.appendChild(sh); lastSect = item.s;
      }
      var row = document.createElement('div'); row.className = 'nav-row'; row.setAttribute('data-h', h);
      if (excluded.has(h)) row.classList.add('excluded');
      var chk = document.createElement('input'); chk.type = 'checkbox'; chk.className = 'nav-chk';
      chk.checked = !excluded.has(h); chk.setAttribute('aria-label', 'Include in run-through');
      var jmp = document.createElement('button'); jmp.type = 'button'; jmp.className = 'nav-jump';
      jmp.textContent = item.t;
      row.appendChild(chk); row.appendChild(jmp); list.appendChild(row); rows.push(row);
      jmp.addEventListener('click', function () { explicitJump = h; deck.slide(h, 0, 0); closeNav(); });
      chk.addEventListener('change', function () {
        if (chk.checked) excluded.delete(h); else excluded.add(h);
        row.classList.toggle('excluded', !chk.checked);
        countEl.textContent = '· ' + shownCount() + ' of ' + TOC.length + ' shown';
      });
    });
    navEls = { rows: rows, count: countEl };
    countEl.textContent = '· ' + shownCount() + ' of ' + TOC.length + ' shown';

    ov.querySelector('#navCore').addEventListener('click', function () { applyPreset('core'); });
    ov.querySelector('#navAsurion').addEventListener('click', function () { applyPreset('asurion'); });
    ov.querySelector('#navAll').addEventListener('click', function () { applyPreset('all'); });
    ov.querySelector('#navNone').addEventListener('click', function () {
      excluded.clear(); TOC.forEach(function (_, h) { excluded.add(h); }); syncNavUI();
    });
    ov.querySelector('#navClose').addEventListener('click', closeNav);
    ov.addEventListener('click', function (e) { if (e.target === ov) closeNav(); });
    btn.addEventListener('click', function () { ov.hidden ? openNav() : closeNav(); });

    function markCurrent() {
      var cur = deck.getIndices().h;
      rows.forEach(function (r) { r.classList.toggle('cur', (+r.getAttribute('data-h')) === cur); });
    }
    function openNav() { ov.hidden = false; markCurrent(); var c = list.querySelector('.nav-row.cur'); if (c) c.scrollIntoView({ block: 'center' }); }
    function closeNav() { ov.hidden = true; }

    deck.on('slidechanged', function (e) {
      var h = e.indexh;
      if (h === explicitJump) { explicitJump = -1; prevH = h; markCurrent(); return; }
      if (excluded.has(h)) {
        var dir = (h >= prevH) ? 1 : -1, total = deck.getTotalSlides();
        var t = firstIncluded(h + dir, dir, total);
        if (t < 0) t = firstIncluded(h - dir, -dir, total);
        if (t >= 0 && t !== h) { prevH = h; deck.slide(t, 0, 0); return; }
      }
      prevH = h; markCurrent();
    });

    document.addEventListener('keydown', function (e) {
      var tag = (e.target && e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;
      if (e.key === 'm' || e.key === 'M') { e.preventDefault(); ov.hidden ? openNav() : closeNav(); }
      else if (e.key === 'Escape' && !ov.hidden) { e.preventDefault(); e.stopPropagation(); closeNav(); }
    }, true);

    window.__nav = { open: openNav, close: closeNav, preset: applyPreset };
  }

  /* ===================== Live call transcript =====================
     Reveals .t-turn rows one-by-one (fills as "we talk"). A Play button auto-runs;
     clicking the transcript advances one turn; leaving/returning resets. Delay per
     turn scales with text length so it feels like real speech. */
  function setupTranscript() {
    document.querySelectorAll('.transcript').forEach(function (tr) {
      var scroll = tr.querySelector('.t-scroll');
      var turns = Array.prototype.slice.call(tr.querySelectorAll('.t-turn'));
      var play = tr.querySelector('.t-play');
      var timer = null, i = 0, running = false;

      function reset() { if (timer) clearTimeout(timer); timer = null; running = false; i = 0; turns.forEach(function (t) { t.classList.remove('shown'); }); scroll.scrollTop = 0; if (play) play.textContent = '▶ Play the call'; }
      function revealNext() {
        if (i >= turns.length) { running = false; if (play) play.textContent = '↺ Replay'; return; }
        var t = turns[i++]; t.classList.add('shown');
        scroll.style.overflowY = 'auto';
        scroll.scrollTop = scroll.scrollHeight;
        return t;
      }
      function run() {
        if (running) { reset(); return; }
        if (i >= turns.length) reset();
        running = true; if (play) play.textContent = '⏸ Pause';
        (function step() {
          if (!running) return;
          var t = revealNext();
          if (!t) { running = false; if (play) play.textContent = '↺ Replay'; return; }
          var txt = (t.textContent || '').trim();
          var d = Math.min(3200, 620 + txt.length * 26);
          timer = setTimeout(step, d);
        })();
      }
      function pauseToggle() { if (running) { running = false; if (timer) clearTimeout(timer); if (play) play.textContent = '▶ Resume'; } else { run(); } }

      if (play) play.addEventListener('click', function (e) { e.stopPropagation(); if (running) pauseToggle(); else run(); });
      tr.addEventListener('click', function (e) { if (e.target.closest('.t-play')) return; if (running) { running = false; if (timer) clearTimeout(timer); } revealNext(); });

      tr.__reset = reset;
    });

    // reset the transcript when its slide is (re)entered so a presenter can replay
    deck.on('slidechanged', function () {
      var sec = document.querySelector('section.present');
      if (!sec) return;
      sec.querySelectorAll('.transcript').forEach(function (tr) { if (tr.__reset) tr.__reset(); });
    });
  }

  deck.initialize().then(function () {
    setupNav();
    setupTranscript();
    applyPreset('core');   // default the run-through to the VB / DeepLearning.AI audience
  });

  window.__deck = deck;
})();
