const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    lowercase: true
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  fullName: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    trim: true,
    default: ''
  },
  schoolName: {
    type: String,
    trim: true,
    default: ''
  },
  role: {
    type: String,
    enum: ['admin', 'staff', 'teacher'],
    default: 'admin'
  },
  parentAdminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true
  },
  departments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  }],
  status: {
    type: String,
    enum: ['pending', 'active', 'rejected', 'suspended'],
    default: 'active'
  },
  isHiddenAdmin: {
    type: Boolean,
    default: false
  },
  adminHash: {
    type: String,
    unique: true,
    sparse: true
  },
  mustChangePassword: {
    type: Boolean,
    default: false
  },
  temporaryPasswordSentAt: {
    type: Date,
    default: null
  },
  resetToken: {
    type: String,
    default: null,
    index: true
  },
  resetTokenExpires: {
    type: Date,
    default: null
  },
  registrationSource: {
    type: String,
    enum: ['admin', 'self'],
    default: 'admin'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  approvedAt: {
    type: Date,
    default: null
  },
  rejectedReason: {
    type: String,
    default: ''
  },
  rejectedAt: {
    type: Date,
    default: null
  },
  failedAttempts: {
    type: Number,
    default: 0
  },
  lastFailedAttempt: {
    type: Date,
    default: null
  },
  lastLogin: {
    type: Date,
    default: null
  },
  loginCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
  }

  if (this.isHiddenAdmin && !this.adminHash) {
    this.adminHash = crypto.randomBytes(16).toString('hex');
  }

  if (!this.isHiddenAdmin) {
    this.adminHash = undefined;
  }

  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);