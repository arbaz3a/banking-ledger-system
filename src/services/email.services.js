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

const sendTransactionSenderEmail = async (
  userEmail,
  name,
  amount,
  receiverName,
) => {
  const subject = "Payment Successful - Odiseus Pay";
  // console.log(userEmail)
  // console.log(receiverName)

  const text = `
Hello ${name},

Your payment has been successfully processed through Odiseus Pay.

Transaction Details:
Amount: PK ${amount}
Sent To: ${receiverName}
Status: COMPLETED

If you did not authorize this transaction, please contact support immediately.

Best regards,
Odiseus Pay Team
`;

  const html = `
    <h2>Hello ${name},</h2>

    <p>
      Your payment has been
      <strong style="color:green;">successfully processed</strong>.
    </p>

    <h3>Transaction Details</h3>
    <p><strong>Amount:</strong> PK ${amount}</p>
    <p><strong>Sent To:</strong> ${receiverName}</p>
    <p><strong>Status:</strong> COMPLETED</p>

    <p>
      If you did not authorize this transaction, please contact support
      immediately.
    </p>

    <br />

    <p>
      Best regards,<br />
      <strong>Odiseus Pay Team</strong>
    </p>
  `;

  await sendEmail(userEmail, subject, text, html);
};

const sendTransactionReceivedEmail = async (
  userEmail,
  name,
  amount,
  senderName,
) => {
  const subject = "Payment Received - Odiseus Pay";
  // console.log(userEmail);
  // console.log(senderName);

  const text = `
Hello ${name},

You have successfully received a payment through Odiseus Pay.

Transaction Details:
Amount Received: PK ${amount}
Sent By: ${senderName}
Status: COMPLETED

The funds are now available in your account.

If you believe this transaction was made in error, please contact support immediately.

Best regards,
Odiseus Pay Team
`;

  const html = `
    <h2>Hello ${name},</h2>

    <p>
      You have successfully received a
      <strong style="color:green;">payment</strong>.
    </p>

    <h3>Transaction Details</h3>
    <p><strong>Amount Received:</strong> PK ${amount}</p>
    <p><strong>Sent By:</strong> ${senderName}</p>
    <p><strong>Status:</strong> COMPLETED</p>

    <p>The funds are now available in your account.</p>

    <p>
      If you believe this transaction was made in error, please contact
      support immediately.
    </p>

    <br />

    <p>
      Best regards,<br />
      <strong>Odiseus Pay Team</strong>
    </p>
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

const sendPasswordResetEmail = async (userEmail, name, resetLink) => {
  const subject = "Password Reset Request - Odiseus Pay";

  const text = `
Hello ${name},

You requested to reset your password. Please click the link below to set a new password:
${resetLink}

If you did not request a password reset, please ignore this email.

Best regards,
Odiseus Pay Team
`;

  const html = `
    <h2>Hello ${name},</h2>
    <p>You requested to reset your password. Please click the link below to set a new password:</p>
    <a href="${resetLink}" style="padding: 10px 15px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
    <p>If the button doesn't work, you can copy and paste the following link into your browser:</p>
    <p>${resetLink}</p>
    <p>If you did not request a password reset, please ignore this email.</p>
    <br/>
    <p>Best regards,<br/><strong>Odiseus Pay Team</strong></p>
  `;

  await sendEmail(userEmail, subject, text, html);
};

module.exports = {
  sendWelcomeEmail,
  sendTransactionSenderEmail,
  sendTransactionReceivedEmail,
  sendTransactionFailedEmail,
  sendPasswordResetEmail,
};
