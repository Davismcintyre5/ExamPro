const PlatformSettings = require('../models/PlatformSettings');
const hdmBridge = require('../config/hdmBridge');
const {
  templates,
  wrapWithFooter,
  wrapTextFooter,
  getDefaultSupport,
} = require('../utils/emailTemplates');

const buildSupport = async () => {
  try {
    const settings = await PlatformSettings.findOne();

    if (!settings) return getDefaultSupport();

    return {
      appName: settings.appName || 'ExamPro',
      supportEmail: settings.supportEmail || '',
      supportWhatsapp: settings.supportWhatsapp || '',
      supportUrl: settings.supportUrl || '',
      footerText: settings.footerText || `© ${new Date().getFullYear()} ${settings.appName || 'ExamPro'}`,
    };
  } catch (error) {
    console.error('Failed to load platform settings, using defaults:', error.message);
    return getDefaultSupport();
  }
};

const buildEmail = async (templateFn, data) => {
  const support = await buildSupport();
  const { subject, html, text } = templateFn(data);

  return {
    subject,
    htmlBody: wrapWithFooter(html, support),
    textBody: wrapTextFooter(text, support),
  };
};

const sendTemplated = async ({ to, template, data, replyTo }) => {
  const email = await buildEmail(template, data);

  return hdmBridge.sendRawEmail({
    to,
    subject: email.subject,
    htmlBody: email.htmlBody,
    textBody: email.textBody,
    replyTo,
  });
};

const sendWelcomeAdmin = (data) => sendTemplated({ to: data.to, template: templates.welcomeAdmin, data });
const sendPasswordReset = (data) => sendTemplated({ to: data.to, template: templates.passwordReset, data });
const sendPasswordResetLink = (data) => sendTemplated({ to: data.to, template: templates.passwordResetLink, data });
const sendRegistrationReceived = (data) => sendTemplated({ to: data.to, template: templates.registrationReceived, data });
const sendNewPendingUserAlert = (data) => sendTemplated({ to: data.to, template: templates.newPendingUserAlert, data });
const sendRegistrationApproved = (data) => sendTemplated({ to: data.to, template: templates.registrationApproved, data });
const sendRegistrationRejected = (data) => sendTemplated({ to: data.to, template: templates.registrationRejected, data });
const sendAccountSuspended = (data) => sendTemplated({ to: data.to, template: templates.accountSuspended, data });
const sendPasswordChanged = (data) => sendTemplated({ to: data.to, template: templates.passwordChanged, data });

const isReady = () => hdmBridge.isConfigured();

module.exports = {
  isReady,
  buildSupport,
  buildEmail,
  sendTemplated,
  sendWelcomeAdmin,
  sendPasswordReset,
  sendPasswordResetLink,
  sendRegistrationReceived,
  sendNewPendingUserAlert,
  sendRegistrationApproved,
  sendRegistrationRejected,
  sendAccountSuspended,
  sendPasswordChanged,
};