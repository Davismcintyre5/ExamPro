const XLSX = require('xlsx');

const buildXLSX = (headers, rows, sheetName = 'Sheet1') => {
  const data = rows.map((row) => {
    const obj = {};
    headers.forEach((h) => {
      obj[h.label] = row[h.key] ?? '';
    });
    return obj;
  });

  const worksheet = XLSX.utils.json_to_sheet(data, {
    header: headers.map((h) => h.label),
  });

  worksheet['!cols'] = headers.map((h) => ({
    wch: Math.max(h.label.length + 4, 18),
  }));

  const range = XLSX.utils.decode_range(worksheet['!ref']);
  for (let col = range.s.c; col <= range.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
    if (!worksheet[cellAddress]) continue;
    worksheet[cellAddress].s = {
      font: { bold: true },
      fill: { fgColor: { rgb: 'E5E7EB' } },
      alignment: { horizontal: 'left', vertical: 'center' },
    };
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
};

module.exports = {
  buildXLSX,
};