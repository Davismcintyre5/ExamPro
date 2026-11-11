const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  schoolName: {
    type: String,
    default: 'My School',
    trim: true
  },
  schoolCode: {
    type: String,
    default: '',
    trim: true
  },
  address: {
    type: String,
    default: '',
    trim: true
  },
  city: {
    type: String,
    default: '',
    trim: true
  },
  state: {
    type: String,
    default: '',
    trim: true
  },
  postalCode: {
    type: String,
    default: '',
    trim: true
  },
  country: {
    type: String,
    default: '',
    trim: true
  },
  phone: {
    type: String,
    default: '',
    trim: true
  },
  email: {
    type: String,
    default: '',
    trim: true,
    lowercase: true
  },
  website: {
    type: String,
    default: '',
    trim: true
  },
  motto: {
    type: String,
    default: 'Excellence in Education',
    trim: true
  },
  logo: {
    type: String,
    default: ''
  },
  academicYear: {
    type: String,
    default: () => new Date().getFullYear().toString()
  },
  term: {
    type: String,
    default: 'Term 1'
  },
  passMark: {
    type: Number,
    default: 50
  },
  reportFooter: {
    type: String,
    default: ''
  },
  gradingSystem: {
    type: String,
    enum: ['af', 'cbc', 'mastery', 'custom'],
    default: 'mastery'
  },
  grades: [{
    name: {
      type: String,
      required: true
    },
    minScore: {
      type: Number,
      required: true
    },
    maxScore: {
      type: Number,
      required: true
    },
    remark: {
      type: String,
      default: ''
    }
  }],
  letterhead: {
    type: String,
    default: ''
  },
  letterheadHeight: {
    type: Number,
    default: 60
  },
  printMarginTop: {
    type: Number,
    default: 8
  },
  printMarginBottom: {
    type: Number,
    default: 15
  },
  paperSize: {
    type: String,
    enum: ['A4', 'A5', 'Letter'],
    default: 'A4'
  },
  orientation: {
    type: String,
    enum: ['portrait', 'landscape'],
    default: 'portrait'
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

settingsSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Settings', settingsSchema);