const PDFDocument = require('pdfkit');
const axios = require('axios');
const XLSX = require('xlsx');
const Class = require('../models/Class');
const Student = require('../models/Student');
const Score = require('../models/Score');
const Settings = require('../models/Settings');
const { buildCSV } = require('../utils/csvParser');

const calculateUnitResults = (cls, studentScores, settings) => {
  const grades = settings?.grades?.length
    ? settings.grades
    : [
        { name: 'Mastery', minScore: 80, maxScore: 100 },
        { name: 'Proficient', minScore: 70, maxScore: 79 },
        { name: 'Competent', minScore: 50, maxScore: 69 },
        { name: 'Not Yet Competent', minScore: 0, maxScore: 49 },
      ];
  const passMark = settings?.passMark || 50;

  const getGrade = (score) => {
    if (score === null || score === undefined) return null;
    for (const g of grades) {
      if (score >= g.minScore && score <= g.maxScore) return g.name;
    }
    return 'Not Yet Competent';
  };

  const unitResults = (cls.units || []).map((unit) => {
    const unitScores = studentScores.filter(
      (s) => s.unitId.toString() === unit._id.toString()
    );

    if (unitScores.length === 0) {
      return {
        unitId: unit._id,
        unitName: unit.name,
        unitCode: unit.code,
        average: null,
        grade: null,
        missing: true,
      };
    }

    const sum = unitScores.reduce((a, s) => a + s.score, 0);
    const average = Math.round(sum / unitScores.length);
    const isNYC = average < passMark;

    return {
      unitId: unit._id,
      unitName: unit.name,
      unitCode: unit.code,
      average,
      grade: isNYC ? 'Not Yet Competent' : getGrade(average),
      missing: false,
    };
  });

  const valid = unitResults.filter((u) => !u.missing);
  const hasNYC = unitResults.some(
    (u) => u.missing || u.grade === 'Not Yet Competent'
  );

  const overallAverage =
    valid.length > 0
      ? Math.round(valid.reduce((a, u) => a + u.average, 0) / valid.length)
      : null;

  const overallGrade = hasNYC
    ? 'Not Yet Competent'
    : overallAverage !== null
      ? getGrade(overallAverage)
      : null;

  return { unitResults, overallAverage, overallGrade };
};

const getClassReport = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { classId } = req.params;

    const cls = await Class.findOne({ _id: classId, adminId: tenantId }).populate(
      'departmentId',
      'name code'
    );
    if (!cls) return res.status(404).json({ message: 'Class not found' });

    const students = await Student.find({
      classId,
      adminId: tenantId,
      isActive: true,
    }).sort({ fullName: 1 });

    const scores = await Score.find({ classId, adminId: tenantId });
    const settings = await Settings.findOne({ adminId: tenantId });

    const studentReports = students.map((student) => {
      const studentScores = scores.filter(
        (s) => s.studentId.toString() === student._id.toString()
      );
      const results = calculateUnitResults(cls, studentScores, settings);
      return {
        student,
        unitResults: results.unitResults,
        overallAverage: results.overallAverage,
        overallGrade: results.overallGrade,
      };
    });

    res.json({ class: cls, settings, studentReports });
  } catch (error) {
    console.error('Get class report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getStudentReport = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { studentId } = req.params;

    const student = await Student.findOne({
      _id: studentId,
      adminId: tenantId,
    }).populate('classId');
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const cls = await Class.findById(student.classId._id).populate(
      'departmentId',
      'name code'
    );
    const scores = await Score.find({ studentId: student._id, adminId: tenantId });
    const settings = await Settings.findOne({ adminId: tenantId });

    const results = calculateUnitResults(cls, scores, settings);

    res.json({
      student,
      class: cls,
      settings,
      unitResults: results.unitResults,
      overallAverage: results.overallAverage,
      overallGrade: results.overallGrade,
    });
  } catch (error) {
    console.error('Get student report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getMissingMarks = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { classId } = req.params;

    const cls = await Class.findOne({ _id: classId, adminId: tenantId }).populate(
      'departmentId',
      'name code'
    );
    if (!cls) return res.status(404).json({ message: 'Class not found' });

    const students = await Student.find({
      classId,
      adminId: tenantId,
      isActive: true,
    }).sort({ fullName: 1 });

    const scores = await Score.find({ classId, adminId: tenantId });

    const missing = students.map((student) => {
      const studentScores = scores.filter(
        (s) => s.studentId.toString() === student._id.toString()
      );
      const missingEntries = [];

      (cls.units || []).forEach((unit) => {
        const unitScores = studentScores.filter(
          (s) => s.unitId.toString() === unit._id.toString()
        );
        const expected = [];
        for (let i = 1; i <= (unit.formativeCount || 3); i++) expected.push(i);
        const missingFormatives = expected.filter(
          (fn) => !unitScores.some((s) => s.formativeNumber === fn)
        );
        if (missingFormatives.length > 0) {
          missingEntries.push({
            unitId: unit._id,
            unitName: unit.name,
            unitCode: unit.code,
            missingFormatives,
          });
        }
      });

      return { student, missing: missingEntries };
    });

    const studentsWithMissing = missing.filter((m) => m.missing.length > 0);

    res.json({
      class: cls,
      totalStudents: students.length,
      missingCount: studentsWithMissing.length,
      report: studentsWithMissing,
    });
  } catch (error) {
    console.error('Get missing marks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const fetchImageBuffer = async (url) => {
  if (!url) return null;
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 15000,
      maxRedirects: 5,
    });
    return Buffer.from(response.data);
  } catch (error) {
    console.error('fetchImageBuffer failed:', error.message);
    return null;
  }
};

const buildReportPDF = async ({ settings, title, meta, headers, rows }) => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 0 });
      const chunks = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;
      const marginLeft = 30;
      const marginRight = 30;
      const contentWidth = pageWidth - marginLeft - marginRight;

      let contentTop = 30;
      let letterheadRendered = false;

      if (settings?.letterhead) {
        const imgBuffer = await fetchImageBuffer(settings.letterhead);
        if (imgBuffer) {
          try {
            const img = doc.openImage(imgBuffer);
            const scale = pageWidth / img.width;
            const renderedHeight = img.height * scale;
            doc.image(imgBuffer, 0, 0, {
              width: pageWidth,
              height: renderedHeight,
            });
            contentTop = renderedHeight + (settings.printMarginTop || 8) * 2.83465;
            letterheadRendered = true;
          } catch (err) {
            console.error('Failed to place letterhead:', err.message);
          }
        }
      }

      if (!letterheadRendered) {
        doc.fontSize(16).font('Helvetica-Bold').fillColor('#000');
        doc.text(settings?.schoolName || '', marginLeft, contentTop, {
          width: contentWidth,
          align: 'center',
        });
        contentTop = doc.y + 6;

        if (settings?.motto) {
          doc.fontSize(9).font('Helvetica-Oblique').fillColor('#555');
          doc.text(`"${settings.motto}"`, marginLeft, contentTop, {
            width: contentWidth,
            align: 'center',
          });
          contentTop = doc.y + 4;
        }

        const parts = [];
        if (settings?.address) parts.push(settings.address);
        if (settings?.city) parts.push(settings.city);
        if (settings?.phone) parts.push(`Tel: ${settings.phone}`);
        if (parts.length > 0) {
          doc.fontSize(8).font('Helvetica').fillColor('#666');
          doc.text(parts.join(' | '), marginLeft, contentTop, {
            width: contentWidth,
            align: 'center',
          });
          contentTop = doc.y + 6;
        }

        doc
          .strokeColor('#333')
          .lineWidth(1)
          .moveTo(marginLeft, contentTop)
          .lineTo(pageWidth - marginRight, contentTop)
          .stroke();
        contentTop += 10;
      }

      doc.fillColor('#000').fontSize(13).font('Helvetica-Bold');
      doc.text(title, marginLeft, contentTop, {
        width: contentWidth,
        align: 'center',
      });
      contentTop = doc.y + 8;

      if (meta && meta.length > 0) {
        doc.fontSize(8).font('Helvetica').fillColor('#333');
        const metaLine = meta.map((m) => `${m.label}: ${m.value}`).join('   |   ');
        doc.text(metaLine, marginLeft, contentTop, {
          width: contentWidth,
          align: 'center',
        });
        contentTop = doc.y + 12;
      }

      const headerRowHeight = 22;
      const rowHeight = 20;
      const colCount = headers.length;
      const colWidth = contentWidth / colCount;

      const drawTableHeader = () => {
        const y = contentTop;

        doc.rect(marginLeft, y, contentWidth, headerRowHeight).fill('#e5e7eb');

        doc.fillColor('#000').fontSize(7.5).font('Helvetica-Bold');
        let x = marginLeft;
        headers.forEach((h) => {
          doc.text(h.label, x + 3, y + 7, {
            width: colWidth - 6,
            align: 'left',
            lineBreak: false,
            ellipsis: true,
          });
          x += colWidth;
        });

        doc
          .strokeColor('#333')
          .lineWidth(0.6)
          .rect(marginLeft, y, contentWidth, headerRowHeight)
          .stroke();

        contentTop = y + headerRowHeight;
      };

      drawTableHeader();

      rows.forEach((row, rowIdx) => {
        if (contentTop + rowHeight > pageHeight - 50) {
          doc.addPage();
          contentTop = 40;
          drawTableHeader();
        }

        const y = contentTop;
        const isAlt = rowIdx % 2 === 1;

        if (isAlt) {
          doc.rect(marginLeft, y, contentWidth, rowHeight).fill('#fafafa');
        }

        doc.fillColor('#111').fontSize(7.5).font('Helvetica');
        let x = marginLeft;
        headers.forEach((h) => {
          const val = row[h.key];
          doc.text(String(val ?? '-'), x + 3, y + 6, {
            width: colWidth - 6,
            align: 'left',
            lineBreak: false,
            ellipsis: true,
          });
          x += colWidth;
        });

        doc
          .strokeColor('#ddd')
          .lineWidth(0.3)
          .moveTo(marginLeft, y + rowHeight)
          .lineTo(pageWidth - marginRight, y + rowHeight)
          .stroke();

        let vx = marginLeft;
        doc.strokeColor('#ddd').lineWidth(0.3);
        for (let i = 0; i <= colCount; i++) {
          doc.moveTo(vx, y).lineTo(vx, y + rowHeight).stroke();
          vx += colWidth;
        }

        contentTop = y + rowHeight;
      });

      const tableHeight = rows.length * rowHeight + headerRowHeight;
      doc
        .strokeColor('#333')
        .lineWidth(0.6)
        .rect(
          marginLeft,
          contentTop - tableHeight,
          contentWidth,
          tableHeight
        )
        .stroke();

      doc.fontSize(7).font('Helvetica').fillColor('#888');
      doc.text(
        settings?.reportFooter ||
          `© ${new Date().getFullYear()} ${settings?.schoolName || ''}`,
        marginLeft,
        pageHeight - 30,
        { width: contentWidth, align: 'center' }
      );

      doc.end();
    } catch (err) {
      console.error('buildReportPDF error:', err);
      reject(err);
    }
  });
};

const downloadBlob = (res, buffer, format, baseName) => {
  const mimeTypes = {
    csv: 'text/csv; charset=utf-8',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    pdf: 'application/pdf',
  };
  res.setHeader('Content-Type', mimeTypes[format]);
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${baseName}.${format}"`
  );
  res.send(buffer);
};

const buildXLSXBuffer = (headers, rows, sheetName) => {
  const data = rows.map((r) => {
    const obj = {};
    headers.forEach((h) => {
      obj[h.label] = r[h.key] ?? '';
    });
    return obj;
  });

  const worksheet = XLSX.utils.json_to_sheet(data, {
    header: headers.map((h) => h.label),
  });
  worksheet['!cols'] = headers.map((h) => ({
    wch: Math.max(h.label.length + 4, 14),
  }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
};

const exportClassReport = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { classId } = req.params;
    const { format = 'csv' } = req.query;

    const cls = await Class.findOne({ _id: classId, adminId: tenantId }).populate(
      'departmentId',
      'name code'
    );
    if (!cls) return res.status(404).json({ message: 'Class not found' });

    const students = await Student.find({
      classId,
      adminId: tenantId,
      isActive: true,
    }).sort({ fullName: 1 });

    const scores = await Score.find({ classId, adminId: tenantId });
    const settings = await Settings.findOne({ adminId: tenantId });

    const units = cls.units || [];

    const headers = [
      { key: 'no', label: 'No.' },
      { key: 'name', label: 'Student Name' },
      { key: 'admission', label: 'Admission No.' },
      ...units.map((u, i) => ({
        key: `unit_${i}`,
        label: `${u.name} (${u.code})`,
      })),
      { key: 'overall', label: 'Overall' },
      { key: 'grade', label: 'Grade' },
    ];

    const rows = students.map((student, idx) => {
      const studentScores = scores.filter(
        (s) => s.studentId.toString() === student._id.toString()
      );
      const results = calculateUnitResults(cls, studentScores, settings);

      const row = {
        no: idx + 1,
        name: student.fullName,
        admission: student.admissionNumber || '-',
        overall: results.overallAverage !== null ? results.overallAverage : '-',
        grade: results.overallGrade || '-',
      };

      units.forEach((unit, i) => {
        const ur = results.unitResults.find(
          (u) => u.unitId.toString() === unit._id.toString()
        );
        row[`unit_${i}`] = ur?.missing ? 'MISSING' : (ur?.average ?? '-');
      });

      return row;
    });

    const baseName = `class-report-${cls.className}-${new Date().toISOString().split('T')[0]}`.replace(
      /\s+/g,
      '-'
    );

    if (format === 'pdf') {
      const meta = [
        { label: 'Class', value: cls.className },
        { label: 'Department', value: cls.departmentId?.name || '' },
      ];
      if (cls.level) meta.push({ label: 'Level', value: cls.level });
      meta.push({ label: 'Date', value: new Date().toLocaleDateString() });

      const buffer = await buildReportPDF({
        settings,
        title: 'Class Performance Report',
        meta,
        headers,
        rows,
      });
      return downloadBlob(res, buffer, 'pdf', baseName);
    }

    if (format === 'xlsx') {
      const buffer = buildXLSXBuffer(headers, rows, 'Class Report');
      return downloadBlob(res, buffer, 'xlsx', baseName);
    }

    const csv = buildCSV(headers, rows);
    return downloadBlob(res, Buffer.from(csv, 'utf-8'), 'csv', baseName);
  } catch (error) {
    console.error('Export class report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const exportMissingReport = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { classId } = req.params;
    const { format = 'csv' } = req.query;

    const cls = await Class.findOne({ _id: classId, adminId: tenantId }).populate(
      'departmentId',
      'name code'
    );
    if (!cls) return res.status(404).json({ message: 'Class not found' });

    const students = await Student.find({
      classId,
      adminId: tenantId,
      isActive: true,
    }).sort({ fullName: 1 });

    const scores = await Score.find({ classId, adminId: tenantId });
    const settings = await Settings.findOne({ adminId: tenantId });

    const headers = [
      { key: 'no', label: 'No.' },
      { key: 'name', label: 'Student Name' },
      { key: 'admission', label: 'Admission No.' },
      { key: 'missing', label: 'Missing Marks' },
    ];

    const rows = [];
    students.forEach((student) => {
      const studentScores = scores.filter(
        (s) => s.studentId.toString() === student._id.toString()
      );
      const missingList = [];

      (cls.units || []).forEach((unit) => {
        const unitScores = studentScores.filter(
          (s) => s.unitId.toString() === unit._id.toString()
        );
        const expected = [];
        for (let i = 1; i <= (unit.formativeCount || 3); i++) expected.push(i);
        const missingFormatives = expected.filter(
          (fn) => !unitScores.some((s) => s.formativeNumber === fn)
        );
        if (missingFormatives.length > 0) {
          missingList.push(
            `${unit.name} (${unit.code}): F${missingFormatives.join(', F')}`
          );
        }
      });

      if (missingList.length > 0) {
        rows.push({
          no: rows.length + 1,
          name: student.fullName,
          admission: student.admissionNumber || '-',
          missing: missingList.join(' | '),
        });
      }
    });

    const baseName = `missing-marks-${cls.className}-${new Date().toISOString().split('T')[0]}`.replace(
      /\s+/g,
      '-'
    );

    if (format === 'pdf') {
      const meta = [
        { label: 'Class', value: cls.className },
        { label: 'Department', value: cls.departmentId?.name || '' },
        { label: 'Date', value: new Date().toLocaleDateString() },
      ];

      const buffer = await buildReportPDF({
        settings,
        title: 'Missing Marks Report',
        meta,
        headers,
        rows,
      });
      return downloadBlob(res, buffer, 'pdf', baseName);
    }

    if (format === 'xlsx') {
      const buffer = buildXLSXBuffer(headers, rows, 'Missing Marks');
      return downloadBlob(res, buffer, 'xlsx', baseName);
    }

    const csv = buildCSV(headers, rows);
    return downloadBlob(res, Buffer.from(csv, 'utf-8'), 'csv', baseName);
  } catch (error) {
    console.error('Export missing report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getClassReport,
  getStudentReport,
  getMissingMarks,
  exportClassReport,
  exportMissingReport,
};