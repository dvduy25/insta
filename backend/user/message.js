const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'logins', required: true },
  text: { type: String, default: '' },
  attachments: [{
    url: String,
    type: { type: String, enum: ['image', 'video'], default: 'image' }
  }],// lưu đường dẫn file (ví dụ: /upload/xxx.jpg)
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'logins' }], // danh sách user đã đọc
}, { timestamps: true });

module.exports = mongoose.model('Message', MessageSchema);
