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
    { s:'Intro',       t:'The challenge and how it was scored' },
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
  var PAD = 8; // px kept between the newest turn and the window's bottom edge

  document.querySelectorAll('.transcript').forEach(function (tr) {
    var stack = tr.querySelector('.t-stack');
    var win   = tr.querySelector('.t-window');
    var wave  = tr.querySelector('.t-wave');
    var label = tr.querySelector('.t-head-label');
    var play  = tr.querySelector('.t-play');
    var audio = tr.querySelector('audio');
    var turns = Array.prototype.slice.call(tr.querySelectorAll('.t-turn'));
    if (!stack || !win || !turns.length) return;

    var timer = null, i = 0, running = false;

    function setPlaying(on) {
      running = on;
      if (wave) wave.classList.toggle('playing', on); // drives the waveform
      tr.classList.toggle('is-playing', on);          // drives the 'Live' dot pulse
    }
    function btn(t)    { if (play)  play.textContent  = t; }
    function status(t) { if (label) label.textContent = t; }

    // Teleprompter glide. Fill from the TOP while the shown turns are shorter than
    // the window; only once they exceed it do we translate up so the newest turn's
    // bottom pins to the window bottom (older turns clip off the top). Clamping y to
    // <= 0 is what keeps the opening frame top-aligned instead of pinned to the base
    // with a blank band above. The page/slide is never scrolled: we only set a
    // transform inside overflow:hidden, and offsetTop/offsetHeight are layout px
    // unaffected by that transform, so measurements stay accurate.
    function advance() {
      var wh = win.clientHeight;
      if (!wh || i <= 0) { stack.style.transform = 'translateY(0px)'; return; }
      var last = turns[i - 1];
      var y;
      if (last.offsetHeight >= wh) {
        y = -last.offsetTop; // turn taller than the window (the long pitch): pin its TOP so you read from the start
      } else {
        var bottom = last.offsetTop + last.offsetHeight;
        y = wh - bottom - PAD; // normal: pin the newest turn's bottom to the window bottom
        if (y > 0) y = 0;      // content still fits from the top -> stay top-aligned
      }
      stack.style.transform = 'translateY(' + y + 'px)';
    }

    function revealNext() {
      if (i >= turns.length) return null;
      var t = turns[i++];
      t.classList.add('shown');
      advance();
      return t;
    }
    function revealUpTo(n) {
      if (n > turns.length) n = turns.length;
      var changed = false;
      while (i < n) { turns[i++].classList.add('shown'); changed = true; }
      if (changed) advance();
    }

    // Reset pre-reveals the first turn so the slide is never blank on arrival. The
    // persistent header and win banner already state the outcome independent of
    // playback, so playing the call is an enhancement, not a prerequisite.
    function reset() {
      if (timer) { clearTimeout(timer); timer = null; }
      if (audio) { try { audio.pause(); audio.currentTime = 0; } catch (e) {} }
      turns.forEach(function (t) { t.classList.remove('shown'); });
      i = 0;
      stack.style.transform = 'translateY(0px)';
      setPlaying(false);
      if (turns[0]) { turns[0].classList.add('shown'); i = 1; }
      advance();
      btn('▶ Play the call');
      status('Ready to play');
    }

    function finish() {
      if (timer) { clearTimeout(timer); timer = null; }
      setPlaying(false);
      btn('↺ Replay');
      status('Call ended');
    }

    // spoken length excludes the italic annotation, so pacing tracks the actual line
    function spokenLen(t) {
      var b = t.querySelector('.bubble');
      if (!b) return (t.textContent || '').length;
      var a = b.querySelector('.anno');
      return Math.max(1, b.textContent.length - (a ? a.textContent.length : 0));
    }

    function tick() {
      if (!running) return;
      var t = revealNext();
      if (!t) { finish(); return; }
      var d = Math.max(700, Math.min(3400, 460 + spokenLen(t) * 30));
      timer = setTimeout(tick, d);
    }

    function start() {
      if (i >= turns.length) reset(); // finished -> replay from the top
      setPlaying(true);
      btn('⏸ Pause');
      status('On call');
      if (audio) { var pr = audio.play(); if (pr && pr.catch) pr.catch(function () {}); }
      else tick();
    }

    function pause() {
      if (timer) { clearTimeout(timer); timer = null; }
      if (audio) { try { audio.pause(); } catch (e) {} }
      setPlaying(false);
      btn('▶ Resume');
      status('Paused');
    }

    if (audio) {
      // Timestamp-driven reveal: each turn carries data-t = the real second it is
      // spoken in the recording (from the call log, session-start anchored). A turn
      // appears exactly as the audio reaches it, so text and voice stay in lockstep.
      audio.addEventListener('timeupdate', function () {
        if (!running) return;
        var ct = audio.currentTime, changed = false;
        while (i < turns.length && parseFloat(turns[i].getAttribute('data-t') || '0') <= ct) {
          turns[i++].classList.add('shown'); changed = true;
        }
        if (changed) advance();
      });
      audio.addEventListener('ended', function () { revealUpTo(turns.length); finish(); });
    }

    if (play) play.addEventListener('click', function (e) {
      e.stopPropagation();
      if (running) pause(); else start();
    });

    // presenter aid: click the transcript window to step one turn (no-audio mode only)
    win.addEventListener('click', function () {
      if (audio) return;
      if (running) { if (timer) { clearTimeout(timer); timer = null; } setPlaying(false); btn('▶ Resume'); }
      var t = revealNext();
      if (!t) finish(); else status('On call');
    });

    reset();
    tr.__reset = reset;
  });

  // reset the transcript whenever its slide is (re)entered, so it can be replayed
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
