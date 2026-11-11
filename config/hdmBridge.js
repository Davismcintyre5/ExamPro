const axios = require('axios');
require('dotenv').config();

const HDM_API_KEY = process.env.HDM_API_KEY;
const HDM_API_URL = process.env.HDM_API_URL || 'https://bridgeapi.hdm.co.ke/api';
const HDM_FROM_EMAIL = process.env.HDM_FROM_EMAIL;
const HDM_FROM_NAME = process.env.HDM_FROM_NAME || 'ExamPro';

const isConfigured = () => {
  return Boolean(HDM_API_KEY && HDM_API_URL && HDM_FROM_EMAIL);
};

const sendRawEmail = async ({ to, subject, htmlBody, textBody, replyTo }) => {
  if (!isConfigured()) {
    throw new Error('HDM Bridge not configured. Check HDM_API_KEY, HDM_API_URL, HDM_FROM_EMAIL in .env');
  }

  const payload = {
    from: HDM_FROM_EMAIL,
    fromName: HDM_FROM_NAME,
    to,
    subject,
    htmlBody,
  };

  if (textBody) payload.textBody = textBody;
  if (replyTo) payload.replyTo = replyTo;

  try {
    const response = await axios.post(
      `${HDM_API_URL}/emails/send`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${HDM_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );

    return {
      success: true,
      messageId: response.data?.messageId,
      status: response.data?.status || 'queued',
    };
  } catch (error) {
    const apiError = error.response?.data;
    console.error('HDM Bridge email error:', {
      status: error.response?.status,
      code: apiError?.code,
      message: apiError?.error || error.message,
    });

    throw new Error(apiError?.error || error.message || 'Failed to send email');
  }
};

const sendRawSms = async ({ to, content, sender }) => {
  if (!isConfigured()) {
    throw new Error('HDM Bridge not configured');
  }

  const payload = {
    to,
    content,
    sender: sender || HDM_FROM_NAME,
  };

  try {
    const response = await axios.post(
      `${HDM_API_URL}/sms/send`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${HDM_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );

    return {
      success: true,
      messageId: response.data?.messageId,
      status: response.data?.status || 'sent',
      creditsUsed: response.data?.creditsUsed,
    };
  } catch (error) {
    const apiError = error.response?.data;
    console.error('HDM Bridge SMS error:', {
      status: error.response?.status,
      code: apiError?.code,
      message: apiError?.error || error.message,
    });

    throw new Error(apiError?.error || error.message || 'Failed to send SMS');
  }
};

module.exports = {
  isConfigured,
  sendRawEmail,
  sendRawSms,
  config: {
    fromEmail: HDM_FROM_EMAIL,
    fromName: HDM_FROM_NAME,
    apiUrl: HDM_API_URL,
  },
};