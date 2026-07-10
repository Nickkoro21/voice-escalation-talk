/* Deterministic layout auditor for the deck.
   For every slide (all fragments revealed) it reports:
     (1) OVERFLOW — any element whose box extends beyond the slide edges
     (2) LOGO/FN OVERLAP — deck chrome (.logo-bar/.slide-fn) intersecting content
   Run: node audit.js              (all slides)
        node audit.js 10 11 12     (specific h-indices)                              */
const http = require('http');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const PORT = 8913;
const ROOT = path.resolve(__dirname, '..');
const TYPES = { '.html':'text/html','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript',
  '.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml',
  '.gif':'image/gif','.woff':'font/woff','.woff2':'font/woff2','.ttf':'font/ttf','.eot':'application/vnd.ms-fontobject','.map':'application/json' };
const server = http.createServer((req,res)=>{ let p=decodeURIComponent(req.url.split('?')[0]); if(p==='/')p='/deck/index.html';
  const fp=path.join(ROOT,p); if(!fp.startsWith(ROOT)){res.writeHead(403);return res.end();}
  fs.readFile(fp,(e,d)=>{ if(e){res.writeHead(404);return res.end();} res.writeHead(200,{'Content-Type':TYPES[path.extname(fp).toLowerCase()]||'application/octet-stream'}); res.end(d); }); });
const sleep = ms => new Promise(r=>setTimeout(r,ms));

(async () => {
  await new Promise(r=>server.listen(PORT,r));
  const browser = await puppeteer.launch({ headless:'new', args:['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width:1280, height:720, deviceScaleFactor:1 });
  await page.goto(`http://localhost:${PORT}/deck/index.html`, { waitUntil:'networkidle0' });
  await page.waitForFunction('window.__deck && window.__deck.getTotalSlides && window.__deck.getTotalSlides()>0');
  await sleep(400);
  const total = await page.evaluate(()=>window.__deck.getTotalSlides());
  let idx = process.argv.slice(2).map(Number).filter(n=>!Number.isNaN(n));
  if (!idx.length) idx = Array.from({length:total},(_,i)=>i);

  const TOL = 2; // px tolerance
  let problems = 0;
  for (const h of idx) {
    const rep = await page.evaluate((h, TOL) => {
      const d = window.__deck; d.slide(h,0,0);
      const cur = d.getCurrentSlide();
      const nf = cur.querySelectorAll('.fragment').length;
      for (let i=0;i<nf;i++) d.nextFragment();
      const sr = cur.getBoundingClientRect();
      const title = (cur.querySelector('.slide-title,h1')||{}).textContent || '(cover)';
      const sel = el => el.tagName.toLowerCase() + (el.className && typeof el.className==='string' ? '.'+el.className.trim().split(/\s+/).slice(0,2).join('.') : '');
      // (1) overflow beyond slide edges
      const over = [];
      cur.querySelectorAll('*').forEach(el=>{
        const r = el.getBoundingClientRect();
        if (r.width<2||r.height<2) return;
        const dR=r.right-sr.right, dB=r.bottom-sr.bottom, dL=sr.left-r.left, dT=sr.top-r.top;
        const m = Math.max(dR,dB,dL,dT);
        if (m>TOL) over.push({ el:sel(el), px:Math.round(m), side:(dR===m?'right':dB===m?'bottom':dL===m?'left':'top') });
      });
      over.sort((a,b)=>b.px-a.px);
      // (2) chrome overlap with content
      const chrome = [...cur.querySelectorAll('.logo-bar,.slide-fn')];
      const content = [...cur.querySelectorAll('.fig,.bigfig,table,.callout,.lead,ul.chall,ol.steps,.timeline,.task-grid,.pipeline,.gloss-grid,.ns-list,.boot,.anat-col,.linkcard,.demo-card,.rq,.stat-line,.legend,p')];
      const overlaps = [];
      chrome.forEach(c=>{ const a=c.getBoundingClientRect(); content.forEach(k=>{ const b=k.getBoundingClientRect();
        const ix=Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left));
        const iy=Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top));
        if (ix>4 && iy>4) overlaps.push({ chrome:sel(c), over:sel(k), area:Math.round(ix*iy) });
      });});
      // dedupe overflow by selector (keep max)
      const seen={}; const overU=[];
      over.forEach(o=>{ if(!seen[o.el]||seen[o.el]<o.px){seen[o.el]=o.px;} });
      Object.keys(seen).forEach(k=>overU.push({el:k,px:seen[k]}));
      overU.sort((a,b)=>b.px-a.px);
      return { h, title:title.trim().slice(0,52), overflow:overU.slice(0,6), overlaps:overlaps.slice(0,4) };
    }, h, TOL);
    await sleep(60);
    if (rep.overflow.length || rep.overlaps.length) {
      problems++;
      console.log(`\n#${String(rep.h).padStart(2,'0')} ${rep.title}`);
      if (rep.overflow.length) rep.overflow.forEach(o=>console.log(`   OVERFLOW ${o.px}px  ${o.el}`));
      if (rep.overlaps.length) rep.overlaps.forEach(o=>console.log(`   OVERLAP  ${o.chrome}  ×  ${o.over}  (${o.area}px²)`));
    }
  }
  console.log(`\n=== ${problems} slide(s) with issues out of ${idx.length} ===`);
  await browser.close(); server.close();
})().catch(e=>{ console.error(e); process.exit(1); });
