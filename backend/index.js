const express = require('express');
const axios = require("axios");
const mongoose = require('mongoose');
const path = require("path");
const cors = require("cors");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const ejs = require("ejs");
const multer = require('multer');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const http = require('http');
const { Server } = require('socket.io');
const controller = require('./routes/authNotification');
const router = require("./routes/authRoute");
const middlewareController = require('./routes/midcontroller');
const postController = require("./routes/authPosts");
const messageController = require("./routes/authMessage");
const Message = require('./user/message');
const Conversation = require('./user/conversation');
const Notification = require("./user/notification");
const Logins = require("./user/userModel");


dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    credentials: true
  }
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.json());
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));


if (!process.env.mongodb_url) {
  console.error(" Lỗi: MONGO_URL chưa được khai báo trong file .env");
  process.exit(1);
}
mongoose.connect(process.env.mongodb_url)
  .then(() => console.log(" MongoDB Connected"))
  .catch(err => console.error("MongoDB error:", err));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});

const fileFilter = (req, file, cb) => {
  const allowed = [
    'image/jpeg', 'image/png', 'image/gif',
    'video/mp4', 'video/webm', 'video/ogg'
  ];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Chỉ cho phép upload ảnh hoặc video'));
};

const upload = multer({ storage, fileFilter });


//  Upload ảnh
app.post('/upload', middlewareController.verifyToken, upload.single('images'), router.avt);

//  Bài viết
app.post("/", middlewareController.verifyToken, upload.fields([
  { name: "images", maxCount: 5 },
  { name: "video", maxCount: 1 }
]), postController.createPost);
app.get("/", middlewareController.verifyToken, postController.getAllPosts);
// app.get("/profile/me", middlewareController.verifyToken, postController.getProfileMe);
app.get("/profile/:userId", middlewareController.verifyToken, postController.getprofile);
app.put("/update/:id", postController.updatePost);
app.get("/post/:id", middlewareController.verifyToken, postController.getPostById);

app.delete("/:id", postController.deletePost);
app.post("/:id/like", middlewareController.verifyToken, postController.likePost);
app.post("/:id/comment", middlewareController.verifyToken, postController.comments);

//  Auth & follow
app.post("/add", router.do);
app.post("/login", router.van);
app.get("/duy123", middlewareController.verifyToken, router.duy12);
app.post("/otp", router.verifyOtp);
app.delete("/delete/:id", middlewareController.verifyTokenAdmin, router.delete);
app.post("/refresh", router.requestRefreshToken);
app.post("/logout", middlewareController.verifyToken, router.useLogout);
app.post('/follow/:id', middlewareController.verifyToken, router.followUser);


app.get('/conversation/:userId', middlewareController.verifyToken, messageController.getOrCreateConversation);
app.get('/conversations', middlewareController.verifyToken, messageController.getConversations);
app.get('/conversation/:conversationId/messages', middlewareController.verifyToken, messageController.getMessages);
app.post('/message/send', middlewareController.verifyToken, middlewareController.verifyToken,
  upload.fields([
    { name: 'images', maxCount: 10 },
    { name: 'videos', maxCount: 2 }
  ]), messageController.sendMessage);
app.post('/conversation/:conversationId/read', middlewareController.verifyToken, messageController.markReadConversation);
app.delete('/message/:messageId', middlewareController.verifyToken, messageController.deleteMessage);

app.get('/notifications', middlewareController.verifyToken, controller.getNotifications);
app.put('/notifications/:id/read', middlewareController.verifyToken, controller.markRead);
app.put('/notifications/read-all', middlewareController.verifyToken, controller.markAllRead);
app.delete('/notifications/:id', middlewareController.verifyToken, controller.deleteNotification);
// tatic file
app.use('/upload', express.static(path.join(__dirname, 'uploads')));


const onlineUsers = new Map();

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (token) {
    try {
      socket.user = jwt.verify(token, process.env.key);
    } catch (err) {
      console.log(" JWT verify lỗi:", err.message);
    }
  }
  next();
});

io.on('connection', (socket) => {
  console.log(' Socket connected:', socket.id);
  const user = socket.user;

  if (user) {
    const list = onlineUsers.get(user.id) || [];
    list.push(socket.id);
    onlineUsers.set(user.id, list);
  }

  // Join/leave conversation
  socket.on('joinConversation', (conversationId) => socket.join(conversationId));
  socket.on('leaveConversation', (conversationId) => socket.leave(conversationId));



  socket.on('disconnect', () => {
    if (user) {
      const list = onlineUsers.get(user.id) || [];
      const updated = list.filter(id => id !== socket.id);
      if (updated.length) onlineUsers.set(user.id, updated);
      else onlineUsers.delete(user.id);
    }
    console.log(' Socket disconnected:', socket.id);
  });
});
app.set('io', io); 



const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(` Server đang chạy tại http://localhost:${PORT}`);
});
