import nodemailer from 'nodemailer';

/**
 * Create and configure nodemailer transporter
 */
function createTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_EMAIL,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
}

/**
 * Send email notification to admin when a new inquiry is submitted
 */
export async function sendInquiryNotificationToAdmin({ inquirerName, inquirerEmail, inquirerPhone, message, roomId }) {
  const transporter = createTransporter();
  
  const adminEmail = process.env.ADMIN_EMAIL || process.env.GMAIL_EMAIL;
  const subject = roomId 
    ? `🏠 New Room Inquiry from ${inquirerName}` 
    : `📬 New Contact Form Message from ${inquirerName}`;
  
  const text = `
New Inquiry Received
===================

Name: ${inquirerName}
Email: ${inquirerEmail}
Phone: ${inquirerPhone || 'Not provided'}
${roomId ? `Room ID: ${roomId}` : 'Type: General Contact Form'}

Message:
--------
${message}

--------
Received at: ${new Date().toISOString()}
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
    .field { margin-bottom: 15px; }
    .label { font-weight: bold; color: #555; }
    .value { margin-top: 5px; padding: 10px; background: white; border-radius: 4px; border: 1px solid #ddd; }
    .message-box { white-space: pre-wrap; }
    .footer { margin-top: 20px; font-size: 12px; color: #888; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="margin: 0;">🏠 New Inquiry Received</h2>
    </div>
    <div class="content">
      <div class="field">
        <div class="label">Name</div>
        <div class="value">${inquirerName}</div>
      </div>
      <div class="field">
        <div class="label">Email</div>
        <div class="value"><a href="mailto:${inquirerEmail}">${inquirerEmail}</a></div>
      </div>
      <div class="field">
        <div class="label">Phone</div>
        <div class="value">${inquirerPhone || 'Not provided'}</div>
      </div>
      ${roomId ? `
      <div class="field">
        <div class="label">Room ID</div>
        <div class="value">${roomId}</div>
      </div>
      ` : ''}
      <div class="field">
        <div class="label">Message</div>
        <div class="value message-box">${message}</div>
      </div>
    </div>
    <div class="footer">
      Received at: ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' })}
    </div>
  </div>
</body>
</html>
  `.trim();

  try {
    await transporter.sendMail({
      from: `"Windsor Residence" <${process.env.GMAIL_EMAIL}>`,
      to: adminEmail,
      subject,
      text,
      html,
    });
    console.log(`📧 Inquiry notification sent to admin: ${adminEmail}`);
    return true;
  } catch (error) {
    console.error('Failed to send inquiry notification email:', error.message);
    return false;
  }
}

/**
 * Send email reply notification to the inquirer
 */
export async function sendReplyNotificationToInquirer({ inquirerEmail, inquirerName, inquiryId, replyMessage }) {
  const transporter = createTransporter();
  
  const subject = `📬 Windsor Residence: We have responded to your inquiry`;
  
  const text = `
Hello ${inquirerName},
===================

We have responded to your inquiry at Windsor Residence.

Our Reply:
----------
${replyMessage}

Best regards,
Windsor Residence Team

---
This is an automated message. Please do not reply directly to this email.
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
    .greeting { font-size: 18px; margin-bottom: 15px; }
    .reply-box { background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0; white-space: pre-wrap; }
    .footer { margin-top: 20px; font-size: 12px; color: #888; text-align: center; padding-top: 20px; border-top: 1px solid #ddd; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="margin: 0;">📬 Windsor Residence</h2>
      <p style="margin: 10px 0 0 0;">We've responded to your inquiry</p>
    </div>
    <div class="content">
      <div class="greeting">Hello ${inquirerName},</div>
      <p>Thank you for reaching out to Windsor Residence. We have reviewed your inquiry and here is our response:</p>
      <div class="reply-box">${replyMessage}</div>
    </div>
    <div class="footer">
      <p>Best regards,<br><strong>Windsor Residence Team</strong></p>
      <p style="margin-top: 15px;">This is an automated message. Please do not reply directly to this email.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  try {
    await transporter.sendMail({
      from: `"Windsor Residence" <${process.env.GMAIL_EMAIL}>`,
      to: inquirerEmail,
      subject,
      text,
      html,
    });
    console.log(`📧 Reply notification sent to inquirer: ${inquirerEmail}`);
    return true;
  } catch (error) {
    console.error('Failed to send reply notification email:', error.message);
    return false;
  }
}

export default {
  sendInquiryNotificationToAdmin,
  sendReplyNotificationToInquirer,
};
