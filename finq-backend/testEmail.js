require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmail() {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10),
    secure: process.env.SMTP_PORT == 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to: 'tanishprashar2005@gmail.com', // Replace with your email to receive the test
      subject: 'SMTP Test Email from FINQ',
      text: 'If you received this email, your SMTP settings are working correctly.',
    });
    console.log('Email sent:', info.messageId);
  } catch (err) {
    console.error('Email sending failed:', err);
  }
}

testEmail();
