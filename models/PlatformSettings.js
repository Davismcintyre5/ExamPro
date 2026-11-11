const mongoose = require('mongoose');

const platformSettingsSchema = new mongoose.Schema({
  appName: {
    type: String,
    default: 'ExamPro',
    trim: true
  },
  appTagline: {
    type: String,
    default: 'Exam Entry System',
    trim: true
  },
  logo: {
    type: String,
    default: ''
  },
  favicon: {
    type: String,
    default: ''
  },
  supportEmail: {
    type: String,
    default: 'support@exampro.com',
    trim: true,
    lowercase: true
  },
  supportPhone: {
    type: String,
    default: '',
    trim: true
  },
  supportWhatsapp: {
    type: String,
    default: '',
    trim: true
  },
  supportUrl: {
    type: String,
    default: '',
    trim: true
  },
  allowSelfRegistration: {
    type: Boolean,
    default: false
  },
  allowNewAdmins: {
    type: Boolean,
    default: true
  },
  maintenanceMode: {
    type: Boolean,
    default: false
  },
  maintenanceMessage: {
    type: String,
    default: 'We are currently performing maintenance. Please check back soon.',
    trim: true
  },
  footerText: {
    type: String,
    default: '',
    trim: true
  },
  termsUrl: {
    type: String,
    default: '',
    trim: true
  },
  privacyUrl: {
    type: String,
    default: '',
    trim: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

platformSettingsSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('PlatformSettings', platformSettingsSchema);