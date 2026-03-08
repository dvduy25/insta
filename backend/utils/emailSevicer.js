const { Resend } = require('resend');
require('dotenv').config();

// Khởi tạo Resend với API Key lấy từ biến môi trường
const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async (to, subject, htmlContent) => {
  try {
    const data = await resend.emails.send({
      from: 'Hệ thống Xác Thực <onboarding@resend.dev>', // Bắt buộc dùng email này ở gói Free
      to: to,
      subject: subject,
      html: htmlContent,
    });
    
    console.log("✅ Gửi email thành công qua Resend:", data.id);
    return data;
  } catch (error) {
    console.error("❌ Lỗi khi gửi email bằng Resend:", error);
    throw error;
  }
};

module.exports = sendEmail;