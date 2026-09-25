# BNC AgroCare — Backup Mirror

The canonical project source is:

https://github.com/Tamasrazim/tamasrazim.github.io/tree/main/projects/bncagrocare/

This repository is the backup/deployment mirror.

Canonical workflow:
Edit in the Tamasrazim main repository → verify → mirror to this backup repository.

## Invoice source hierarchy

BNCFINAL.xlsx → addProductRow.js → products.js → Invoice Studio → immutable invoice.pdf

- BNCFINAL.xlsx is the main invoice-sheet reference.
- addProductRow.js defines how a product row is inserted and how formulas/SL numbering are rebalanced.
- products.js is the shared product + pack-size catalogue.
- Invoice Studio prepares data and generates a new PDF.
- invoice.pdf is the locked document master and must never be modified or replaced.