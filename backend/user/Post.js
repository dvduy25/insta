const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'logins' },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});
const PostSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: "logins", required: true },
  content: { type: String, required: true },
  imageUrl: [{ type: String }],
  videoUrl: { type: String }, 
  createdAt: { type: Date, default: Date.now },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "logins" }],
  comments: [commentSchema] ,
  sharedFrom: { type: mongoose.Schema.Types.ObjectId, ref: "Post", default: null },
  shareCaption: { type: String, default: "" },

});


module.exports = mongoose.model("Post", PostSchema);
