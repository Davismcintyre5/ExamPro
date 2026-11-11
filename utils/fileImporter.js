const { parseXLSX } = require('./genericXlsx');

const parseCSVText = (text) => {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];

  const splitLine = (line) => {
    const result = [];
    let current = '';
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (insideQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === ',' && !insideQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = splitLine(lines[0]).map((h) => h.toLowerCase().trim().replace(/\s+/g, '_'));

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = splitLine(lines[i]);
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    rows.push(row);
  }

  return rows;
};

const parseFileBuffer = (buffer, mimetype, originalname) => {
  const name = (originalname || '').toLowerCase();

  if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
    return parseXLSX(buffer);
  }

  if (name.endsWith('.csv') || mimetype === 'text/csv') {
    const text = buffer.toString('utf-8');
    return parseCSVText(text);
  }

  throw new Error('Unsupported file type. Use .csv or .xlsx');
};

const normalizeStudentRows = (rows) => {
  return rows.map((row) => ({
    admissionNumber: (row.admission_number || row.admissionnumber || row.admission_no || '').trim(),
    fullName: (row.full_name || row.fullname || row.name || '').trim(),
    phone: (row.phone || row.phone_number || row.mobile || '').trim(),
  }));
};

const normalizeCourseRows = (rows) => {
  return rows.map((row) => ({
    name: (row.name || row.course_name || '').trim(),
    code: (row.code || row.course_code || '').trim(),
  }));
};

const normalizeClassRows = (rows) => {
  return rows.map((row) => ({
    className: (row.class_name || row.classname || row.name || '').trim(),
    level: (row.level || '').trim(),
  }));
};

const normalizeUnitRows = (rows) => {
  return rows.map((row) => ({
    name: (row.name || row.unit_name || '').trim(),
    code: (row.code || row.unit_code || '').trim(),
    formativeCount: Number(row.formative_count || row.formativecount || 3),
  }));
};

const normalizeMarkRows = (rows) => {
  return rows.map((row) => {
    const admissionNumber = (row.admission_number || row.admissionnumber || row.admission_no || '').trim();
    const scores = [];
    for (let i = 1; i <= 4; i++) {
      const val = row[`f${i}`] || row[`formative${i}`] || row[`formative_${i}`];
      if (val !== undefined && val !== '') {
        scores.push({ formativeNumber: i, score: Number(val) });
      }
    }
    return { admissionNumber, scores };
  });
};

module.exports = {
  parseFileBuffer,
  normalizeStudentRows,
  normalizeCourseRows,
  normalizeClassRows,
  normalizeUnitRows,
  normalizeMarkRows,
};