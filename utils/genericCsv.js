const escapeCSV = (value) => {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const buildCSV = (headers, rows) => {
  const headerLine = headers.map((h) => escapeCSV(h.label)).join(',');
  const dataLines = rows.map((row) =>
    headers.map((h) => escapeCSV(row[h.key])).join(',')
  );
  return [headerLine, ...dataLines].join('\n');
};

module.exports = { escapeCSV, buildCSV };