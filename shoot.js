/* Headless PNG renderer for the deck (offline, deterministic).
   Usage:  node shoot.js [hIndex ...]      e.g.  node shoot.js 15 16 17 18
           node shoot.js                    -> all slides
   Output: deck/_shots/slide_<hh>.png  (1280x720 @2x, fragments fully revealed) */
const http = require('http');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const PORT = 8912;
const ROOT = path.resolve(__dirname, '..');          // .../Chapters/presentation
const OUT = path.join(__dirname, '_shots');
const TYPES = { '.html':'text/html','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript',
  '.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml',
  '.gif':'image/gif','.woff':'font/woff','.woff2':'font/woff2','.ttf':'font/ttf','.eot':'application/vnd.ms-fontobject','.map':'application/json' };

const server = http.createServer((req,res)=>{
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/' ) p = '/deck/index.html';
  const fp = path.join(ROOT, p);
  if (!fp.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  fs.readFile(fp,(e,d)=>{ if(e){res.writeHead(404);return res.end('404 '+p);}
    res.writeHead(200,{'Content-Type':TYPES[path.extname(fp).toLowerCase()]||'application/octet-stream'}); res.end(d); });
});

const sleep = ms => new Promise(r=>setTimeout(r,ms));

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  await new Promise(r=>server.listen(PORT,r));
  const browser = await puppeteer.launch({ headless: 'new', args:['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width:1280, height:720, deviceScaleFactor:2 });
  await page.goto(`http://localhost:${PORT}/deck/index.html`, { waitUntil:'networkidle0' });
  await page.waitForFunction('window.__deck && window.__deck.getTotalSlides && window.__deck.getTotalSlides()>0');
  await page.addStyleTag({ content:'.reveal .controls,.reveal .progress,.reveal .slide-number{display:none!important}' });
  await sleep(400);

  const total = await page.evaluate(()=>window.__deck.getTotalSlides());
  let idx = process.argv.slice(2).map(Number).filter(n=>!Number.isNaN(n));
  if (idx.length === 0) idx = Array.from({length: total}, (_,i)=>i);

  for (const h of idx) {
    await page.evaluate((h)=>window.__deck.slide(h,0,0), h);
    await sleep(150);
    await page.evaluate(()=>{ const c=window.__deck.getCurrentSlide(); const n=c.querySelectorAll('.fragment').length; for(let i=0;i<n;i++) window.__deck.nextFragment(); });
    await sleep(2000); // let fragment transitions + JS animations (e.g. bootstrap ~1.5s) settle
    const file = path.join(OUT, `slide_${String(h).padStart(2,'0')}.png`);
    await page.screenshot({ path:file });
    const title = await page.evaluate(()=>{ const c=window.__deck.getCurrentSlide(); const t=c.querySelector('.slide-title,h1'); return t?t.textContent.trim().slice(0,60):'(cover)'; });
    console.log(`slide ${String(h).padStart(2,'0')}  ${file}  | ${title}`);
  }

  await browser.close();
  server.close();
})().catch(e=>{ console.error(e); process.exit(1); });
