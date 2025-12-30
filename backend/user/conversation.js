const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema({
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'logins' }], // user model name của bạn
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
}, { timestamps: true });

module.exports = mongoose.model('Conversation', ConversationSchema);
