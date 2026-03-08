const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendEmail = async (to, subject, html) => {
  const mailOptions = {
    from: `"InstaClone" <${process.env.EMAIL_USER}>`,
    to: to,
    subject: subject,
    html: html
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;