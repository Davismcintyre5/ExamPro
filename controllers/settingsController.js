const Settings = require('../models/Settings');

const defaultAFGrades = [
  { name: 'A', minScore: 70, maxScore: 100, remark: 'Excellent' },
  { name: 'B', minScore: 60, maxScore: 69.99, remark: 'Good' },
  { name: 'C', minScore: 50, maxScore: 59.99, remark: 'Average' },
  { name: 'D', minScore: 40, maxScore: 49.99, remark: 'Below Average' },
  { name: 'F', minScore: 0, maxScore: 39.99, remark: 'Fail' }
];

const defaultCBCGrades = [
  { name: 'Exceeding Expectation', minScore: 80, maxScore: 100, remark: 'EE' },
  { name: 'Meeting Expectation', minScore: 60, maxScore: 79.99, remark: 'ME' },
  { name: 'Approaching Expectation', minScore: 40, maxScore: 59.99, remark: 'AE' },
  { name: 'Below Expectation', minScore: 0, maxScore: 39.99, remark: 'BE' }
];

const defaultMasteryGrades = [
  { name: 'Mastery', minScore: 80, maxScore: 100, remark: 'Mastery' },
  { name: 'Proficient', minScore: 70, maxScore: 79, remark: 'Proficient' },
  { name: 'Competent', minScore: 50, maxScore: 69, remark: 'Competent' },
  { name: 'Not Yet Competent', minScore: 0, maxScore: 49, remark: 'NYC' }
];

const getDefaultSettings = (adminId) => ({
  adminId,
  schoolName: 'My School',
  schoolCode: '',
  address: '',
  city: '',
  state: '',
  postalCode: '',
  country: '',
  phone: '',
  email: '',
  website: '',
  motto: 'Excellence in Education',
  logo: '',
  academicYear: new Date().getFullYear().toString(),
  term: 'Term 1',
  passMark: 50,
  reportFooter: '',
  gradingSystem: 'mastery',
  grades: defaultMasteryGrades,
  letterhead: '',
  letterheadHeight: 60,
  printMarginTop: 8,
  printMarginBottom: 15,
  paperSize: 'A4',
  orientation: 'portrait'
});

const getSettings = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    let settings = await Settings.findOne({ adminId: tenantId });

    if (!settings) {
      settings = new Settings(getDefaultSettings(tenantId));
      await settings.save();
    }

    res.json(settings);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateSettings = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const {
      schoolName,
      schoolCode,
      address,
      city,
      state,
      postalCode,
      country,
      phone,
      email,
      website,
      motto,
      logo,
      academicYear,
      term,
      passMark,
      reportFooter,
      letterhead,
      letterheadHeight,
      printMarginTop,
      printMarginBottom,
      paperSize,
      orientation
    } = req.body;

    let settings = await Settings.findOne({ adminId: tenantId });
    if (!settings) settings = new Settings(getDefaultSettings(tenantId));

    if (schoolName !== undefined) settings.schoolName = schoolName;
    if (schoolCode !== undefined) settings.schoolCode = schoolCode;
    if (address !== undefined) settings.address = address;
    if (city !== undefined) settings.city = city;
    if (state !== undefined) settings.state = state;
    if (postalCode !== undefined) settings.postalCode = postalCode;
    if (country !== undefined) settings.country = country;
    if (phone !== undefined) settings.phone = phone;
    if (email !== undefined) settings.email = email;
    if (website !== undefined) settings.website = website;
    if (motto !== undefined) settings.motto = motto;
    if (logo !== undefined) settings.logo = logo;
    if (academicYear !== undefined) settings.academicYear = academicYear;
    if (term !== undefined) settings.term = term;
    if (passMark !== undefined) settings.passMark = passMark;
    if (reportFooter !== undefined) settings.reportFooter = reportFooter;
    if (letterhead !== undefined) settings.letterhead = letterhead;
    if (letterheadHeight !== undefined) settings.letterheadHeight = letterheadHeight;
    if (printMarginTop !== undefined) settings.printMarginTop = printMarginTop;
    if (printMarginBottom !== undefined) settings.printMarginBottom = printMarginBottom;
    if (paperSize !== undefined) settings.paperSize = paperSize;
    if (orientation !== undefined) settings.orientation = orientation;

    await settings.save();
    res.json(settings);
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateGradingSystem = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { gradingSystem, passMark } = req.body;

    let settings = await Settings.findOne({ adminId: tenantId });
    if (!settings) settings = new Settings(getDefaultSettings(tenantId));

    if (gradingSystem) {
      settings.gradingSystem = gradingSystem;

      if (gradingSystem === 'af') {
        settings.grades = defaultAFGrades;
      } else if (gradingSystem === 'cbc') {
        settings.grades = defaultCBCGrades;
      } else if (gradingSystem === 'mastery') {
        settings.grades = defaultMasteryGrades;
      }
    }

    if (passMark !== undefined) settings.passMark = passMark;

    await settings.save();
    res.json(settings);
  } catch (error) {
    console.error('Update grading system error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateGrades = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { grades } = req.body;

    if (!grades || !Array.isArray(grades)) {
      return res.status(400).json({ message: 'Grades array is required' });
    }

    let settings = await Settings.findOne({ adminId: tenantId });
    if (!settings) settings = new Settings(getDefaultSettings(tenantId));

    settings.grades = grades;
    settings.gradingSystem = 'custom';

    await settings.save();
    res.json(settings);
  } catch (error) {
    console.error('Update grades error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const addGrade = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { name, minScore, maxScore, remark } = req.body;

    if (!name || minScore === undefined || maxScore === undefined) {
      return res.status(400).json({ message: 'Name, minScore, and maxScore are required' });
    }

    let settings = await Settings.findOne({ adminId: tenantId });
    if (!settings) settings = new Settings(getDefaultSettings(tenantId));

    settings.grades.push({ name, minScore, maxScore, remark: remark || '' });
    settings.gradingSystem = 'custom';

    await settings.save();
    res.status(201).json(settings);
  } catch (error) {
    console.error('Add grade error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteGrade = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const gradeId = req.params.gradeId;

    const settings = await Settings.findOne({ adminId: tenantId });
    if (!settings) {
      return res.status(404).json({ message: 'Settings not found' });
    }

    settings.grades = settings.grades.filter((g) => g._id.toString() !== gradeId);
    await settings.save();

    res.json(settings);
  } catch (error) {
    console.error('Delete grade error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getSettings,
  updateSettings,
  updateGradingSystem,
  updateGrades,
  addGrade,
  deleteGrade
};