import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const root='.';
const read=p=>fs.readFileSync(p,'utf8');
const must=(ok,msg)=>{if(!ok)throw new Error(msg);console.log('PASS',msg)};

for(const p of ['index.html','FB_IMG_1789811599210.jpg','reference/demo.xlsx','exactsheet.xlsx','invoice.pdf','invoice/index.html','invoice/js/app.js','invoice/css/app.css','invoice/sw.js','invoice/manifest.webmanifest']) must(fs.existsSync(p),p+' exists');
const invoicePdfTree=execFileSync('git',['ls-tree','-r','HEAD','--','invoice.pdf'],{encoding:'utf8'}).trim().split(/\s+/);
must(invoicePdfTree[2]==='46c9ce8303a0a4abdf7599ba1479b298c26fc6fe','invoice.pdf immutable template SHA matches locked source');


must(fs.existsSync('exactsheet.xlsx'),'exactsheet.xlsx exists');

const sheetInspect=String.raw`
import zipfile, xml.etree.ElementTree as ET
from pathlib import Path

p=Path("exactsheet.xlsx")
ns={"main":"http://schemas.openxmlformats.org/spreadsheetml/2006/main","r":"http://schemas.openxmlformats.org/officeDocument/2006/relationships"}
with zipfile.ZipFile(p) as z:
    ss=[]
    if "xl/sharedStrings.xml" in z.namelist():
        root=ET.fromstring(z.read("xl/sharedStrings.xml"))
        for si in root.findall("main:si",ns):
            ss.append("".join(t.text or "" for t in si.iterfind(".//main:t",ns)))
    ws=ET.fromstring(z.read("xl/worksheets/sheet1.xml"))
    dim=ws.find("main:dimension",ns)
    print("EXACTSHEET DIMENSION:",dim.attrib.get("ref",""))
    print("EXACTSHEET MERGES:",",".join(x.attrib["ref"] for x in ws.findall("main:mergeCells/main:mergeCell",ns)) or "(none)")
    cols=ws.find("main:cols",ns)
    if cols is not None:
        print("EXACTSHEET COLUMN WIDTHS:")
        for x in cols.findall("main:col",ns):
            print(" ",x.attrib)
    print("EXACTSHEET ROW HEIGHTS:")
    for row in ws.findall("main:sheetData/main:row",ns):
        if "ht" in row.attrib:
            print(" ",row.attrib["r"],row.attrib["ht"],row.attrib.get("customHeight",""))
    pp=ws.find("main:sheetPr/main:pageSetUpPr",ns)
    ps=ws.find("main:pageMargins",ns)
    page=ws.find("main:pageSetup",ns)
    if pp is not None: print("EXACTSHEET PAGE SETUP PR:",pp.attrib)
    if ps is not None: print("EXACTSHEET PAGE MARGINS:",ps.attrib)
    if page is not None: print("EXACTSHEET PAGE SETUP:",page.attrib)
    panes=ws.find("main:sheetViews/main:sheetView/main:pane",ns)
    if panes is not None: print("EXACTSHEET FREEZE PANE:",panes.attrib)
    print("EXACTSHEET CELLS:")
    for cell in ws.findall("main:sheetData/main:row/main:c",ns):
        ref=cell.attrib["r"]
        v=cell.find("main:v",ns)
        isel=cell.find("main:is",ns)
        t=cell.attrib.get("t")
        if isel is not None:
            val="".join(x.text or "" for x in isel.iterfind(".//main:t",ns))
        elif v is not None:
            raw=v.text or ""
            val=ss[int(raw)] if t=="s" and raw.isdigit() and int(raw)<len(ss) else raw
        else:
            val=""
        if val!="":
            print(f" {ref}={val!r} style={cell.attrib.get('s','0')}")
`;
execFileSync('python3',['-c',sheetInspect],{stdio:'inherit'});
console.log('PASS exactsheet inspection complete');

const site=read('index.html');
must(site.includes('BNC AgroCare'),'business page identifies BNC AgroCare');
must(site.includes('href="invoice/"'),'business page links to Invoice PWA');
must(site.includes('exactsheet.xlsx'),'business page links to exactsheet');

const invoice=read('invoice/index.html');
must(invoice.includes('id="saveInvoice"'),'invoice save control exists');
must(invoice.includes('id="downloadXlsxBtn"'),'invoice XLSX download control exists');
must(invoice.includes('id="importBtn"'),'invoice JSON import exists');
must(invoice.includes('exactsheet.xlsx'),'invoice references exactsheet');
must(!invoice.includes('../site/'),'invoice has no stale staging path');

const manifest=JSON.parse(read('invoice/manifest.webmanifest'));
must(manifest.start_url==='./','PWA start_url is relative');
must(manifest.scope==='./','PWA scope is relative');
must(read('invoice/index.html').includes('xlsx-js-style@1.2.0'),'invoice uses exactsheet XLSX engine');
must(read('invoice/js/app.js').includes('XLSX.read'),'invoice reads exactsheet workbook');
must(read('invoice/js/app.js').includes('shiftWorkbookRows'),'invoice can expand workbook rows');
must(!read('invoice/js/app.js').includes('PDFLib'),'invoice app has no PDF engine dependency');

const sw=read('invoice/sw.js');
must(/const CACHE='bnc-invoice-v\d+'/.test(sw),'service worker cache is versioned');
must(sw.includes('self.registration.scope'),'service worker uses registration scope');
must(sw.includes("caches.match(FALLBACK_URL)"),'offline navigation fallback exists');

execFileSync(process.execPath,['--check','invoice/js/app.js'],{stdio:'inherit'});
execFileSync(process.execPath,['--check','invoice/sw.js'],{stdio:'inherit'});
console.log('PASS invoice JavaScript syntax');
console.log('BNC backup validation complete');
