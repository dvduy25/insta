const nodemailer = require("nodemailer");

const sendEmail = async (to, subject, html) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // Bắt buộc false cho cổng 587
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // Đây phải là App Password 16 ký tự
    },
    tls: {
      // Giúp vượt qua các lỗi xác thực chứng chỉ trên server hosting
      rejectUnauthorized: false,
    },
  });

  const mailOptions = {
    from: `"Instagram Clone" <${process.env.EMAIL_USER}>`, // Hiển thị tên người gửi chuyên nghiệp hơn
    to,
    subject,
    html,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully to:", to);
  } catch (error) {
    console.error("Nodemailer Error:", error);
    throw error; // Ném lỗi để Controller nhận biết và xử lý
  }
};

module.exports = sendEmail;