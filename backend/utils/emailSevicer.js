const nodemailer = require("nodemailer");
require('dotenv').config();

const sendEmail = async (to, subject, html) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
     port: 465, // Đổi từ 587 sang 465
  secure: true, // Bắt buộc là true khi dùng cổng 465 // Dùng TLS
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // Mật khẩu ứng dụng 16 ký tự
      },
      connectionTimeout: 10000,
    });

    const mailOptions = {
      from: `"Hệ thống OTP" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: subject,
      html: html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email đã được gửi thành công:", info.messageId);
    return info;

  } catch (error) {
    console.error("❌ Lỗi gửi email bằng Nodemailer:", error.message);
    // Nếu lỗi 'Invalid login', kiểm tra lại App Password nhé!
    throw error;
  }
};

module.exports = sendEmail;