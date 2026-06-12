const nodemailer = require("nodemailer");
const { google } = require("googleapis");

const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  "http://localhost",
);

oauth2Client.setCredentials({
  refresh_token: process.env.REFRESH_TOKEN,
});

const createTransporter = async () => {
  // googleapis auto refresh access token
  const accessToken = await oauth2Client.getAccessToken();

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: process.env.EMAIL_USER,
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      refreshToken: process.env.REFRESH_TOKEN,
      accessToken: accessToken.token, // every time fresh token
    },
  });
};

const sendEmail = async (to, subject, text, html) => {
  try {
    const transporter = await createTransporter(); // fresh token every time
    const info = await transporter.sendMail({
      from: `"0diyas" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });
    console.log("Email sent:", info.messageId);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

const sendWelcomeEmail = async (userEmail, name) => {
  const subject = "Welcome to Odiseus Pay";

  const text = `
Hello ${name},

Welcome to Odiseus Pay! We're excited to have you join our secure digital payments platform.

You can now send and receive money safely and instantly.

Best regards,  
Odiseus Pay Team
`;

  const html = `
        <h2>Hello ${name},</h2>
        <p>Welcome to <strong>Odiseus Pay</strong></p>
        <p>We're excited to have you join our secure digital payments platform.</p>
        <p>You can now send and receive money safely and instantly.</p>
        <br/>
        <p>Best regards,<br/><strong>Odiseus Pay Team</strong></p>
    `;

  await sendEmail(userEmail, subject, text, html);
};

const sendTransactionSuccessEmail = async (
  userEmail,
  name,
  amount,
  toAccount,
) => {
  const subject = "Payment Successful - Odiseus Pay";

  const text = `
Hello ${name},

Your payment has been successfully processed through Odiseus Pay.

Amount: $${amount}
Sent To: ${toAccount}

If you did not authorize this transaction, please contact support immediately.

Best regards,  
Odiseus Pay Team
`;

  const html = `
        <h2>Hello ${name},</h2>
        <p>Your payment has been <strong style="color:green;">successfully processed</strong></p>
        <p><strong>Amount:</strong> $${amount}</p>
        <p><strong>Sent To:</strong> ${toAccount}</p>
        <p>If you did not authorize this transaction, please contact support immediately.</p>
        <br/>
        <p>Best regards,<br/><strong>Odiseus Pay Team</strong></p>
    `;

  await sendEmail(userEmail, subject, text, html);
};

const sendTransactionFailedEmail = async (
  userEmail,
  name,
  amount,
  toAccount,
) => {
  const subject = "Payment Failed - Odiseus Pay";

  const text = `
Hello ${name},

We were unable to process your payment via Odiseus Pay.

Amount: $${amount}
To: ${toAccount}

Please try again later or contact support if the issue continues.

Best regards,  
Odiseus Pay Team
`;

  const html = `
        <h2>Hello ${name},</h2>
        <p>Your payment attempt has <strong style="color:red;">failed</strong></p>
        <p><strong>Amount:</strong> $${amount}</p>
        <p><strong>To:</strong> ${toAccount}</p>
        <p>Please try again later or contact support if the issue continues.</p>
        <br/>
        <p>Best regards,<br/><strong>Odiseus Pay Team</strong></p>
    `;

  await sendEmail(userEmail, subject, text, html);
};

module.exports = {
  sendWelcomeEmail,
  sendTransactionSuccessEmail,
  sendTransactionFailedEmail,
};
