const XLSX = require('xlsx');

const parseXLSX = (buffer) => {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  const raw = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  return raw.map((row) => {
    const normalized = {};
    Object.keys(row).forEach((key) => {
      normalized[key.toLowerCase().trim().replace(/\s+/g, '_')] = String(row[key]).trim();
    });
    return normalized;
  });
};

const buildXLSX = (headers, rows, sheetName = 'Sheet1') => {
  const data = rows.map((row) => {
    const obj = {};
    headers.forEach((h) => {
      obj[h.label] = row[h.key] ?? '';
    });
    return obj;
  });

  const worksheet = XLSX.utils.json_to_sheet(data);

  worksheet['!cols'] = headers.map((h) => ({
    wch: Math.max(h.label.length + 4, 20)
  }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
};

module.exports = {
  parseXLSX,
  buildXLSX
};