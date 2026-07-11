/* Voice Escalation deck — reveal init + navigation/hide-slides + live transcript.
   English-only. Offline. No KaTeX. Adapted from the thesis-deck nav pattern. */
(function () {
  var deck = new Reveal({
    width: 1280, height: 720,
    margin: 0.05, minScale: 0.2, maxScale: 1.6,
    viewDistance: 3, mobileViewDistance: 1,
    hash: true, slideNumber: false,
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
    { s:'Skill design', t:'Anthropic: how to write a Skill' },
    { s:'Skill design', t:'Built for discovery (name, description)' },
    { s:'Skill design', t:'Prove it: evals and anti-patterns' },
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
    { s:'Closing',     t:'Thank you · Discussion & questions' },
    { s:'Backup',      t:'The full SKILL', hide:true },
    { s:'Backup',      t:'The caller prompt', hide:true },
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
    if (deck.__updateFooter) deck.__updateFooter();   // the run-through total changed
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
    // Show exactly the turns spoken by time `ct` (turn 0, the greeting, stays visible as the
    // opening frame). Unlike revealUpTo this is idempotent and REVERSIBLE, so seeking the
    // scrubber backward hides later turns and forward re-reveals them, always matching the audio.
    function syncToTime(ct) {
      var changed = false, shownCount = 0;
      for (var k = 0; k < turns.length; k++) {
        var should = (k === 0) || (parseFloat(turns[k].getAttribute('data-t') || '0') <= ct);
        if (should !== turns[k].classList.contains('shown')) { turns[k].classList.toggle('shown', should); changed = true; }
        if (should) shownCount = k + 1;
      }
      i = shownCount;
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
      if (tr.__drawWave) tr.__drawWave();   // reset the playhead + time label to 0:00
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
      // Bottom scrubber: the WHOLE call drawn as a real waveform (tall where there is
      // speech, flat in the gaps) with a playhead, click-to-seek, and -3s / +3s skips.
      // The audio is decoded once via Web Audio to get true peaks AND a reliable duration
      // (this Ogg reports Infinity on the <audio> element until fully buffered). The
      // transcript reveal is timestamp-driven, so any seek re-syncs the shown turns.
      var canvas = tr.querySelector('.t-scrub-wave');
      var timeLbl = tr.querySelector('.t-scrub-time');
      var peaks = null, adur = 0;

      function fmt(s) { s = Math.max(0, s | 0); return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); }
      function cvar(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim() || '#888'; }
      function drawWave() {
        if (!canvas) return;
        var w = canvas.clientWidth, h = canvas.clientHeight;
        if (!w || !h) return;
        if (canvas.width !== w) canvas.width = w;
        if (canvas.height !== h) canvas.height = h;
        var ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, w, h);
        var dur = adur || audio.duration || 0;
        var played = dur > 0 ? Math.min(1, audio.currentTime / dur) : 0;
        var mid = h / 2, cOn = cvar('--c-vb'), cOff = cvar('--ink-faint');
        if (peaks && peaks.length) {
          var bw = w / peaks.length;
          for (var k = 0; k < peaks.length; k++) {
            var bh = Math.max(2, peaks[k] * h * 0.9), on = (k / peaks.length) <= played;
            ctx.fillStyle = on ? cOn : cOff; ctx.globalAlpha = on ? 1 : 0.42;
            ctx.fillRect(k * bw, mid - bh / 2, Math.max(1, bw - 1), bh);
          }
          ctx.globalAlpha = 1;
        } else {
          ctx.fillStyle = cOff; ctx.globalAlpha = 0.4; ctx.fillRect(0, mid - 1, w, 2); ctx.globalAlpha = 1;
        }
        ctx.fillStyle = cOn; ctx.fillRect(Math.max(0, Math.min(w - 2, played * w)), 0, 2, h);
        if (timeLbl) timeLbl.textContent = fmt(audio.currentTime) + ' / ' + fmt(dur);
      }
      (function decode() {
        var src = (audio.querySelector('source') || {}).src || audio.currentSrc;
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!src || !window.fetch || !AC) return;
        fetch(src).then(function (r) { return r.arrayBuffer(); }).then(function (buf) {
          var ac = new AC();
          return ac.decodeAudioData(buf).then(function (ab) {
            adur = ab.duration;
            // The recording is stereo with each party on its own channel, so take the max
            // across ALL channels: the waveform then shows the AGENT and the caller alike.
            var chs = []; for (var c = 0; c < ab.numberOfChannels; c++) chs.push(ab.getChannelData(c));
            var len = chs[0].length, N = 480, bs = Math.max(1, Math.floor(len / N)), pk = new Array(N), mx = 1e-4;
            for (var k = 0; k < N; k++) {
              var s = 0, st = k * bs, en = Math.min(len, st + bs);
              for (var j = st; j < en; j += 64) { for (var c2 = 0; c2 < chs.length; c2++) { var v = chs[c2][j]; if (v < 0) v = -v; if (v > s) s = v; } }
              pk[k] = s; if (s > mx) mx = s;
            }
            for (var m = 0; m < N; m++) pk[m] = pk[m] / mx;
            peaks = pk; if (ac.close) ac.close(); drawWave();
          });
        }).catch(function () {});
      })();
      function seekTo(t) { var dur = adur || audio.duration || 0; if (dur > 0) { audio.currentTime = Math.max(0, Math.min(dur - 0.05, t)); syncToTime(audio.currentTime); drawWave(); } }

      audio.addEventListener('timeupdate', function () { syncToTime(audio.currentTime); drawWave(); });
      audio.addEventListener('ended', function () { syncToTime((adur || audio.duration || 1e9)); finish(); drawWave(); });
      audio.addEventListener('loadedmetadata', drawWave);
      window.addEventListener('deckpalette', drawWave);   // recolour with the theme
      if (canvas) canvas.addEventListener('click', function (e) {
        e.stopPropagation();
        var rect = canvas.getBoundingClientRect(), dur = adur || audio.duration || 0;
        if (dur > 0 && rect.width) seekTo(((e.clientX - rect.left) / rect.width) * dur);
      });
      Array.prototype.slice.call(tr.querySelectorAll('.t-skip')).forEach(function (b) {
        b.addEventListener('click', function (e) { e.stopPropagation(); seekTo((audio.currentTime || 0) + parseFloat(b.getAttribute('data-d') || '0')); });
      });
      tr.__drawWave = drawWave;   // let reset() repaint the playhead back to 0
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

  /* Backup slides: master-detail "prompt walk" — click a section to open its verbatim text on the right. */
  function setupMasterDetail() {
    document.querySelectorAll('.mdwalk').forEach(function (w) {
      var items = Array.prototype.slice.call(w.querySelectorAll('.md-item'));
      var panes = Array.prototype.slice.call(w.querySelectorAll('.md-pane'));
      items.forEach(function (it) {
        it.addEventListener('click', function (e) {
          e.stopPropagation();
          var k = it.getAttribute('data-k');
          items.forEach(function (x) { x.classList.toggle('active', x === it); });
          panes.forEach(function (p) { p.classList.toggle('active', p.getAttribute('data-k') === k); });
        });
      });
    });
  }

  /* Colour palette switcher. Each theme is a FULL palette (background, surfaces, text tiers,
     borders, and brand accents) drawn from popular modern schemes, plus colour-blind-safe and
     high-contrast sets. Applying a theme overrides the whole variable layer live (so the entire
     deck, background included, reskins) and remembers the choice in localStorage. Soft tints and
     hover shades are derived with color-mix so they adapt to each theme's surface. WCAG-verified. */
  function setupPalette() {
    // keys: id,name,group,cb, bg,surface,surface2,code_fg, text,text_soft,text_faint,border, primary,accent,success
    var THEMES = [
      { id:'default', name:'Indigo (default)', group:'Light', cb:false, bg:'#FFFFFF', surface:'#FFFFFF', surface2:'#0F1117', code_fg:'#D7DCE5', text:'#14181F', text_soft:'#48505B', text_faint:'#8A929E', border:'#E3E7EE', primary:'#5A4FE0', accent:'#E4405F', success:'#1FA971' },
      { id:'catppuccin-latte', name:'Catppuccin Latte', group:'Light', cb:false, bg:'#eff1f5', surface:'#ffffff', surface2:'#1e1e2e', code_fg:'#cdd6f4', text:'#4c4f69', text_soft:'#5c5f77', text_faint:'#8c8fa1', border:'#ccd0da', primary:'#1d63ee', accent:'#d20f39', success:'#357a1f' },
      { id:'solarized-light', name:'Solarized Light', group:'Light', cb:false, bg:'#fdf6e3', surface:'#fffbef', surface2:'#073642', code_fg:'#eee8d5', text:'#586e75', text_soft:'#5f747c', text_faint:'#93a1a1', border:'#e5ddc5', primary:'#2075b1', accent:'#d4302d', success:'#5f7a00' },
      { id:'rose-pine-dawn', name:'Rose Pine Dawn', group:'Light', cb:false, bg:'#faf4ed', surface:'#fffaf3', surface2:'#26233a', code_fg:'#e0def4', text:'#575279', text_soft:'#6e6a86', text_faint:'#9893a5', border:'#e4dfd6', primary:'#7a5c99', accent:'#a3596e', success:'#286983' },
      { id:'github-light', name:'GitHub Light', group:'Light', cb:false, bg:'#ffffff', surface:'#f6f8fa', surface2:'#24292f', code_fg:'#e6edf3', text:'#1f2328', text_soft:'#57606a', text_faint:'#8c959f', border:'#d0d7de', primary:'#0969da', accent:'#cf222e', success:'#1a7f37' },
      { id:'nord-snow-storm', name:'Nord Snow Storm', group:'Light', cb:false, bg:'#eceff4', surface:'#ffffff', surface2:'#2e3440', code_fg:'#d8dee9', text:'#2e3440', text_soft:'#434c5e', text_faint:'#7b8494', border:'#d8dee9', primary:'#4b6e9a', accent:'#a8515a', success:'#4a7a52' },
      { id:'tokyo-night', name:'Tokyo Night', group:'Dark', cb:false, bg:'#1a1b26', surface:'#24283b', surface2:'#1f2335', code_fg:'#9aa5ce', text:'#c0caf5', text_soft:'#a9b1d6', text_faint:'#565f89', border:'#2a2e42', primary:'#7aa2f7', accent:'#f7768e', success:'#9ece6a' },
      { id:'dracula', name:'Dracula', group:'Dark', cb:false, bg:'#282a36', surface:'#343746', surface2:'#21222c', code_fg:'#f8f8f2', text:'#f8f8f2', text_soft:'#c8c9d6', text_faint:'#6272a4', border:'#44475a', primary:'#bd93f9', accent:'#ff5555', success:'#50fa7b' },
      { id:'catppuccin-mocha', name:'Catppuccin Mocha', group:'Dark', cb:false, bg:'#1e1e2e', surface:'#313244', surface2:'#181825', code_fg:'#cdd6f4', text:'#cdd6f4', text_soft:'#bac2de', text_faint:'#7f849c', border:'#45475a', primary:'#89b4fa', accent:'#f38ba8', success:'#a6e3a1' },
      { id:'nord-dark', name:'Nord', group:'Dark', cb:false, bg:'#2e3440', surface:'#3b4252', surface2:'#252a34', code_fg:'#d8dee9', text:'#eceff4', text_soft:'#d8dee9', text_faint:'#8b98b0', border:'#434c5e', primary:'#88c0d0', accent:'#cf8a90', success:'#a3be8c' },
      { id:'one-dark', name:'One Dark', group:'Dark', cb:false, bg:'#282c34', surface:'#333842', surface2:'#21252b', code_fg:'#abb2bf', text:'#c8ccd4', text_soft:'#abb2bf', text_faint:'#5c6370', border:'#3b4048', primary:'#61afef', accent:'#e17179', success:'#98c379' },
      { id:'okabe-ito-light', name:'Okabe-Ito Light', group:'Accessible', cb:true, bg:'#FFFFFF', surface:'#F4F5F7', surface2:'#1B1E24', code_fg:'#E8E8E8', text:'#1A1A1A', text_soft:'#454545', text_faint:'#666666', border:'#CBCBCB', primary:'#0072B2', accent:'#c25500', success:'#007A5C' },
      { id:'okabe-ito-dark', name:'Okabe-Ito Dark', group:'Accessible', cb:true, bg:'#14161A', surface:'#22262E', surface2:'#0E0F12', code_fg:'#E8E8E8', text:'#F5F5F5', text_soft:'#C4C4C4', text_faint:'#969CA6', border:'#343A44', primary:'#56B4E9', accent:'#E69F00', success:'#33C299' },
      { id:'tol-bright-light', name:'Paul Tol Bright', group:'Accessible', cb:true, bg:'#FFFFFF', surface:'#F4F5F7', surface2:'#1B1E24', code_fg:'#E8E8E8', text:'#1A1A1A', text_soft:'#454545', text_faint:'#666666', border:'#CBCBCB', primary:'#33628F', accent:'#9A3169', success:'#1E7A2E' },
      { id:'max-contrast-light', name:'Max Contrast Light', group:'Accessible', cb:true, bg:'#FFFFFF', surface:'#F7F7F7', surface2:'#0A0A0A', code_fg:'#FFFFFF', text:'#000000', text_soft:'#2B2B2B', text_faint:'#595959', border:'#767676', primary:'#0B3D91', accent:'#9A1B6C', success:'#00594B' },
      { id:'max-contrast-dark', name:'Max Contrast Dark', group:'Accessible', cb:true, bg:'#000000', surface:'#14161A', surface2:'#0A0A0A', code_fg:'#F2F2F2', text:'#FFFFFF', text_soft:'#D6D6D6', text_faint:'#A6A6A6', border:'#7A7A7A', primary:'#7AB8FF', accent:'#FF8DC7', success:'#4FD9AE' }
    ];
    function relLum(hex) { var n = parseInt(hex.replace('#',''), 16); var a = [((n>>16)&255)/255, ((n>>8)&255)/255, (n&255)/255].map(function (c) { return c <= 0.03928 ? c/12.92 : Math.pow((c+0.055)/1.055, 2.4); }); return 0.2126*a[0] + 0.7152*a[1] + 0.0722*a[2]; }
    function mix(a, pct, b) { return 'color-mix(in srgb, ' + a + ' ' + pct + '%, ' + b + ')'; }
    var rows = [];
    function apply(t) {
      var r = document.documentElement.style;
      var onAcc = relLum(t.primary) > 0.35 ? '#14161C' : '#FFFFFF'; // dark text on light fills, white on dark fills
      r.setProperty('--bg', t.bg);
      r.setProperty('--paper', t.surface);
      r.setProperty('--paper-2', mix(t.surface, 93, t.text));
      r.setProperty('--paper-3', mix(t.surface, 86, t.text));
      r.setProperty('--ink', t.text);
      r.setProperty('--ink-soft', t.text_soft);
      r.setProperty('--ink-faint', t.text_faint);
      r.setProperty('--line', t.border);
      r.setProperty('--c-vb', t.primary);
      r.setProperty('--c-vb-2', mix(t.primary, 72, t.text));
      r.setProperty('--c-vb-soft', mix(t.primary, 14, t.surface));
      r.setProperty('--c-dl', t.accent);
      r.setProperty('--c-dl-soft', mix(t.accent, 14, t.surface));
      r.setProperty('--ok', t.success);
      r.setProperty('--ok-soft', mix(t.success, 16, t.surface));
      r.setProperty('--warn', t.accent);
      r.setProperty('--warn-soft', mix(t.accent, 14, t.surface));
      r.setProperty('--code-bg', t.surface2);
      r.setProperty('--code-fg', t.code_fg);
      r.setProperty('--on-accent', onAcc);
      try { localStorage.setItem('deckPalette', t.id); } catch (e) {}
      rows.forEach(function (row) { row.classList.toggle('active', row.getAttribute('data-p') === t.id); });
      window.dispatchEvent(new Event('deckpalette'));   // let the call waveform repaint in the new palette
    }
    var btn = document.createElement('button');
    btn.id = 'paletteToggle'; btn.type = 'button';
    btn.title = 'Colour palette (light, dark, colour-blind-safe)'; btn.setAttribute('aria-label', 'Colour palette');
    btn.innerHTML = '&#127912;';
    document.body.appendChild(btn);
    var pop = document.createElement('div'); pop.id = 'palettePop'; pop.hidden = true;
    var h = '';
    ['Light', 'Dark', 'Accessible'].forEach(function (g) {
      h += '<div class="pp-title">' + g + '</div>';
      THEMES.filter(function (t) { return t.group === g; }).forEach(function (t) {
        h += '<button class="pp-row" type="button" data-p="' + t.id + '">' +
          '<span class="pp-sw"><i style="background:' + t.primary + '"></i><i style="background:' + t.accent + '"></i><i style="background:' + t.success + '"></i></span>' +
          '<span class="pp-name">' + t.name + '</span>' + (t.cb ? '<span class="pp-cb">CB safe</span>' : '') + '</button>';
      });
    });
    pop.innerHTML = h; document.body.appendChild(pop);
    rows = Array.prototype.slice.call(pop.querySelectorAll('.pp-row'));
    rows.forEach(function (row) {
      row.addEventListener('click', function () {
        var t = THEMES.filter(function (x) { return x.id === row.getAttribute('data-p'); })[0];
        if (t) apply(t);
        pop.hidden = true;
      });
    });
    btn.addEventListener('click', function (e) { e.stopPropagation(); pop.hidden = !pop.hidden; });
    document.addEventListener('click', function (e) { if (!pop.hidden && e.target !== btn && !pop.contains(e.target)) pop.hidden = true; });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !pop.hidden) pop.hidden = true; });
    var saved = null; try { saved = localStorage.getItem('deckPalette'); } catch (e) {}
    apply(THEMES.filter(function (x) { return x.id === saved; })[0] || THEMES[0]);
  }

  /* Bottom-left chrome: presenter credit + a "slide X of Y" counter. The count is the
     position within the CURRENT run-through (hidden Asurion/Backup slides are not counted),
     so it never jumps; it refreshes when the preset changes. */
  function setupFooter() {
    var foot = document.createElement('div'); foot.id = 'deckFoot';
    foot.innerHTML = '<span class="df-name">Nikolaos Koroniadis</span><span class="df-sep">&#183;</span><span class="df-num"></span>';
    document.body.appendChild(foot);
    var numEl = foot.querySelector('.df-num');
    function update() {
      var h = deck.getIndices().h, pos = 0, tot = 0;
      for (var k = 0; k < TOC.length; k++) { if (!excluded.has(k)) { tot++; if (k <= h) pos++; } }
      numEl.textContent = 'slide ' + Math.max(1, pos) + ' of ' + tot;
    }
    deck.on('slidechanged', update);
    deck.__updateFooter = update;
    update();
  }

  /* Cascading reveal for the feedback slides: after the green summary (fragment 1), the
     second click reveals the rated items one after another (see [data-cascade] = ms/step). */
  function setupCascade() {
    function items(c) { return Array.prototype.slice.call(c.querySelectorAll('.fb-dim')); }
    document.querySelectorAll('[data-cascade]').forEach(function (c) { items(c).forEach(function (it) { it.classList.add('casc-off'); }); });
    function clearC(c) { if (c && c.__t) { c.__t.forEach(clearTimeout); c.__t = []; } }
    function hide(c) { clearC(c); items(c).forEach(function (it) { it.classList.remove('casc-on'); it.classList.add('casc-off'); }); }
    function run(f) {
      var sec = f.closest('section'); var c = sec && sec.querySelector('[data-cascade]'); if (!c) return;
      clearC(c); c.__t = [];
      var step = parseInt(c.getAttribute('data-cascade') || '750', 10);
      items(c).forEach(function (it, k) { c.__t.push(setTimeout(function () { it.classList.remove('casc-off'); it.classList.add('casc-on'); }, k * step)); });
    }
    deck.on('fragmentshown', function (e) { if (e.fragment.classList.contains('fb-cascade')) run(e.fragment); });
    deck.on('fragmenthidden', function (e) { if (e.fragment.classList.contains('fb-cascade')) { var s = e.fragment.closest('section'); if (s) hide(s.querySelector('[data-cascade]')); } });
    deck.on('slidechanged', function () {
      document.querySelectorAll('[data-cascade]').forEach(function (c) { var s = c.closest('section'); if (s && !s.classList.contains('present')) hide(c); });
    });
  }

  deck.initialize().then(function () {
    setupNav();
    setupTranscript();
    setupMasterDetail();
    setupPalette();
    setupFooter();
    setupCascade();
    applyPreset('core');   // default the run-through to the VB / DeepLearning.AI audience
  });

  window.__deck = deck;
})();
