const Notification = require("../user/notification"); // path phù hợp
// nếu cần populate user info:
const UserModel = require("../user/userModel");

const notifications = {
  // GET /notifications
  getNotifications: async (req, res) => {
    try {
      const userId = req.user.id;
      const list = await Notification.find({ user: userId })
        .populate('from', 'name avatar')
        .populate('postId', 'imageUrl videoUrl')
        .sort({ createdAt: -1 })
        .limit(100); // tùy chỉnh
      return res.status(200).json({ notifications: list });
    } catch (err) {
      console.error("getNotifications error:", err);
      return res.status(500).json({ message: 'Lỗi server' });
    }
  },

  // PUT /notifications/:id/read  -> đánh dấu 1 thông báo đã đọc
  markRead: async (req, res) => {
    try {
      const userId = req.user.id;
      const id = req.params.id;
      const n = await Notification.findOneAndUpdate(
        { _id: id, user: userId },
        { read: true },
        { new: true }
      );
      if (!n) return res.status(404).json({ message: 'Notification không tồn tại' });
      return res.status(200).json({ notification: n });
    } catch (err) {
      console.error("markRead error:", err);
      return res.status(500).json({ message: 'Lỗi server' });
    }
  },

  // PUT /notifications/read-all -> đánh dấu tất cả đã đọc
  markAllRead: async (req, res) => {
    try {
      const userId = req.user.id;
      await Notification.updateMany({ user: userId, read: false }, { read: true });
      return res.status(200).json({ message: 'Đã đánh dấu tất cả là đã đọc' });
    } catch (err) {
      console.error("markAllRead error:", err);
      return res.status(500).json({ message: 'Lỗi server' });
    }
  },

  // (tùy) DELETE /notifications/:id -> xóa notification
  deleteNotification: async (req, res) => {
    try {
      const userId = req.user.id;
      const id = req.params.id;
      const n = await Notification.findOneAndDelete({ _id: id, user: userId });
      if (!n) return res.status(404).json({ message: 'Notification không tồn tại' });
      return res.status(200).json({ message: 'Đã xóa' });
    } catch (err) {
      console.error("deleteNotification error:", err);
      return res.status(500).json({ message: 'Lỗi server' });
    }
  }
};

module.exports = notifications;
