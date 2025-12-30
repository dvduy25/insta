const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'logins', required: true }, // người nhận thông báo
    type: { type: String, enum: ['message', 'post', 'like', 'comment', 'follow'], required: true }, // Đã thêm 'like', 'comment', 'follow'
    from: { type: mongoose.Schema.Types.ObjectId, ref: 'logins' }, // người gửi, người like, người comment, hoặc người follow
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation' }, // dùng khi type là 'message'
    postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' }, // dùng khi type là 'post', 'like', 'comment'
    content: String, // nội dung hiển thị (ví dụ: "đã thích bài viết của bạn")
    read: { type: Boolean, default: false },
    entityType: { type: String, enum: ['Post', 'Message', 'User'], default: 'Post' }, // Loại đối tượng cần điều hướng
}, { timestamps: true });

module.exports = mongoose.model('notification', NotificationSchema);
