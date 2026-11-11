const getDefaultSupport = () => ({
  appName: 'ExamPro',
  supportEmail: 'support@exampro.com',
  supportWhatsapp: '',
  supportUrl: '',
  footerText: '© 2026 ExamPro',
});

const wrapWithFooter = (content, support) => {
  const s = { ...getDefaultSupport(), ...support };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); max-width: 600px; width: 100%;">
          <tr>
            <td style="background: linear-gradient(135deg, #2563eb 0%, #1e3a8a 100%); padding: 32px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 700; letter-spacing: 0.5px;">
                ${s.appName}
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 36px 30px;">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 30px; border-top: 1px solid #e5e7eb;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-bottom: 12px;">
                    <p style="margin: 0 0 8px 0; font-size: 13px; color: #6b7280; font-weight: 600;">
                      Need help?
                    </p>
                    ${s.supportEmail ? `<p style="margin: 4px 0; font-size: 13px; color: #4b5563;">📧 <a href="mailto:${s.supportEmail}" style="color: #2563eb; text-decoration: none;">${s.supportEmail}</a></p>` : ''}
                    ${s.supportWhatsapp ? `<p style="margin: 4px 0; font-size: 13px; color: #4b5563;">💬 WhatsApp: <a href="https://wa.me/${s.supportWhatsapp.replace(/[^0-9]/g, '')}" style="color: #2563eb; text-decoration: none;">${s.supportWhatsapp}</a></p>` : ''}
                    ${s.supportUrl ? `<p style="margin: 4px 0; font-size: 13px; color: #4b5563;">🌐 <a href="${s.supportUrl}" style="color: #2563eb; text-decoration: none;">${s.supportUrl}</a></p>` : ''}
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 12px; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                      ${s.footerText}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
};

const wrapTextFooter = (content, support) => {
  const s = { ...getDefaultSupport(), ...support };

  return `${content}

---
Need help?
${s.supportEmail ? `Email: ${s.supportEmail}` : ''}
${s.supportWhatsapp ? `WhatsApp: ${s.supportWhatsapp}` : ''}
${s.supportUrl ? `Website: ${s.supportUrl}` : ''}

${s.footerText}
  `.trim();
};

const buttonStyle = `
  display: inline-block;
  background-color: #2563eb;
  color: #ffffff !important;
  padding: 12px 28px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  font-size: 15px;
  margin: 8px 0;
`;

const h2Style = 'margin: 0 0 16px 0; font-size: 22px; color: #111827; font-weight: 700;';
const pStyle = 'margin: 0 0 14px 0; font-size: 15px; line-height: 1.6; color: #374151;';
const infoBoxStyle = `
  background-color: #eff6ff;
  border-left: 4px solid #2563eb;
  padding: 16px 20px;
  border-radius: 6px;
  margin: 20px 0;
`;
const infoRowStyle = 'margin: 0 0 8px 0; font-size: 14px; color: #1e3a8a;';
const labelStyle = 'font-weight: 600; color: #1e40af;';

const welcomeAdmin = ({ fullName, email, tempPassword, loginUrl }) => ({
  subject: 'Your Admin Account Credentials',
  html: `
    <h2 style="${h2Style}">Welcome, ${fullName}!</h2>
    <p style="${pStyle}">Your admin account has been created. Use the credentials below to log in.</p>
    <div style="${infoBoxStyle}">
      <p style="${infoRowStyle}"><span style="${labelStyle}">Email:</span> ${email}</p>
      <p style="${infoRowStyle}"><span style="${labelStyle}">Temporary Password:</span> <code style="background: #dbeafe; padding: 2px 8px; border-radius: 4px; font-family: monospace; font-size: 15px;">${tempPassword}</code></p>
    </div>
    <p style="${pStyle}"><strong>⚠️ Important:</strong> You will be required to change your password on first login.</p>
    <div style="text-align: center; margin: 28px 0;">
      <a href="${loginUrl}" style="${buttonStyle}">Log In Now</a>
    </div>
  `,
  text: `Welcome, ${fullName}!

Your admin account has been created.

Email: ${email}
Temporary Password: ${tempPassword}

You will be required to change your password on first login.

Log in: ${loginUrl}`,
});

const passwordReset = ({ fullName, email, tempPassword, loginUrl, resetBy }) => ({
  subject: 'Your Password Has Been Reset',
  html: `
    <h2 style="${h2Style}">Password Reset</h2>
    <p style="${pStyle}">Hello ${fullName},</p>
    <p style="${pStyle}">Your password has been reset by ${resetBy || 'an administrator'}.</p>
    <div style="${infoBoxStyle}">
      <p style="${infoRowStyle}"><span style="${labelStyle}">Email:</span> ${email}</p>
      <p style="${infoRowStyle}"><span style="${labelStyle}">New Temporary Password:</span> <code style="background: #dbeafe; padding: 2px 8px; border-radius: 4px; font-family: monospace; font-size: 15px;">${tempPassword}</code></p>
    </div>
    <p style="${pStyle}"><strong>⚠️ Important:</strong> You will be required to change your password on next login.</p>
    <div style="text-align: center; margin: 28px 0;">
      <a href="${loginUrl}" style="${buttonStyle}">Log In Now</a>
    </div>
  `,
  text: `Password Reset

Hello ${fullName},

Your password has been reset by ${resetBy || 'an administrator'}.

Email: ${email}
New Temporary Password: ${tempPassword}

You will be required to change your password on next login.

Log in: ${loginUrl}`,
});

const passwordResetLink = ({ fullName, resetUrl, expiresIn }) => ({
  subject: 'Reset Your Password',
  html: `
    <h2 style="${h2Style}">Reset Your Password</h2>
    <p style="${pStyle}">Hello ${fullName},</p>
    <p style="${pStyle}">We received a request to reset your password. Click the button below to set a new password.</p>
    <div style="text-align: center; margin: 28px 0;">
      <a href="${resetUrl}" style="${buttonStyle}">Reset Password</a>
    </div>
    <div style="${infoBoxStyle}">
      <p style="${infoRowStyle}"><span style="${labelStyle}">⏱ This link expires in:</span> ${expiresIn || '1 hour'}</p>
    </div>
    <p style="${pStyle}">If you didn't request this, you can safely ignore this email. Your password will remain unchanged.</p>
    <p style="margin: 20px 0 0 0; font-size: 12px; color: #6b7280; word-break: break-all;">
      Button not working? Copy and paste this link into your browser:<br>
      <a href="${resetUrl}" style="color: #2563eb;">${resetUrl}</a>
    </p>
  `,
  text: `Reset Your Password

Hello ${fullName},

We received a request to reset your password. Visit the link below to set a new password:

${resetUrl}

This link expires in ${expiresIn || '1 hour'}.

If you didn't request this, ignore this email.`,
});

const registrationReceived = ({ fullName, schoolName }) => ({
  subject: 'Registration Received - Pending Approval',
  html: `
    <h2 style="${h2Style}">Registration Received</h2>
    <p style="${pStyle}">Hello ${fullName},</p>
    <p style="${pStyle}">Thank you for registering${schoolName ? ` for <strong>${schoolName}</strong>` : ''}.</p>
    <div style="${infoBoxStyle}">
      <p style="${infoRowStyle}">🕐 <strong>Your account is pending approval</strong></p>
      <p style="margin: 4px 0 0 0; font-size: 13px; color: #1e40af;">We will notify you by email once your account has been reviewed.</p>
    </div>
    <p style="${pStyle}">This usually takes less than 24 hours.</p>
  `,
  text: `Registration Received

Hello ${fullName},

Thank you for registering${schoolName ? ` for ${schoolName}` : ''}.

Your account is pending approval. We will notify you once it has been reviewed.`,
});

const newPendingUserAlert = ({ fullName, email, phone, schoolName, registeredAt }) => ({
  subject: 'New Pending Registration',
  html: `
    <h2 style="${h2Style}">New Pending Registration</h2>
    <p style="${pStyle}">A new user has registered and is awaiting approval.</p>
    <div style="${infoBoxStyle}">
      <p style="${infoRowStyle}"><span style="${labelStyle}">Name:</span> ${fullName}</p>
      <p style="${infoRowStyle}"><span style="${labelStyle}">Email:</span> ${email}</p>
      ${phone ? `<p style="${infoRowStyle}"><span style="${labelStyle}">Phone:</span> ${phone}</p>` : ''}
      ${schoolName ? `<p style="${infoRowStyle}"><span style="${labelStyle}">School:</span> ${schoolName}</p>` : ''}
      ${registeredAt ? `<p style="${infoRowStyle}"><span style="${labelStyle}">Registered:</span> ${registeredAt}</p>` : ''}
    </div>
    <p style="${pStyle}">Log in to the platform to review and approve or reject this registration.</p>
  `,
  text: `New Pending Registration

Name: ${fullName}
Email: ${email}
${phone ? `Phone: ${phone}` : ''}
${schoolName ? `School: ${schoolName}` : ''}
${registeredAt ? `Registered: ${registeredAt}` : ''}

Log in to the platform to review this registration.`,
});

const registrationApproved = ({ fullName, loginUrl }) => ({
  subject: 'Your Account Has Been Approved',
  html: `
    <h2 style="${h2Style}">Account Approved! 🎉</h2>
    <p style="${pStyle}">Hello ${fullName},</p>
    <p style="${pStyle}">Great news! Your account has been approved. You can now log in.</p>
    <div style="text-align: center; margin: 28px 0;">
      <a href="${loginUrl}" style="${buttonStyle}">Log In Now</a>
    </div>
    <p style="${pStyle}">Welcome aboard!</p>
  `,
  text: `Account Approved!

Hello ${fullName},

Your account has been approved. You can now log in.

Log in: ${loginUrl}`,
});

const registrationRejected = ({ fullName, reason }) => ({
  subject: 'Registration Update',
  html: `
    <h2 style="${h2Style}">Registration Update</h2>
    <p style="${pStyle}">Hello ${fullName},</p>
    <p style="${pStyle}">Thank you for your interest. Unfortunately, your registration could not be approved at this time.</p>
    ${reason ? `
      <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 16px 20px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 0 0 6px 0; font-size: 13px; color: #991b1b; font-weight: 600;">Reason:</p>
        <p style="margin: 0; font-size: 14px; color: #7f1d1d;">${reason}</p>
      </div>
    ` : ''}
    <p style="${pStyle}">If you believe this was a mistake, contact support.</p>
  `,
  text: `Registration Update

Hello ${fullName},

Unfortunately, your registration could not be approved at this time.
${reason ? `\nReason: ${reason}` : ''}

If you believe this was a mistake, contact support.`,
});

const accountSuspended = ({ fullName, reason }) => ({
  subject: 'Account Suspended',
  html: `
    <h2 style="${h2Style}">Account Suspended</h2>
    <p style="${pStyle}">Hello ${fullName},</p>
    <p style="${pStyle}">Your account has been suspended. You will not be able to log in until it is reactivated.</p>
    ${reason ? `
      <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 16px 20px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 0 0 6px 0; font-size: 13px; color: #991b1b; font-weight: 600;">Reason:</p>
        <p style="margin: 0; font-size: 14px; color: #7f1d1d;">${reason}</p>
      </div>
    ` : ''}
    <p style="${pStyle}">If you have questions, contact support.</p>
  `,
  text: `Account Suspended

Hello ${fullName},

Your account has been suspended.
${reason ? `\nReason: ${reason}` : ''}

Contact support if you have questions.`,
});

const passwordChanged = ({ fullName, changedAt }) => ({
  subject: 'Your Password Was Changed',
  html: `
    <h2 style="${h2Style}">Password Changed</h2>
    <p style="${pStyle}">Hello ${fullName},</p>
    <p style="${pStyle}">Your password was successfully changed.</p>
    <div style="${infoBoxStyle}">
      <p style="${infoRowStyle}"><span style="${labelStyle}">Time:</span> ${changedAt}</p>
    </div>
    <p style="${pStyle}">If this wasn't you, contact support immediately.</p>
  `,
  text: `Password Changed

Hello ${fullName},

Your password was successfully changed at ${changedAt}.

If this wasn't you, contact support immediately.`,
});

module.exports = {
  wrapWithFooter,
  wrapTextFooter,
  getDefaultSupport,
  templates: {
    welcomeAdmin,
    passwordReset,
    passwordResetLink,
    registrationReceived,
    newPendingUserAlert,
    registrationApproved,
    registrationRejected,
    accountSuspended,
    passwordChanged,
  },
};