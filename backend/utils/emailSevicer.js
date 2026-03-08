const nodemailer = require("nodemailer");

const sendEmail = async (to, subject, html) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com", // Bắt buộc dùng host này thay cho service: "gmail"
    port: 465,              // Sử dụng port 465 (Bảo mật SSL)
    secure: true,           // true cho port 465
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    // Giới hạn thời gian kết nối để tránh lỗi treo server
    connectionTimeout: 10000, // 10 giây
    greetingTimeout: 10000,
    socketTimeout: 10000,
  });

  const mailOptions = {
    from: `"Hệ thống OTP" <${process.env.EMAIL_USER}>`, // Thêm tên hiển thị cho chuyên nghiệp
    to,
    subject,
    html,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Email đã được gửi thành công đến:", to);
  } catch (error) {
    console.error("Lỗi khi gửi email trong sendEmail:", error);
    throw error; // Ném lỗi ra để Controller bắt được
  }
};

module.exports = sendEmail;