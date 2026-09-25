// Requires ExcelJS in the browser:
// <script src="https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js"></script>
//
// Real Excel (and the VBA macro) recalculates every formula automatically the
// moment you insert a row. ExcelJS is just a file-format library — it has no
// calculation engine — so after splicing in the new row, every formula that
// lives at or below the insertion point has to be re-pointed by hand. That's
// the one real difference from the VBA version: everything from step 2 onward
// exists purely to replace what Excel would normally do for free.

async function addProductRow(file) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await file.arrayBuffer());
  const ws = workbook.getWorksheet('01');

  // 1. Find the "ST" subtotal row (marks the end of the item list)
  let stRow = null;
  ws.eachRow((row, rowNumber) => {
    if (stRow === null && row.getCell('B').value === 'ST') stRow = rowNumber;
  });
  if (!stRow) throw new Error('Could not find the "ST" row');

  // 2. Bump every formula reference at or below stRow by +1, BEFORE inserting —
  //    the row numbers written inside formula text are about to go stale.
  const bump = (formula) =>
    formula.replace(/([A-Z]+)(\d+)/g, (whole, col, row) => {
      const r = parseInt(row, 10);
      return r >= stRow ? `${col}${r + 1}` : whole;
    });

  for (let r = stRow; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    for (let c = 1; c <= 15; c++) {
      const cell = row.getCell(c);
      if (cell.formula) cell.value = { formula: bump(cell.formula) };
    }
  }

  // 3. Insert the new blank row at stRow — pushes "ST" and everything below down by 1
  ws.spliceRows(stRow, 0, []);

  // 4. Copy formatting from the row above into the new blank row
  const aboveRow = ws.getRow(stRow - 1);
  const newRow = ws.getRow(stRow);
  for (let c = 1; c <= 12; c++) {
    newRow.getCell(c).style = { ...aboveRow.getCell(c).style };
  }
  newRow.height = aboveRow.height;

  // 5. Extend the three "ST" SUM ranges so they include the new row
  const newStRow = stRow + 1;
  ['D', 'F', 'L'].forEach((col) => {
    ws.getCell(`${col}${newStRow}`).value = { formula: `SUM(${col}11:${col}${stRow})` };
  });

  // 6. Renumber SL columns so left/right stay balanced (1..N left, N+1..2N right)
  const totalRows = stRow - 11 + 1;
  for (let i = 0; i < totalRows; i++) {
    ws.getCell(`A${11 + i}`).value = i + 1;
    ws.getCell(`G${11 + i}`).value = totalRows + i + 1;
  }

  const out = await workbook.xlsx.writeBuffer();
  return new Blob([out], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

// Example wiring to a file input + download:
//
// document.getElementById('addRowBtn').addEventListener('click', async () => {
//   const file = document.getElementById('sheetInput').files[0];
//   const blob = await addProductRow(file);
//   const a = document.createElement('a');
//   a.href = URL.createObjectURL(blob);
//   a.download = 'invoice.xlsx';
//   a.click();
// });
