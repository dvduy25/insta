const UserModel = require("../user/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const sendEmail = require("../utils/emailSevicer");
const Notification = require("../user/Notification");

// Lưu ý: refreshTokens nên được lưu vào Database để tránh mất dữ liệu khi server Render restart
let refreshTokens = [];

const userController = {
  // --- 1. ĐĂNG KÝ VÀ GỬI OTP ---
  do: async (req, res) => {
    try {
      const { name, email, password } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({ error: "Vui lòng nhập đầy đủ thông tin." });
      }

      const existingUser = await UserModel.findOne({ email });
      if (existingUser && existingUser.verified) {
        return res.status(400).json({ error: "Email này đã được đăng ký và xác thực." });
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 phút

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      let user;
      if (existingUser && !existingUser.verified) {
        user = await UserModel.findOneAndUpdate(
          { email },
          { name, password: hashedPassword, otp, otpExpires, verified: false },
          { new: true }
        );
      } else {
        user = new UserModel({
          name, email, password: hashedPassword,
          otp, otpExpires, verified: false
        });
        await user.save();
      }

      const htmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee;">
          <h2 style="color: #4CAF50;">Xác thực tài khoản</h2>
          <p>Chào <b>${name}</b>, mã OTP của bạn là:</p>
          <h1 style="color: #d9534f; background: #f9f9f9; padding: 10px; display: inline-block;">${otp}</h1>
          <p>Mã có hiệu lực trong 5 phút.</p>
        </div>`;

      await sendEmail(email, "Xác thực đăng ký - Mã OTP", htmlContent);

      return res.status(200).json({
        status: 200,
        success: true,
        message: "Đã gửi mã OTP. Vui lòng kiểm tra email."
      });
    } catch (err) {
      console.error("Lỗi đăng ký:", err);
      return res.status(500).json({ error: "Lỗi máy chủ khi đăng ký." });
    }
  },

  // --- 2. XÁC THỰC OTP ---
  verifyOtp: async (req, res) => {
    try {
      const { email, otp } = req.body;
      const user = await UserModel.findOne({ email });

      if (!user) return res.status(404).json({ error: "Không tìm thấy người dùng" });
      if (user.verified) return res.status(400).json({ error: "Tài khoản đã xác thực" });
      if (user.otp !== otp) return res.status(400).json({ error: "OTP không chính xác" });
      if (user.otpExpires < Date.now()) return res.status(400).json({ error: "OTP đã hết hạn" });

      user.verified = true;
      user.otp = null;
      user.otpExpires = null;
      await user.save();

      return res.status(200).json({ status: 200, message: "Xác thực thành công. Hãy đăng nhập." });
    } catch (err) {
      return res.status(500).json({ error: "Lỗi hệ thống khi xác thực." });
    }
  },

  // --- 3. ĐĂNG NHẬP ---
  van: async (req, res) => {
    try {
      const user = await UserModel.findOne({ name: req.body.name });
      if (!user) return res.status(404).json({ error: "Tài khoản không tồn tại" });

      const isPasswordValid = await bcrypt.compare(req.body.password, user.password);
      if (!isPasswordValid) return res.status(404).json({ error: "Mật khẩu không đúng" });

      if (!user.verified) return res.status(403).json({ error: "Tài khoản chưa xác thực email" });

      const accessToken = userController.generateAccessToken(user);
      const refreshToken = userController.generateRefreshToken(user);

      refreshTokens.push(refreshToken);

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: true,   // Bắt buộc true trên Render (HTTPS)
        sameSite: "none", // Bắt buộc cho CORS giữa frontend/backend
        path: "/",
        maxAge: 365 * 24 * 60 * 60 * 1000 // 1 năm
      });

      const { password, otp, otpExpires, ...others } = user._doc;
      return res.status(200).json({
        status: 200,
        user: others,
        accessToken,
        refreshToken // Trả về nếu cần lưu ở LocalStorage
      });
    } catch (err) {
      return res.status(500).json({ error: "Lỗi server khi đăng nhập" });
    }
  },

  // --- 4. REFRESH TOKEN ---
  requestRefreshToken: async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) return res.status(401).json("Chưa đăng nhập");
    if (!refreshTokens.includes(refreshToken)) return res.status(403).json("Token không hợp lệ");

    jwt.verify(refreshToken, process.env.keyRefresh, (err, user) => {
      if (err) {
        refreshTokens = refreshTokens.filter(t => t !== refreshToken);
        return res.status(403).json("Token đã hết hạn");
      }

      refreshTokens = refreshTokens.filter(t => t !== refreshToken);
      const newAccessToken = userController.generateAccessToken(user);
      const newRefreshToken = userController.generateRefreshToken(user);

      refreshTokens.push(newRefreshToken);
      res.cookie("refreshToken", newRefreshToken, {
        httpOnly: true, secure: true, sameSite: "none", path: "/"
      });
      return res.status(200).json({ accessToken: newAccessToken });
    });
  },

  // --- 5. CẬP NHẬT ẢNH ĐẠI DIỆN ---
  avt: async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Token không hợp lệ" });
      if (!req.file) return res.status(400).json({ error: "Chưa chọn file" });

      const imageUrl = `/upload/${req.file.filename}`;
      const updatedUser = await UserModel.findByIdAndUpdate(
        req.user.id,
        { avatar: imageUrl },
        { new: true }
      ).select("-password");

      if (!updatedUser) return res.status(404).json({ error: "Không tìm thấy user" });

      return res.status(200).json({
        status: 200,
        message: "Cập nhật thành công",
        avatar: imageUrl,
        user: updatedUser,
      });
    } catch (err) {
      return res.status(500).json({ error: "Lỗi khi upload ảnh" });
    }
  },

  // --- 6. FOLLOW / UNFOLLOW ---
  followUser: async (req, res) => {
    try {
      const currentUserId = req.user.id;
      const targetUserId = req.params.id;

      if (currentUserId === targetUserId) return res.status(400).json({ message: "Không thể tự follow" });

      const currentUser = await UserModel.findById(currentUserId);
      const targetUser = await UserModel.findById(targetUserId);

      if (!targetUser) return res.status(404).json({ message: "User không tồn tại" });

      const isFollowing = currentUser.following.includes(targetUserId);

      if (isFollowing) {
        currentUser.following = currentUser.following.filter(id => id.toString() !== targetUserId);
        targetUser.followers = targetUser.followers.filter(id => id.toString() !== currentUserId);
      } else {
        currentUser.following.push(targetUserId);
        targetUser.followers.push(currentUserId);

        const newNoti = await Notification.create({
          user: targetUserId, from: currentUserId,
          type: 'follow', content: 'đã bắt đầu theo dõi bạn.'
        });
        await newNoti.populate('from', 'name avatar');

        const io = req.app.get('io');
        if (io) io.to(targetUserId).emit('newNotification', newNoti);
      }

      await currentUser.save();
      await targetUser.save();

      return res.status(200).json({
        status: 200,
        isFollowing: !isFollowing,
        followingCount: currentUser.following.length,
        followersCount: targetUser.followers.length
      });
    } catch (err) {
      return res.status(500).json({ message: "Lỗi server khi follow" });
    }
  },

  // --- 7. ĐĂNG XUẤT ---
  useLogout: async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    refreshTokens = refreshTokens.filter(token => token !== refreshToken);
    res.clearCookie("refreshToken", {
      httpOnly: true, secure: true, sameSite: "none", path: "/"
    });
    return res.status(200).json({ message: "Đăng xuất thành công" });
  },

  // --- HELPER FUNCTIONS ---
  generateAccessToken: (user) => {
    return jwt.sign(
      { id: user._id || user.id, name: user.name, email: user.email, admin: user.admin },
      process.env.key,
      { expiresIn: "1h" }
    );
  },

  generateRefreshToken: (user) => {
    return jwt.sign(
      { id: user._id || user.id, name: user.name, email: user.email, admin: user.admin },
      process.env.keyRefresh,
      { expiresIn: "365d" }
    );
  },

  delete: async (req, res) => {
    try {
      await UserModel.findByIdAndDelete(req.params.id);
      return res.status(200).json("Xóa thành công");
    } catch (err) {
      return res.status(500).json(err);
    }
  },

  duy12: async (req, res) => {
    try {
      const allUsers = await UserModel.find().select('-password');
      const currentUser = await UserModel.findById(req.user.id).select('-password');
      if (currentUser.verified) {
        return res.status(200).json({ status: 200, user: allUsers, use: currentUser });
      }
      return res.status(403).json({ message: "Chưa xác thực" });
    } catch (err) {
      return res.status(500).json(err);
    }
  },
};

module.exports = userController;