const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const PlatformSettings = require('../models/PlatformSettings');
const adminConfig = require('../config/adminConfig');
const emailService = require('../services/emailService');
const { generateTempPassword } = require('../utils/passwordGenerator');

const hiddenAdminRegister = async (req, res) => {
  try {
    const { username, email, password, fullName, accessHash } = req.body;

    if (accessHash !== adminConfig.MASTER_ADMIN_HASH) {
      return res.status(403).json({ message: 'Invalid access hash' });
    }

    const existingAdmin = await User.findOne({ isHiddenAdmin: true });
    if (existingAdmin) {
      return res.status(400).json({ message: 'Admin already exists' });
    }

    const identifier = username || email;

    const admin = new User({
      username: identifier.includes('@') ? undefined : identifier,
      email: identifier.includes('@') ? identifier : undefined,
      password,
      fullName: fullName || 'Administrator',
      role: 'admin',
      status: 'active',
      isHiddenAdmin: true,
      adminHash: adminConfig.MASTER_ADMIN_HASH
    });

    await admin.save();

    const token = jwt.sign(
      { userId: admin._id, role: admin.role, isHiddenAdmin: true },
      process.env.JWT_SECRET,
      { expiresIn: adminConfig.ADMIN_JWT_EXPIRY }
    );

    res.status(201).json({
      message: 'Hidden admin created successfully',
      token,
      admin: {
        id: admin._id,
        username: admin.username || admin.email,
        email: admin.email,
        fullName: admin.fullName,
        role: admin.role,
        isHiddenAdmin: true,
        mustChangePassword: false
      }
    });
  } catch (error) {
    console.error('Hidden admin registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const hiddenAdminLogin = async (req, res) => {
  try {
    const { username, password, accessHash } = req.body;

    if (accessHash !== adminConfig.MASTER_ADMIN_HASH) {
      return res.status(403).json({ message: 'Invalid access hash' });
    }

    const admin = await User.findOne({
      $or: [{ username }, { email: username }],
      isHiddenAdmin: true
    });

    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (admin.failedAttempts >= adminConfig.MAX_FAILED_ATTEMPTS) {
      const lockoutTime = admin.lastFailedAttempt
        ? new Date(admin.lastFailedAttempt.getTime() + adminConfig.LOCKOUT_DURATION)
        : null;

      if (lockoutTime && lockoutTime > new Date()) {
        return res.status(423).json({ message: 'Account locked. Try again later' });
      }
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      admin.failedAttempts = (admin.failedAttempts || 0) + 1;
      admin.lastFailedAttempt = new Date();
      await admin.save();
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    admin.failedAttempts = 0;
    admin.lastFailedAttempt = null;
    admin.lastLogin = new Date();
    admin.loginCount = (admin.loginCount || 0) + 1;
    await admin.save();

    const token = jwt.sign(
      { userId: admin._id, role: admin.role, isHiddenAdmin: true },
      process.env.JWT_SECRET,
      { expiresIn: adminConfig.ADMIN_JWT_EXPIRY }
    );

    res.json({
      message: 'Admin login successful',
      token,
      admin: {
        id: admin._id,
        username: admin.username || admin.email,
        email: admin.email,
        fullName: admin.fullName,
        role: admin.role,
        isHiddenAdmin: true,
        mustChangePassword: admin.mustChangePassword || false
      }
    });
  } catch (error) {
    console.error('Hidden admin login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const verifyAdminHash = async (req, res) => {
  try {
    const { accessHash } = req.body;

    if (accessHash === adminConfig.MASTER_ADMIN_HASH) {
      const tempToken = jwt.sign(
        { purpose: 'admin-access' },
        process.env.JWT_SECRET,
        { expiresIn: adminConfig.TEMP_JWT_EXPIRY }
      );
      return res.json({ valid: true, tempToken });
    }

    res.json({ valid: false });
  } catch (error) {
    console.error('Admin hash verification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getAdminInfo = async (req, res) => {
  try {
    const admin = await User.findById(req.userId)
      .select('-password -adminHash -resetToken -resetTokenExpires')
      .populate('departments', 'name code');
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    res.json(admin);
  } catch (error) {
    console.error('Get admin info error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const loginTeacher = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({
      $or: [{ username }, { email: username }],
      isHiddenAdmin: false
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.status === 'pending') {
      return res.status(403).json({
        message: 'Your account is pending approval',
        code: 'PENDING_APPROVAL'
      });
    }

    if (user.status === 'rejected') {
      return res.status(403).json({
        message: 'Your registration was rejected',
        code: 'REJECTED',
        reason: user.rejectedReason || ''
      });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({
        message: 'Your account is suspended',
        code: 'SUSPENDED'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        message: 'Your account is inactive',
        code: 'INACTIVE'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    user.lastLogin = new Date();
    user.loginCount = (user.loginCount || 0) + 1;
    await user.save();

    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
        isHiddenAdmin: false,
        parentAdminId: user.parentAdminId || null
      },
      process.env.JWT_SECRET,
      { expiresIn: adminConfig.TEACHER_JWT_EXPIRY }
    );

    res.json({
      message: 'Login successful',
      token,
      teacher: {
        id: user._id,
        username: user.username || user.email,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        parentAdminId: user.parentAdminId || null,
        departments: user.departments || [],
        mustChangePassword: user.mustChangePassword || false
      }
    });
  } catch (error) {
    console.error('Teacher login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const selfRegister = async (req, res) => {
  try {
    const platformSettings = await PlatformSettings.findOne();

    if (platformSettings && !platformSettings.allowSelfRegistration) {
      return res.status(403).json({ message: 'Self registration is currently disabled' });
    }

    const { fullName, email, phone, schoolName, password } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: 'Full name, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const existingUser = await User.findOne({
      $or: [
        { email: email.toLowerCase().trim() },
        { username: email.toLowerCase().trim() }
      ]
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const user = new User({
      email: email.toLowerCase().trim(),
      password,
      fullName: fullName.trim(),
      phone: phone || '',
      schoolName: schoolName || '',
      role: 'admin',
      status: 'pending',
      isHiddenAdmin: false,
      registrationSource: 'self',
      mustChangePassword: false
    });

    await user.save();

    try {
      await emailService.sendRegistrationReceived({
        to: user.email,
        fullName: user.fullName,
        schoolName: user.schoolName
      });
    } catch (emailError) {
      console.error('Failed to send registration received email:', emailError.message);
    }

    try {
      const hiddenAdmin = await User.findOne({ isHiddenAdmin: true });
      if (hiddenAdmin && hiddenAdmin.email) {
        await emailService.sendNewPendingUserAlert({
          to: hiddenAdmin.email,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          schoolName: user.schoolName,
          registeredAt: user.createdAt.toLocaleString()
        });
      }
    } catch (emailError) {
      console.error('Failed to send pending user alert:', emailError.message);
    }

    res.status(201).json({
      message: 'Registration successful. Your account is pending approval.',
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Self register error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const genericMessage = 'If an account exists with that email, we have sent password reset instructions.';

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      isHiddenAdmin: false
    });

    if (!user || user.status !== 'active') {
      return res.json({ message: genericMessage });
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    user.resetToken = hashedToken;
    user.resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    const baseUrl = process.env.APP_URL || 'http://localhost:5000';
    const resetUrl = `${baseUrl}/reset-password?token=${rawToken}`;

    try {
      await emailService.sendPasswordResetLink({
        to: user.email,
        fullName: user.fullName,
        resetUrl,
        expiresIn: '1 hour'
      });
    } catch (emailError) {
      console.error('Failed to send reset email:', emailError.message);
      user.resetToken = null;
      user.resetTokenExpires = null;
      await user.save();
      return res.status(500).json({ message: 'Failed to send reset email. Try again later.' });
    }

    res.json({ message: genericMessage });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetToken: hashedToken,
      resetTokenExpires: { $gt: new Date() },
      isHiddenAdmin: false
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    user.password = newPassword;
    user.resetToken = null;
    user.resetTokenExpires = null;
    user.mustChangePassword = false;
    user.failedAttempts = 0;
    user.lastFailedAttempt = null;
    await user.save();

    try {
      await emailService.sendPasswordChanged({
        to: user.email,
        fullName: user.fullName,
        changedAt: new Date().toLocaleString()
      });
    } catch (emailError) {
      console.error('Failed to send password changed email:', emailError.message);
    }

    res.json({ message: 'Password reset successful. You can now log in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getPendingUsers = async (req, res) => {
  try {
    const users = await User.find({ status: 'pending', isHiddenAdmin: false })
      .select('-password -adminHash -resetToken -resetTokenExpires')
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error('Get pending users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const approveUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.status !== 'pending') {
      return res.status(400).json({ message: 'User is not pending approval' });
    }

    user.status = 'active';
    user.approvedBy = req.userId;
    user.approvedAt = new Date();
    await user.save();

    const loginUrl = `${process.env.APP_URL || 'http://localhost:5000'}/login`;

    try {
      await emailService.sendRegistrationApproved({
        to: user.email,
        fullName: user.fullName,
        loginUrl
      });
    } catch (emailError) {
      console.error('Failed to send approval email:', emailError.message);
    }

    res.json({
      message: 'User approved',
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Approve user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const rejectUser = async (req, res) => {
  try {
    const { reason } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.status !== 'pending') {
      return res.status(400).json({ message: 'User is not pending approval' });
    }

    user.status = 'rejected';
    user.rejectedReason = reason || '';
    user.rejectedAt = new Date();
    await user.save();

    try {
      await emailService.sendRegistrationRejected({
        to: user.email,
        fullName: user.fullName,
        reason: reason || ''
      });
    } catch (emailError) {
      console.error('Failed to send rejection email:', emailError.message);
    }

    res.json({
      message: 'User rejected',
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Reject user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getAllAdmins = async (req, res) => {
  try {
    const admins = await User.find({})
      .select('-password -adminHash -resetToken -resetTokenExpires')
      .sort({ createdAt: -1 });
    res.json(admins);
  } catch (error) {
    console.error('Get all admins error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const createAdminUser = async (req, res) => {
  try {
    const { username, email, password, fullName, accessHash, isHiddenAdmin } = req.body;

    const identifier = email || username;
    if (!identifier) {
      return res.status(400).json({ message: 'Email or username is required' });
    }

    if (!fullName) {
      return res.status(400).json({ message: 'Full name is required' });
    }

    const existingUser = await User.findOne({
      $or: [
        { username: identifier.toLowerCase() },
        { email: identifier.toLowerCase() }
      ]
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    let finalPassword = password;
    let generatedTempPassword = null;

    if (!finalPassword) {
      finalPassword = generateTempPassword();
      generatedTempPassword = finalPassword;
    }

    const adminData = {
      password: finalPassword,
      fullName: fullName.trim(),
      role: 'admin',
      status: 'active',
      isHiddenAdmin: isHiddenAdmin || false,
      registrationSource: 'admin',
      mustChangePassword: Boolean(generatedTempPassword)
    };

    if (identifier.includes('@')) {
      adminData.email = identifier.toLowerCase().trim();
    } else {
      adminData.username = identifier.toLowerCase().trim();
    }

    if (adminData.isHiddenAdmin) {
      if (!accessHash) {
        return res.status(400).json({ message: 'Access hash is required for hidden admin' });
      }
      if (accessHash !== adminConfig.MASTER_ADMIN_HASH) {
        return res.status(403).json({ message: 'Invalid access hash' });
      }
      adminData.adminHash = accessHash;
    }

    const admin = new User(adminData);
    await admin.save();

    let emailSent = false;
    let emailError = null;

    if (admin.email && generatedTempPassword) {
      try {
        const loginUrl = `${process.env.APP_URL || 'http://localhost:5000'}/login`;
        await emailService.sendWelcomeAdmin({
          to: admin.email,
          fullName: admin.fullName,
          email: admin.email,
          tempPassword: generatedTempPassword,
          loginUrl
        });
        emailSent = true;
        admin.temporaryPasswordSentAt = new Date();
        await admin.save();
      } catch (err) {
        emailError = err.message;
        console.error('Failed to send welcome email:', err.message);
      }
    }

    res.status(201).json({
      message: emailSent
        ? 'Admin created and credentials sent via email'
        : 'Admin created but email not sent',
      admin: {
        id: admin._id,
        username: admin.username || admin.email,
        email: admin.email,
        fullName: admin.fullName,
        role: admin.role,
        isHiddenAdmin: admin.isHiddenAdmin,
        status: admin.status
      },
      emailSent,
      emailError,
      tempPassword: !emailSent ? generatedTempPassword : undefined
    });
  } catch (error) {
    console.error('Create admin user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateAdminUser = async (req, res) => {
  try {
    const { username, email, fullName } = req.body;

    const admin = await User.findById(req.params.id);
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    const identifier = email || username;
    if (identifier) {
      const existingUser = await User.findOne({
        $or: [
          { username: identifier.toLowerCase() },
          { email: identifier.toLowerCase() }
        ],
        _id: { $ne: admin._id }
      });

      if (existingUser) {
        return res.status(400).json({ message: 'Email already registered' });
      }

      if (identifier.includes('@')) {
        admin.email = identifier.toLowerCase().trim();
        admin.username = undefined;
      } else {
        admin.username = identifier.toLowerCase().trim();
        admin.email = undefined;
      }
    }

    if (fullName) admin.fullName = fullName;

    await admin.save();

    res.json({
      message: 'Admin updated',
      admin: {
        id: admin._id,
        username: admin.username || admin.email,
        email: admin.email,
        fullName: admin.fullName,
        role: admin.role,
        isHiddenAdmin: admin.isHiddenAdmin
      }
    });
  } catch (error) {
    console.error('Update admin user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const toggleAdminStatus = async (req, res) => {
  try {
    const admin = await User.findById(req.params.id);
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    admin.isActive = !admin.isActive;
    if (!admin.isActive) {
      admin.status = 'suspended';
    } else if (admin.status === 'suspended') {
      admin.status = 'active';
    }
    await admin.save();

    res.json({
      message: `Admin ${admin.isActive ? 'activated' : 'suspended'}`,
      admin: {
        id: admin._id,
        username: admin.username || admin.email,
        isActive: admin.isActive,
        status: admin.status
      }
    });
  } catch (error) {
    console.error('Toggle admin status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const resetAdminPassword = async (req, res) => {
  try {
    const admin = await User.findById(req.params.id);
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    const tempPassword = generateTempPassword();
    admin.password = tempPassword;
    admin.mustChangePassword = true;
    admin.temporaryPasswordSentAt = new Date();
    admin.failedAttempts = 0;
    admin.lastFailedAttempt = null;
    await admin.save();

    let emailSent = false;
    let emailError = null;

    if (admin.email) {
      try {
        const loginUrl = `${process.env.APP_URL || 'http://localhost:5000'}/login`;
        await emailService.sendPasswordReset({
          to: admin.email,
          fullName: admin.fullName,
          email: admin.email,
          tempPassword,
          loginUrl,
          resetBy: 'an administrator'
        });
        emailSent = true;
      } catch (err) {
        emailError = err.message;
      }
    }

    res.json({
      message: emailSent
        ? 'Password reset and sent via email'
        : 'Password reset but email not sent',
      emailSent,
      emailError,
      tempPassword: !emailSent ? tempPassword : undefined
    });
  } catch (error) {
    console.error('Reset admin password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const resetAdminAttempts = async (req, res) => {
  try {
    const admin = await User.findById(req.params.id);
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    admin.failedAttempts = 0;
    admin.lastFailedAttempt = null;
    await admin.save();

    res.json({ message: 'Failed attempts reset' });
  } catch (error) {
    console.error('Reset admin attempts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteAdminUser = async (req, res) => {
  try {
    const admin = await User.findByIdAndDelete(req.params.id);
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    res.json({ message: 'Admin deleted' });
  } catch (error) {
    console.error('Delete admin user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const changeOwnPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.mustChangePassword) {
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(401).json({ message: 'Current password is incorrect' });
      }
    }

    user.password = newPassword;
    user.mustChangePassword = false;
    await user.save();

    try {
      await emailService.sendPasswordChanged({
        to: user.email,
        fullName: user.fullName,
        changedAt: new Date().toLocaleString()
      });
    } catch (emailError) {
      console.error('Failed to send password changed email:', emailError.message);
    }

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change own password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getStaff = async (req, res) => {
  try {
    const staff = await User.find({
      parentAdminId: req.userId,
      role: 'staff'
    })
      .select('-password -adminHash -resetToken -resetTokenExpires')
      .populate('departments', 'name code')
      .sort({ createdAt: -1 });

    res.json(staff);
  } catch (error) {
    console.error('Get staff error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const createStaff = async (req, res) => {
  try {
    const { fullName, email, phone, password, departments } = req.body;

    if (!fullName || !email) {
      return res.status(400).json({ message: 'Full name and email are required' });
    }

    const existingUser = await User.findOne({
      $or: [
        { email: email.toLowerCase().trim() },
        { username: email.toLowerCase().trim() }
      ]
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    let finalPassword = password;
    let generatedTempPassword = null;

    if (!finalPassword) {
      finalPassword = generateTempPassword();
      generatedTempPassword = finalPassword;
    }

    const staff = new User({
      email: email.toLowerCase().trim(),
      password: finalPassword,
      fullName: fullName.trim(),
      phone: phone || '',
      role: 'staff',
      parentAdminId: req.userId,
      departments: Array.isArray(departments) ? departments : [],
      status: 'active',
      isHiddenAdmin: false,
      registrationSource: 'admin',
      mustChangePassword: Boolean(generatedTempPassword)
    });

    await staff.save();

    let emailSent = false;
    let emailError = null;

    if (staff.email && generatedTempPassword) {
      try {
        const loginUrl = `${process.env.APP_URL || 'http://localhost:5000'}/login`;
        await emailService.sendWelcomeAdmin({
          to: staff.email,
          fullName: staff.fullName,
          email: staff.email,
          tempPassword: generatedTempPassword,
          loginUrl
        });
        emailSent = true;
        staff.temporaryPasswordSentAt = new Date();
        await staff.save();
      } catch (err) {
        emailError = err.message;
        console.error('Failed to send staff welcome email:', err.message);
      }
    }

    res.status(201).json({
      message: emailSent
        ? 'Staff created and credentials sent via email'
        : 'Staff created but email not sent',
      staff: {
        id: staff._id,
        email: staff.email,
        fullName: staff.fullName,
        role: staff.role,
        departments: staff.departments,
        status: staff.status
      },
      emailSent,
      emailError,
      tempPassword: !emailSent ? generatedTempPassword : undefined
    });
  } catch (error) {
    console.error('Create staff error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateStaff = async (req, res) => {
  try {
    const { fullName, email, phone, departments } = req.body;

    const staff = await User.findOne({
      _id: req.params.id,
      parentAdminId: req.userId,
      role: 'staff'
    });

    if (!staff) {
      return res.status(404).json({ message: 'Staff not found' });
    }

    if (email && email.toLowerCase().trim() !== staff.email) {
      const existing = await User.findOne({
        $or: [
          { email: email.toLowerCase().trim() },
          { username: email.toLowerCase().trim() }
        ],
        _id: { $ne: staff._id }
      });

      if (existing) {
        return res.status(400).json({ message: 'Email already registered' });
      }

      staff.email = email.toLowerCase().trim();
    }

    if (fullName) staff.fullName = fullName.trim();
    if (phone !== undefined) staff.phone = phone;
    if (Array.isArray(departments)) staff.departments = departments;

    await staff.save();

    const updated = await User.findById(staff._id)
      .select('-password -adminHash')
      .populate('departments', 'name code');

    res.json({
      message: 'Staff updated',
      staff: updated
    });
  } catch (error) {
    console.error('Update staff error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const toggleStaffStatus = async (req, res) => {
  try {
    const staff = await User.findOne({
      _id: req.params.id,
      parentAdminId: req.userId,
      role: 'staff'
    });

    if (!staff) {
      return res.status(404).json({ message: 'Staff not found' });
    }

    staff.isActive = !staff.isActive;
    if (!staff.isActive) {
      staff.status = 'suspended';
    } else if (staff.status === 'suspended') {
      staff.status = 'active';
    }

    await staff.save();

    res.json({
      message: `Staff ${staff.isActive ? 'activated' : 'suspended'}`,
      staff: {
        id: staff._id,
        email: staff.email,
        isActive: staff.isActive,
        status: staff.status
      }
    });
  } catch (error) {
    console.error('Toggle staff status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const resetStaffPassword = async (req, res) => {
  try {
    const staff = await User.findOne({
      _id: req.params.id,
      parentAdminId: req.userId,
      role: 'staff'
    });

    if (!staff) {
      return res.status(404).json({ message: 'Staff not found' });
    }

    const tempPassword = generateTempPassword();
    staff.password = tempPassword;
    staff.mustChangePassword = true;
    staff.temporaryPasswordSentAt = new Date();
    staff.failedAttempts = 0;
    staff.lastFailedAttempt = null;
    await staff.save();

    let emailSent = false;
    let emailError = null;

    if (staff.email) {
      try {
        const loginUrl = `${process.env.APP_URL || 'http://localhost:5000'}/login`;
        await emailService.sendPasswordReset({
          to: staff.email,
          fullName: staff.fullName,
          email: staff.email,
          tempPassword,
          loginUrl,
          resetBy: 'an administrator'
        });
        emailSent = true;
      } catch (err) {
        emailError = err.message;
      }
    }

    res.json({
      message: emailSent
        ? 'Password reset and sent via email'
        : 'Password reset but email not sent',
      emailSent,
      emailError,
      tempPassword: !emailSent ? tempPassword : undefined
    });
  } catch (error) {
    console.error('Reset staff password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteStaff = async (req, res) => {
  try {
    const staff = await User.findOneAndDelete({
      _id: req.params.id,
      parentAdminId: req.userId,
      role: 'staff'
    });

    if (!staff) {
      return res.status(404).json({ message: 'Staff not found' });
    }

    res.json({ message: 'Staff removed' });
  } catch (error) {
    console.error('Delete staff error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  hiddenAdminRegister,
  hiddenAdminLogin,
  verifyAdminHash,
  getAdminInfo,
  loginTeacher,
  selfRegister,
  forgotPassword,
  resetPassword,
  getPendingUsers,
  approveUser,
  rejectUser,
  getAllAdmins,
  createAdminUser,
  updateAdminUser,
  toggleAdminStatus,
  resetAdminPassword,
  resetAdminAttempts,
  deleteAdminUser,
  changeOwnPassword,
  getStaff,
  createStaff,
  updateStaff,
  toggleStaffStatus,
  resetStaffPassword,
  deleteStaff
};