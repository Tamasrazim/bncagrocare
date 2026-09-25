import fs from "node:fs";
import { execFileSync } from "node:child_process";

const root = fs.existsSync("projects/bncagrocare") ? "projects/bncagrocare" : ".";
const read = (p) => fs.readFileSync(root + "/" + p, "utf8");
const must = (ok, msg) => {
  if (!ok) throw new Error(msg);
  console.log("PASS", msg);
};

for (const p of [
  "index.html",
  "README.md",
  "invoice.pdf",
  "reference/BNCFINAL.xlsx",
  "reference/addProductRow.js",
  "reference/products.js",
  "invoice/index.html",
  "invoice/css/app.css",
  "invoice/js/app.js",
  "invoice/sw.js",
  "invoice/manifest.webmanifest",
  "invoice/icons/icon.svg"
]) must(fs.existsSync(root + "/" + p), p + " exists");

const pdfSha = execFileSync("git", ["ls-tree", "-r", "HEAD", "--", root + "/invoice.pdf"], {encoding:"utf8"}).trim().split(/\s+/)[2];
must(pdfSha === "46c9ce8303a0a4abdf7599ba1479b298c26fc6fe", "immutable invoice.pdf SHA matches");

const xlsxSha = execFileSync("git", ["ls-tree", "-r", "HEAD", "--", root + "/reference/BNCFINAL.xlsx"], {encoding:"utf8"}).trim().split(/\s+/)[2];
must(xlsxSha === "f705ea96084e0c9777effd400744a7f7d94cba69", "BNCFINAL.xlsx SHA matches canonical sheet");

const site = read("index.html");
must(site.includes("BNC Agro Care"), "public page identifies BNC Agro Care");
must(site.includes('href="./invoice/"'), "public page links to Invoice Studio");
must(site.includes('src="./reference/products.js"'), "public page loads shared product data");

const invoice = read("invoice/index.html");
must(invoice.includes('src="../reference/products.js"'), "Invoice Studio loads shared product data");
must(invoice.includes("BNCFINAL.xlsx"), "Invoice Studio identifies canonical sheet");
must(invoice.includes("invoice.pdf"), "Invoice Studio identifies locked PDF master");
must(!invoice.includes("<iframe"), "Invoice Studio has no browser PDF iframe");

const js = read("invoice/js/app.js");
must(js.includes("window.BNC_PRODUCTS"), "invoice products come from shared reference");
must(js.includes("ROWS_PER_SIDE=4"), "invoice base geometry is 4 rows per side");
must(js.includes("FIRST_PAGE_EXTRA_ROWS=2"), "invoice allows two first-page extra rows");
must(js.includes('TEMPLATE="../invoice.pdf"'), "invoice uses locked PDF template");
must(js.includes("async function generate"), "single PDF generation path exists");
must(js.includes("useObjectStreams:false"), "generated PDF saves with compatible object streams");
must(!js.includes("form.flatten"), "invoice does not flatten the source form");
must(!js.includes("pdfjs-dist"), "invoice has no PDF.js dependency");
execFileSync(process.execPath, ["--check", root + "/invoice/js/app.js"], {stdio:"inherit"});

const products = read("reference/products.js");
must((products.match(/name:/g) || []).length === 10, "shared reference contains 10 product entries");

const addRule = read("reference/addProductRow.js");
must(addRule.includes('getCell("B").value === "ST"'), "row rule finds ST subtotal row");
must(addRule.includes("ws.spliceRows(stRow, 0, [])"), "row rule inserts before ST");
must(addRule.includes('["D", "F", "L"]'), "row rule extends ST formula columns");
must(addRule.includes('getCell("A"'), "row rule renumbers left SL");
must(addRule.includes('getCell("G"'), "row rule renumbers right SL");

const manifest = JSON.parse(read("invoice/manifest.webmanifest"));
must(manifest.start_url === "./" && manifest.scope === "./", "PWA paths are relative");
must(Array.isArray(manifest.icons) && manifest.icons.length > 0, "PWA icon exists");

const sw = read("invoice/sw.js");
must(/bnc-invoice-v\d+/.test(sw), "service worker cache is versioned");
must(sw.includes("bnc-invoice-v48"), "service worker cache is v48");
must(sw.includes("invoice.pdf"), "service worker precaches invoice.pdf");
must(sw.includes("caches.match(FALLBACK)"), "service worker has offline navigation fallback");
execFileSync(process.execPath, ["--check", root + "/invoice/sw.js"], {stdio:"inherit"});

console.log("BNC validation complete");
