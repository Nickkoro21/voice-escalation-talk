<div align="center">

# 📞 Teaching an AI Agent to Pick Up the Phone

**The winning entry of the DeepLearning.AI × Vocal Bridge 7-Day Voice AI Builder Challenge,**
**told as an interactive, offline-first reveal.js talk**

[![Live Presentation](https://img.shields.io/badge/▶%20Live-Presentation-5A4FE0)](https://nickkoro21.github.io/voice-escalation-talk/)
[![Result](https://img.shields.io/badge/Challenge-1st%20Place%20%C2%B7%20100th%20pct-E4405F)](https://nickkoro21.github.io/voice-escalation-talk/)
[![reveal.js](https://img.shields.io/badge/reveal.js-5.x-brightgreen)](https://revealjs.com/)
[![Build](https://img.shields.io/badge/Build-No%20build%20step-blue)](https://github.com/Nickkoro21/voice-escalation-talk)
[![Offline](https://img.shields.io/badge/Runs-Fully%20offline-lightgrey)](https://github.com/Nickkoro21/voice-escalation-talk)
[![Accessible](https://img.shields.io/badge/Palettes-16%20incl.%20colour--blind%20safe-1FA971)](https://nickkoro21.github.io/voice-escalation-talk/)

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Nick%20Koroniadis-0A66C2?logo=linkedin&logoColor=white)](https://www.linkedin.com/in/nick-koroniadis-328962226/)
[![Hugging Face](https://img.shields.io/badge/🤗%20Hugging%20Face-NickKoro21-FFD21E)](https://huggingface.co/NickKoro21)
[![GitHub](https://img.shields.io/badge/GitHub-Nickkoro21-181717?logo=github&logoColor=white)](https://github.com/Nickkoro21)

### 🎤 [**Open the live presentation →**](https://nickkoro21.github.io/voice-escalation-talk/)

[🏆 **The Result**](#-the-result) · [🎛️ **What makes it interactive**](#%EF%B8%8F-what-makes-it-interactive) · [💻 **Run it locally**](#-run-it-locally) · [🏗️ **Structure**](#%EF%B8%8F-tech-stack--structure) · [👤 **Author**](#-author)

</div>

---

## Overview

An autonomous coding agent should keep working on its own. But every so often it hits a decision that is
genuinely a human's to make: something irreversible, an ambiguous fork with no default, a scope change
nobody asked for. The usual answer is to stop and wait. The better one is to **pick up the phone**.

This repository hosts the **talk** about that build: a Voice Escalation `SKILL` that teaches a coding agent
to place a real phone call through **Vocal Bridge**, state the stakes and the options in plain speech, wait
for a spoken decision, and only then resume, failing safe if anything goes wrong.

It took **1st place** in the DeepLearning.AI × Vocal Bridge 7-Day Voice AI Builder Challenge. The deck walks
through the problem, the architecture choices, the live call itself (with the real recording), the honest
plateau that took nine submissions to break, and what transfers to any human-in-the-loop system.

> 🎧 **The deck plays the actual winning call.** The transcript is synced to the real per-turn timestamps
> from the call log, so text and voice stay in lockstep.

---

## 🏆 The Result

| Part | What was graded | Score |
|------|-----------------|-------|
| **Part 1** | The `SKILL`: trigger discrimination, context sufficiency, safety, tested against secret scenarios | **47 / 50** |
| **Part 2** | The call: integrity and UX, judged on a real recorded call | **49 / 50** |

**Final standing (curved leaderboard):**

| Skill | Video | Total | Next best | Rank |
|-------|-------|-------|-----------|------|
| 40 | 50 | **90** | 81 | **1st, 100th percentile** |

### The turning point

Part 2 sat frozen at **37/50 for nine consecutive submissions** of happy-path polish. It moved to **49** only
when the demo showed the agent **visibly recovering** from a messy real caller: a non-English opener, an
off-topic detour, indecision, and a mid-call change of mind. The grader rewards resilience it can hear, not
a clean run.

---

## 🎛️ What makes it interactive

This is not a slide export. Every element below is live in the browser.

| Feature | What it does |
|---------|--------------|
| 🎧 **The winning call** | Plays the real recording with a full-call **waveform scrubber**: click to seek, `−3s` / `+3s` to step, and the transcript reveals turn by turn at each line's true timestamp |
| 👥 **Two audience presets** | One deck, two runs. **Core** for the general/technical audience, **Asurion** adds a block on human-in-the-loop escalation for a fraud data-science team. Press <kbd>m</kbd> to switch |
| 🎨 **16 colour palettes** | Light, dark, and accessible groups, including **Okabe-Ito** and **Paul Tol** colour-blind-safe sets plus AAA high-contrast. The whole deck reskins, background included. Choice persists |
| 📖 **Interactive backups** | The full `SKILL` and the full caller prompt as a **master-detail walk**: click any section in the left rail to open its verbatim text |
| ⏯️ **Staged reveals** | Dense slides build one point per click, so the audience reads with you rather than ahead of you |
| 🧭 **Presenter chrome** | Slide counter that tracks position within the *current* run (hidden slides never make it jump), plus a jump-to-slide menu |

---

## 💻 Run it locally

The deck is **fully self-contained**: reveal.js is vendored, there is no build step, and nothing is fetched
from a CDN at runtime.

**Option A, direct file open** (simplest):

Double-click `index.html`. Everything renders, though some browsers restrict local audio loading.

**Option B, local HTTP server** (recommended, needed for the call audio):

```bash
node server.js
# then open http://localhost:8911
```

Any static server works just as well:

```bash
python -m http.server 8000
```

**Option C, hosted** ⭐

Already live on GitHub Pages:

🌐 **[nickkoro21.github.io/voice-escalation-talk](https://nickkoro21.github.io/voice-escalation-talk/)**

### Keyboard

| Key | Action |
|-----|--------|
| <kbd>→</kbd> / <kbd>←</kbd> | Next / previous step (advances staged reveals too) |
| <kbd>m</kbd> | Open the slide menu, switch audience preset, hide individual slides |
| <kbd>Esc</kbd> | Close the menu or the palette picker |
| <kbd>f</kbd> | Fullscreen |

---

## 🏗️ Tech Stack & Structure

- **Framework**: [reveal.js 5.x](https://revealjs.com/), vendored locally, fixed 1280×720, top-aligned
- **Build step**: **none**, every file is plain HTML, CSS and JavaScript
- **Audio**: Web Audio API decodes the call once to compute true waveform peaks across both stereo channels
- **Theming**: a single CSS variable layer (`--bg`, surfaces, text tiers, accents) with `color-mix` derived
  tints, so one switch reskins everything
- **Total weight**: ~12 MB, most of it the vendored reveal.js and the call recording

```
voice-escalation-talk/
├── index.html            ← the deck, 48 slides, one <section> each
├── css/
│   └── theme.css         ← design system: variables, components, palettes
├── js/
│   └── deck.js           ← reveal init, nav + presets, call player,
│                            waveform scrubber, palette switcher, cascades
├── assets/
│   ├── winning_call.ogg  ← the real recorded call
│   ├── DLAI.png, VB.svg  ← logos
│   ├── sat_*.png         ← satellite zoom tiles
│   └── Voidokoilia.jpg
├── vendor/reveal/        ← reveal.js 5.x, offline
├── server.js             ← tiny static preview server (port 8911)
├── audit.js, shoot.js    ← optional Puppeteer tooling
└── .nojekyll             ← so GitHub Pages serves it verbatim
```

> ⚠️ The slide order in `index.html` **must** stay aligned with the `TOC` array in `js/deck.js`, since the
> navigation menu and the presets map slides by index.

---

## 📞 What the SKILL actually does

The deliverable the challenge asked for was a `SKILL.md`, and the deck shows it in full. In short, it has
three jobs:

1. **Discriminate**, call only when the decision is genuinely the human's. Reversibility over magnitude: a
   large reversible change is the agent's to make, a small irreversible one on real data is a call.
2. **Contextualize**, speak it like a voicemail to a busy colleague. The ask first, one line of stakes, two
   or three options with their consequences fused in, and how to answer. No secrets, no paths, no IDs read aloud.
3. **Execute safely**, act on a clear answer, and fail safe on anything else. A bare "okay" in any language
   is not a choice, an irreversible action needs an explicit yes naming it, and a stop sticks for the session.

---

## 👤 Author

**Nikolaos Koroniadis**

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Nick%20Koroniadis-0A66C2?logo=linkedin&logoColor=white)](https://www.linkedin.com/in/nick-koroniadis-328962226/)
[![Hugging Face](https://img.shields.io/badge/🤗%20Hugging%20Face-NickKoro21-FFD21E)](https://huggingface.co/NickKoro21)
[![GitHub](https://img.shields.io/badge/GitHub-Nickkoro21-181717?logo=github&logoColor=white)](https://github.com/Nickkoro21)

MSc Geography and Applied Geoinformatics, [University of the Aegean](https://www.aegean.gr/).
Instructor pilot by trade, data science and human factors by obsession, which is roughly how a talk about
teaching software when to interrupt a human ended up feeling familiar.

---

## 🔗 Related Projects

- 🗺️ **[Geo-RAG](https://nickkoro21.github.io/geospatial-ai-pipeline-walkthrough/)**, a geospatial retrieval
  voice agent, project at the University of the Aegean
- 🛰️ **[Thesis Results Dashboard](https://github.com/Nickkoro21/thesis-7band-vs-rgb)**, 7-Band vs RGB
  DeepLabV3+ PointRend comparison ([live](https://nickkoro21.github.io/thesis-7band-vs-rgb/))
- 🧰 **[PostProcessing Toolbox](https://github.com/Nickkoro21/PostProcessing-Toolbox)**, ArcGIS Pro toolbox
  for vectorizing segmentation outputs ([live docs](https://nickkoro21.github.io/PostProcessing-Toolbox/))
- 🎲 **[JM Separability Toolbox](https://github.com/Nickkoro21/jm-separability-toolbox)**, sensor-agnostic
  Jeffries-Matusita separability analysis

---

## 🙏 Acknowledgments

- **[DeepLearning.AI](https://www.deeplearning.ai/courses/voice-for-ai-agents-and-applications)** and
  **Vocal Bridge** for the course and for running the challenge that produced all of this.
- The Vocal Bridge team for a `vb call` primitive clean enough that a phone call really does behave like a
  function call.
- **Anthropic Claude** for AI-assisted development throughout the build and this deck.
- **GitHub Pages** for hosting that costs nothing and just works.

---

<div align="center">

Built with 🎤 reveal.js, one real phone call, and lots of ☕ in **Kalamata, Greece**.

### [▶ Open the presentation](https://nickkoro21.github.io/voice-escalation-talk/)

</div>
