const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: process.env.EMAIL_USER,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    refreshToken: process.env.REFRESH_TOKEN,
  },
});

// Verify the connection configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('Error connecting to email server:', error);
  } else {
    console.log('Email server is ready to send messages');
  }
});


const sendEmail = async (to, subject, text, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"" <${process.env.EMAIL_USER}>`, // sender address
      to, // list of receivers
      subject, // Subject line
      text, // plain text body
      html, // html body
    });

    console.log('Message sent: %s', info.messageId);
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
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