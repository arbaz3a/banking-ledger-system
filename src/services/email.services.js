const nodemailer = require('nodemailer');
const { google } = require('googleapis');

const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  'http://localhost'
);

oauth2Client.setCredentials({
  refresh_token: process.env.REFRESH_TOKEN,
});

const createTransporter = async () => {
  // googleapis auto refresh access token
  const accessToken = await oauth2Client.getAccessToken();

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: process.env.EMAIL_USER,
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      refreshToken: process.env.REFRESH_TOKEN,
      accessToken: accessToken.token,  // every time fresh token
    },
  });
};

const sendEmail = async (to, subject, text, html) => {
  try {
    const transporter = await createTransporter();  // fresh token every time
    const info = await transporter.sendMail({
      from: `"0diyas" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });
    console.log('Email sent:', info.messageId);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

const sendRegisterEmail = async (useremail, name) => {
  const subject = "Welcome to Our App";
  const text = `Hello ${name}, your account has been created successfully.`;
  const html = `
    <div style="font-family: Arial;">
      <h2>Welcome ${name}</h2>
      <p>Your account has been successfully created.</p>
      <p><b>Email:</b> ${useremail}</p>
      <p>Thanks for joining us!</p>
    </div>
  `;

  await sendEmail(useremail, subject, text, html);
};

module.exports = {sendRegisterEmail};