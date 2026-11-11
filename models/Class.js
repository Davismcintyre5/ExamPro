const mongoose = require('mongoose');

const unitSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    trim: true
  },
  formativeCount: {
    type: Number,
    enum: [3, 4],
    default: 3
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const classSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  className: {
    type: String,
    required: true,
    trim: true
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true,
    index: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    default: null,
    index: true
  },
  level: {
    type: Number,
    default: null
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  academicYear: {
    type: String,
    default: () => new Date().getFullYear().toString()
  },
  units: [unitSchema],
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

classSchema.index({ className: 1, adminId: 1 }, { unique: true });

classSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Class', classSchema);