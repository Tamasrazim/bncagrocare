# BNC AgroCare — Backup Mirror

The canonical project source is:

Tamasrazim/tamasrazim.github.io / projects/bncagrocare/

This repository is the backup/deployment mirror.

Canonical workflow:

Edit in the Tamasrazim main repository → verify → mirror to this backup repository.

## Invoice source hierarchy

BNCFINAL.xlsx → addProductRow.js → products.js → Invoice Studio → latest XLSX

- BNCFINAL.xlsx is the main invoice-sheet reference.
- addProductRow.js defines how a product row is inserted and how formulas/SL numbering are rebalanced.
- products.js is the shared product + pack-size catalogue.
- Invoice Studio works on a live XLSX workbook, previews the current Sheet 01 state, and downloads the latest edited XLSX.
- The Studio does not generate PDF output.
- Any existing invoice.pdf is an archived reference and must not be modified or replaced.

## Branding

- FB_IMG_1789811599210.jpg — BNC logo.
- FB_IMG_1789811611633.jpg — BNC cover.
