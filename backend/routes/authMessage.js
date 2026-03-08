const Conversation = require('../user/conversation');
const Message = require('../user/message');
const UserModel = require('../user/userModel');
const Notification = require('../user/notification');
const mongoose = require('mongoose');

const messages = {

  getOrCreateConversation: async (req, res) => {
    try {
      const userId = req.user.id;
      const otherId = req.params.userId;

      if (!otherId) return res.status(400).json({ message: 'Thiếu userId' });
      if (userId === otherId) return res.status(400).json({ message: 'Không thể chat với chính mình' });

      let conv = await Conversation.findOne({
        members: { $all: [userId, otherId], $size: 2 }
      }).populate({
        path: 'lastMessage',
        populate: { path: 'sender', select: 'name avatar' }
      });

      if (!conv) {
        conv = await Conversation.create({ members: [userId, otherId] });
        await conv.populate({
          path: 'lastMessage',
          populate: { path: 'sender', select: 'name avatar' }
        });
      }

      return res.status(200).json({ conversation: conv });
    } catch (err) {
      console.error('getOrCreateConversation error:', err);
      return res.status(500).json({ message: 'Lỗi server' });
    }
  },

 
  sendMessage: async (req, res) => {
    try {
      const senderId = req.user.id;
      let { conversationId, text, toUser, tempId } = req.body;

   
       const attachments = [];
      if (req.files) {
        if (req.files.images) {
          req.files.images.forEach(f => {
            attachments.push({ url: `/upload/${f.filename}`, type: 'image' });
          });
        }
        if (req.files.videos) {
          req.files.videos.forEach(f => {
            attachments.push({ url: `/upload/${f.filename}`, type: 'video' });
          });
        }
      }

      // 🔄 Nếu chưa có conversationId → tạo mới
      if (!conversationId) {
        if (!toUser) return res.status(400).json({ message: 'Thiếu conversationId hoặc toUser' });

        let conv = await Conversation.findOne({
          members: { $all: [senderId, toUser], $size: 2 }
        });
        if (!conv) conv = await Conversation.create({ members: [senderId, toUser] });

        conversationId = conv._id;
      }

      const conv = await Conversation.findById(conversationId);
      if (!conv) return res.status(404).json({ message: 'Conversation không tồn tại' });

      const receiverId = conv.members.find(m => m.toString() !== senderId.toString());
      if (!receiverId) return res.status(400).json({ message: 'Không tìm thấy người nhận' });

      // 💬 Lưu message
      const message = await Message.create({
        conversationId,
        sender: senderId,
        text: text || '',
        attachments,
        readBy: [senderId],
      });


      await Conversation.findByIdAndUpdate(conversationId, {
        lastMessage: message._id,
        updatedAt: Date.now(),
      });

      await Notification.create({
        user: receiverId,
        type: 'message',
        from: senderId,
        conversationId,
        content: `Bạn có tin nhắn mới từ ${req.user.name}`,
      });


      await message.populate('sender', 'name avatar');

      const io = req.app.get('io');
      if (io) {
        io.in(String(conversationId)).emit('receiveMessage', {
          ...message.toObject(),
          conversationId,
          tempId,
        });
      }

      return res.status(200).json({ message: { ...message.toObject(), tempId } });

    } catch (err) {
      console.error('sendMessage error:', err);
      return res.status(500).json({ message: 'Lỗi server khi gửi tin nhắn' });
    }
  },


  getConversations: async (req, res) => {
    try {
      const userId = req.user.id;
      let conversations = await Conversation.find({ members: userId })
        .populate('members', 'name avatar')
        .populate({
          path: 'lastMessage',
          populate: { path: 'sender', select: 'name avatar' }
        })
        .sort({ updatedAt: -1 });

      const map = new Map();
      const unique = conversations.filter(conv => {
        const key = conv.members.map(m => m._id.toString()).sort().join('_');
        if (!map.has(key)) {
          map.set(key, true);
          return true;
        }
        return false;
      });

      const result = unique.map(conv => {
        const other = conv.members.find(m => m._id.toString() !== userId.toString());
        return {
          ...conv.toObject(),
          displayName: other ? other.name : "Ẩn danh",
          displayAvatar: other ? other.avatar : null
        };
      });

      return res.status(200).json({ conversations: result });
    } catch (err) {
      console.error('getConversations error:', err);
      return res.status(500).json({ message: 'Lỗi server khi lấy conversation' });
    }
  },

  getMessages: async (req, res) => {
    try {
      const { conversationId } = req.params;
      const messages = await Message.find({ conversationId })
        .sort({ createdAt: 1 })
        .populate('sender', 'name avatar');
      return res.status(200).json({ messages });
    } catch (err) {
      console.error('getMessages error:', err);
      return res.status(500).json({ message: 'Lỗi server' });
    }
  },


  markReadConversation: async (req, res) => {
    try {
      const userId = req.user.id;
      const { conversationId } = req.params;
      await Message.updateMany(
        { conversationId, readBy: { $ne: userId } },
        { $addToSet: { readBy: userId } }
      );
      return res.status(200).json({ message: 'Đã đánh dấu đã đọc' });
    } catch (err) {
      console.error('markReadConversation error:', err);
      return res.status(500).json({ message: 'Lỗi server' });
    }
  },


  deleteMessage: async (req, res) => {
    try {
      const userId = req.user.id;
      const { messageId } = req.params;
      const msg = await Message.findById(messageId);
      if (!msg) return res.status(404).json({ message: 'Không tìm thấy tin nhắn' });
      if (msg.sender.toString() !== userId && !req.user.admin)
        return res.status(403).json({ message: 'Không có quyền xóa tin nhắn' });

      await msg.deleteOne();
      return res.status(200).json({ message: 'Đã xóa tin nhắn' });
    } catch (err) {
      console.error('deleteMessage error:', err);
      return res.status(500).json({ message: 'Lỗi server' });
    }
  }
};

module.exports = messages;
