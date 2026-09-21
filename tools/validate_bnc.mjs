import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const root='.';
const read=p=>fs.readFileSync(p,'utf8');
const must=(ok,msg)=>{if(!ok)throw new Error(msg);console.log('PASS',msg)};

for(const p of ['index.html','FB_IMG_1789811599210.jpg','reference/demo.xlsx','invoice.pdf','invoice/index.html','invoice/js/app.js','invoice/css/app.css','invoice/sw.js','invoice/manifest.webmanifest']) must(fs.existsSync(p),p+' exists');
const invoicePdfTree=execFileSync('git',['ls-tree','-r','HEAD','--','invoice.pdf'],{encoding:'utf8'}).trim().split(/\s+/);
must(invoicePdfTree[2]==='46c9ce8303a0a4abdf7599ba1479b298c26fc6fe','invoice.pdf immutable template SHA matches locked source');

const site=read('index.html');
must(site.includes('BNC AgroCare'),'business page identifies BNC AgroCare');
must(site.includes('href="invoice/"'),'business page links to Invoice PWA');
must(site.includes('href="reference/demo.xlsx"'),'business page links to demo sheet');

const invoice=read('invoice/index.html');
must(invoice.includes('id="saveInvoice"'),'invoice save control exists');
must(invoice.includes('id="importBtn"'),'invoice JSON import exists');
must(invoice.includes('href="../reference/demo.xlsx"'),'invoice points to demo sheet');
must(!invoice.includes('../site/'),'invoice has no stale staging path');

const manifest=JSON.parse(read('invoice/manifest.webmanifest'));
must(manifest.start_url==='./','PWA start_url is relative');
must(manifest.scope==='./','PWA scope is relative');

const sw=read('invoice/sw.js');
must(/const CACHE='bnc-invoice-v\d+'/.test(sw),'service worker cache is versioned');
must(sw.includes('self.registration.scope'),'service worker uses registration scope');
must(sw.includes("caches.match('./index.html')"),'offline navigation fallback exists');

execFileSync(process.execPath,['--check','invoice/js/app.js'],{stdio:'inherit'});
execFileSync(process.execPath,['--check','invoice/sw.js'],{stdio:'inherit'});
console.log('PASS invoice JavaScript syntax');
console.log('BNC backup validation complete');
