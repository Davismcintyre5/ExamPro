const Score = require('../models/Score');
const Class = require('../models/Class');
const Student = require('../models/Student');
const Settings = require('../models/Settings');
const { buildCSV } = require('../utils/genericCsv');
const { buildXLSX } = require('../utils/genericXlsx');
const { buildTablePDF } = require('../utils/genericPdf');
const { parseFileBuffer, normalizeMarkRows } = require('../utils/fileImporter');

const getScoresByClass = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const scores = await Score.find({ classId: req.params.classId, adminId: tenantId })
      .populate('studentId', 'fullName admissionNumber')
      .sort({ unitId: 1, formativeNumber: 1 });
    res.json(scores);
  } catch (error) {
    console.error('Get scores by class error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getScoresByUnit = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const scores = await Score.find({ unitId: req.params.unitId, adminId: tenantId })
      .populate('studentId', 'fullName admissionNumber')
      .sort({ formativeNumber: 1 });
    res.json(scores);
  } catch (error) {
    console.error('Get scores by unit error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getScoresByStudent = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const scores = await Score.find({ studentId: req.params.studentId, adminId: tenantId })
      .populate('classId', 'className')
      .sort({ createdAt: -1 });
    res.json(scores);
  } catch (error) {
    console.error('Get scores by student error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const saveBulkScores = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { classId, unitId, scores } = req.body;

    if (!classId) return res.status(400).json({ message: 'Class ID required' });
    if (!unitId) return res.status(400).json({ message: 'Unit ID required' });
    if (!Array.isArray(scores) || scores.length === 0) {
      return res.status(400).json({ message: 'No scores provided' });
    }

    const cls = await Class.findOne({ _id: classId, adminId: tenantId });
    if (!cls) return res.status(404).json({ message: 'Class not found' });

    const unitExists = cls.units.some((u) => u._id.toString() === unitId.toString());
    if (!unitExists) return res.status(404).json({ message: 'Unit not found in class' });

    const results = [];
    const errors = [];

    for (const scoreData of scores) {
      try {
        const { studentId, formativeNumber, score } = scoreData;
        const num = Number(score);

        if (isNaN(num) || num < 0 || num > 100) {
          errors.push({ studentId, formativeNumber, message: 'Score must be 0-100' });
          continue;
        }
        if (![1, 2, 3, 4].includes(formativeNumber)) {
          errors.push({ studentId, message: 'Invalid formative number' });
          continue;
        }

        let existing = await Score.findOne({ studentId, classId, unitId, formativeNumber, adminId: tenantId });

        if (existing) {
          if (existing.locked) {
            errors.push({ studentId, formativeNumber, message: 'Locked' });
            continue;
          }
          existing.score = num;
          await existing.save();
          results.push(existing);
        } else {
          const newScore = new Score({
            adminId: tenantId,
            studentId,
            classId,
            unitId,
            formativeNumber,
            score: num,
            locked: true,
            lockedAt: new Date(),
            lockedBy: req.userId
          });
          await newScore.save();
          results.push(newScore);
        }
      } catch (error) {
        errors.push({ scoreData, message: error.message });
      }
    }

    res.status(201).json({
      saved: results,
      errors,
      totalSaved: results.length,
      totalErrors: errors.length
    });
  } catch (error) {
    console.error('Save bulk scores error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const pasteScores = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { classId, unitId, rows } = req.body;

    if (!classId || !unitId) return res.status(400).json({ message: 'Class and unit required' });
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ message: 'No rows provided' });
    }

    const cls = await Class.findOne({ _id: classId, adminId: tenantId });
    if (!cls) return res.status(404).json({ message: 'Class not found' });

    const unit = cls.units.id(unitId);
    if (!unit) return res.status(404).json({ message: 'Unit not found' });

    const results = [];
    const errors = [];

    for (const row of rows) {
      try {
        const { admissionNumber, scores } = row;

        if (!admissionNumber) {
          errors.push({ admissionNumber, message: 'Admission number required' });
          continue;
        }

        const student = await Student.findOne({ admissionNumber, classId, adminId: tenantId, isActive: true });
        if (!student) {
          errors.push({ admissionNumber, message: 'Student not found in this class' });
          continue;
        }

        for (const s of scores) {
          const num = Number(s.score);
          if (isNaN(num) || num < 0 || num > 100) continue;

          let existing = await Score.findOne({
            studentId: student._id,
            classId,
            unitId,
            formativeNumber: s.formativeNumber,
            adminId: tenantId
          });

          if (existing) {
            if (existing.locked) continue;
            existing.score = num;
            await existing.save();
            results.push(existing);
          } else {
            const newScore = new Score({
              adminId: tenantId,
              studentId: student._id,
              classId,
              unitId,
              formativeNumber: s.formativeNumber,
              score: num,
              locked: true,
              lockedAt: new Date(),
              lockedBy: req.userId
            });
            await newScore.save();
            results.push(newScore);
          }
        }
      } catch (error) {
        errors.push({ admissionNumber: row.admissionNumber, message: error.message });
      }
    }

    res.status(201).json({
      saved: results,
      errors,
      totalSaved: results.length,
      totalErrors: errors.length
    });
  } catch (error) {
    console.error('Paste scores error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const importScores = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { classId, unitId } = req.body;

    if (!req.file || !req.file.buffer) return res.status(400).json({ message: 'No file' });
    if (!classId || !unitId) return res.status(400).json({ message: 'Class and unit required' });

    const cls = await Class.findOne({ _id: classId, adminId: tenantId });
    if (!cls) return res.status(404).json({ message: 'Class not found' });

    const unit = cls.units.id(unitId);
    if (!unit) return res.status(404).json({ message: 'Unit not found' });

    let rawRows;
    try {
      rawRows = parseFileBuffer(req.file.buffer, req.file.mimetype, req.file.originalname);
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }

    const rows = normalizeMarkRows(rawRows).filter((r) => r.admissionNumber);
    if (rows.length === 0) return res.status(400).json({ message: 'No valid rows' });

    const results = [];
    const skipped = [];

    for (const row of rows) {
      const student = await Student.findOne({
        admissionNumber: row.admissionNumber,
        classId,
        adminId: tenantId,
        isActive: true
      });

      if (!student) {
        skipped.push({ admissionNumber: row.admissionNumber, reason: 'Student not found' });
        continue;
      }

      for (const s of row.scores) {
        const num = Number(s.score);
        if (isNaN(num) || num < 0 || num > 100) continue;

        let existing = await Score.findOne({
          studentId: student._id,
          classId,
          unitId,
          formativeNumber: s.formativeNumber,
          adminId: tenantId
        });

        if (existing) {
          if (existing.locked) continue;
          existing.score = num;
          await existing.save();
          results.push(existing);
        } else {
          const newScore = new Score({
            adminId: tenantId,
            studentId: student._id,
            classId,
            unitId,
            formativeNumber: s.formativeNumber,
            score: num,
            locked: true,
            lockedAt: new Date(),
            lockedBy: req.userId
          });
          await newScore.save();
          results.push(newScore);
        }
      }
    }

    res.status(201).json({
      message: 'Import complete',
      saved: results.length,
      skipped: skipped.length,
      skippedRows: skipped
    });
  } catch (error) {
    console.error('Import scores error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const exportScores = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { classId, unitId, format = 'csv' } = req.query;

    if (!classId || !unitId) return res.status(400).json({ message: 'Class and unit required' });

    const cls = await Class.findOne({ _id: classId, adminId: tenantId }).populate('courseId', 'name');
    if (!cls) return res.status(404).json({ message: 'Class not found' });

    const unit = cls.units.id(unitId);
    if (!unit) return res.status(404).json({ message: 'Unit not found' });

    const students = await Student.find({ classId, adminId: tenantId, isActive: true }).sort({ fullName: 1 });
    const scores = await Score.find({ classId, unitId, adminId: tenantId });

    const headers = [
      { key: 'no', label: 'No.' },
      { key: 'admissionNumber', label: 'Admission No' },
      { key: 'fullName', label: 'Student Name' }
    ];

    for (let i = 1; i <= unit.formativeCount; i++) {
      headers.push({ key: `f${i}`, label: `Formative ${i}` });
    }
    headers.push({ key: 'average', label: 'Average' });

    const rows = students.map((student, idx) => {
      const studentScores = scores.filter((s) => s.studentId.toString() === student._id.toString());
      const row = {
        no: idx + 1,
        admissionNumber: student.admissionNumber,
        fullName: student.fullName
      };
      const values = [];
      for (let i = 1; i <= unit.formativeCount; i++) {
        const s = studentScores.find((x) => x.formativeNumber === i);
        const val = s ? s.score : '';
        row[`f${i}`] = val;
        if (val !== '') values.push(Number(val));
      }
      row.average = values.length > 0 ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : '';
      return row;
    });

    const dateStamp = new Date().toISOString().split('T')[0];
    const baseName = `marks-${cls.className}-${unit.code}-${dateStamp}`.replace(/[^a-z0-9-]/gi, '-');

    if (format === 'xlsx') {
      const buffer = buildXLSX(headers, rows, 'Marks');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${baseName}.xlsx"`);
      return res.send(buffer);
    }

    if (format === 'pdf') {
      const settings = await Settings.findOne({ adminId: tenantId });
      const meta = [
        { label: 'Class', value: cls.className },
        { label: 'Course', value: cls.courseId?.name || '' },
        { label: 'Unit', value: `${unit.name} (${unit.code})` },
        { label: 'Date', value: new Date().toLocaleDateString() }
      ];
      const buffer = await buildTablePDF({
        settings,
        title: 'Marks Sheet',
        meta,
        headers,
        rows
      });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${baseName}.pdf"`);
      return res.send(buffer);
    }

    const csv = buildCSV(headers, rows);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${baseName}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('Export scores error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const unlockScores = async (req, res) => {
  try {
    const tenantId = req.tenantId;

    if (!req.isOwner) {
      return res.status(403).json({ message: 'Only the account owner can unlock scores' });
    }

    const { classId, unitId } = req.body;
    if (!classId || !unitId) return res.status(400).json({ message: 'Class and unit required' });

    const result = await Score.updateMany(
      { classId, unitId, adminId: tenantId, locked: true },
      { $set: { locked: false, lockedAt: null, lockedBy: null } }
    );

    res.json({ message: 'Scores unlocked', unlocked: result.modifiedCount });
  } catch (error) {
    console.error('Unlock scores error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateScore = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { score } = req.body;

    const existing = await Score.findOne({ _id: req.params.id, adminId: tenantId });
    if (!existing) return res.status(404).json({ message: 'Score not found' });

    if (existing.locked && !req.isOwner) {
      return res.status(403).json({ message: 'Score is locked' });
    }

    const num = Number(score);
    if (isNaN(num) || num < 0 || num > 100) {
      return res.status(400).json({ message: 'Score must be 0-100' });
    }

    existing.score = num;
    await existing.save();
    res.json(existing);
  } catch (error) {
    console.error('Update score error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteScore = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const score = await Score.findOne({ _id: req.params.id, adminId: tenantId });
    if (!score) return res.status(404).json({ message: 'Score not found' });

    if (score.locked && !req.isOwner) {
      return res.status(403).json({ message: 'Score is locked' });
    }

    await score.deleteOne();
    res.json({ message: 'Score deleted successfully' });
  } catch (error) {
    console.error('Delete score error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getScoresByClass,
  getScoresByUnit,
  getScoresByStudent,
  saveBulkScores,
  pasteScores,
  importScores,
  exportScores,
  unlockScores,
  updateScore,
  deleteScore
};