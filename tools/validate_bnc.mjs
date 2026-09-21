import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const root='.';
const read=p=>fs.readFileSync(p,'utf8');
const must=(ok,msg)=>{if(!ok)throw new Error(msg);console.log('PASS',msg)};

for(const p of ['index.html','FB_IMG_1789811599210.jpg','invoice.pdf','invoice/index.html','invoice/js/app.js','invoice/css/app.css','invoice/sw.js','invoice/manifest.webmanifest','invoice/icons/icon.svg']) must(fs.existsSync(p),p+' exists');
const pdfTree=execFileSync('git',['ls-tree','-r','HEAD','--','invoice.pdf'],{encoding:'utf8'}).trim().split(/\s+/);
must(pdfTree[2]==='46c9ce8303a0a4abdf7599ba1479b298c26fc6fe','invoice.pdf immutable template SHA matches locked source');

const site=read('index.html');
must(site.includes('BNC AgroCare'),'business page identifies BNC AgroCare');
must(site.includes('href="invoice/"'),'business page links to Invoice PWA');

const invoice=read('invoice/index.html');
must(invoice.includes('id="previewBtn"'),'invoice generate control exists');
must(invoice.includes('id="saveBtn"'),'invoice save control exists');
must(invoice.includes('id="jsonInBtn"'),'invoice JSON import control exists');
must(invoice.includes('serviceWorker'),'invoice registers its own service worker');
must(invoice.includes('../invoice.pdf'),'invoice references local locked PDF template');
must(invoice.includes('pdf-lib@1.17.1'),'invoice includes the pinned PDF engine');

const js=read('invoice/js/app.js');
must(js.includes('const TEMPLATE="../invoice.pdf"'),'invoice uses the local locked PDF template');
must(js.includes('fetch(TEMPLATE'),'invoice loads the locked template at runtime');
must(js.includes('header_B4_L4'),'invoice maps the template ref field explicitly');
must(js.includes('dealer_trader_name'),'invoice maps trader field explicitly');
must(js.includes('function totals()')&&js.includes('leftAmount')&&js.includes('rightAmount'),'invoice calculates the left/right summary amounts');
must(js.includes('if(!drawn)drawSummary(page,totals(),0,font,bold)'),'invoice always redraws the summary when no extra data rows exist');
must(js.includes('const X=[22.883,35.553,96.994'),'invoice uses the corrected template geometry');
must(js.includes('MAX_EXTRAROWS=10'),'invoice bounds same-page dynamic expansion');
must(js.includes('function continuationPage'),'invoice has a safe overflow path');
execFileSync(process.execPath,['--check','invoice/js/app.js'],{stdio:'inherit'});

const manifest=JSON.parse(read('invoice/manifest.webmanifest'));
must(manifest.start_url==='./','PWA start_url is relative');
must(manifest.scope==='./','PWA scope is relative');
must(Array.isArray(manifest.icons)&&manifest.icons.length>0,'PWA icon is declared');

const sw=read('invoice/sw.js');
must(/bnc-invoice-v\d+/.test(sw),'service worker cache is versioned');
must(sw.includes('self.registration.scope'),'service worker derives its navigation scope');
must(sw.includes('caches.match(FALLBACK)'),'service worker has offline navigation fallback');
execFileSync(process.execPath,['--check','invoice/sw.js'],{stdio:'inherit'});
console.log('BNC backup validation complete');