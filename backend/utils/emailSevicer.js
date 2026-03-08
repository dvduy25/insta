const nodemailer = require("nodemailer");

const sendEmail = async (to, subject, htmlContent) => {
  // Cấu hình ép buộc dùng port 465 an toàn và thiết lập thời gian chờ
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // Bắt buộc true với port 465
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    // Chống treo server trên Render
    connectionTimeout: 10000, // 10 giây
    socketTimeout: 10000,
    greetingTimeout: 10000,
  });

  const mailOptions = {
    from: `"Hệ thống Xác Thực" <${process.env.EMAIL_USER}>`,
    to: to,
    subject: subject,
    html: htmlContent,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email đã được gửi thành công:", info.response);
    return info;
  } catch (error) {
    console.error("❌ Lỗi cấu hình Nodemailer hoặc bị Render chặn:", error);
    throw error; // Ném lỗi để userController trả về status 500
  }
};

module.exports = sendEmail;