const mongoose = require('mongoose');

const dotenv = require("dotenv");

const UserModel = require("../user/userModel");

const bcrypt = require("bcrypt");

const jwt = require("jsonwebtoken");

const sendEmail = require("../utils/emailSevicer");
const Notification = require("../user/Notification"); // Đường dẫn tuỳ vào cấu trúc thư mục của bạn


dotenv.config();

const uri = process.env.mongodb_url;

let refreshTokens = [];



const router = {

  avt: async (req, res) => {

    try {

      await mongoose.connect(uri);



      //  Kiểm tra user từ token

      if (!req.user || !req.user.name || !req.user.email) {

        return res.status(400).json({ error: "Thiếu thông tin người dùng từ token" });

      }



     

      if (!req.file) {

        return res.status(400).json({ error: "Không có file ảnh được gửi lên" });

      }



     

      const imageUrl = `/upload/${req.file.filename}`;



     

      const updatedUser = await UserModel.findOneAndUpdate(

        {

          name: req.user.name,

          email: req.user.email,

        },

        {

          avatar: imageUrl,

        },

        {

          new: true,     // Trả về bản ghi đã cập nhật

         

        }

      );



     

      if (!updatedUser) {

        return res.status(404).json({ error: "Không tìm thấy người dùng" });

      }



   

      return res.status(200).json({

        status: 200,

        message: "Cập nhật ảnh đại diện thành công",

        avatar: imageUrl,

        user: updatedUser,

      });



    } catch (err) {

      console.error("Lỗi upload:", err);

      return res.status(500).json({ error: "Lỗi máy chủ khi upload ảnh" });

    }

  },



  duy12: async (req, res) => {

    try {





      await mongoose.connect(uri);

      let newuser = await UserModel.find().select('-password');

      let newuse = await UserModel.findById(req.user.id).select('-password');

      if (newuse.verified == true) {

        return res.status(200).json({

          status: 200,

          user: newuser,

          use: newuse

        });

      }

      else {

        return res.status(200).json({ message: "chua xac thuc" });

      }



    } catch (err) {

      res.status(500).json(err)

    }

  },



  verifyOtp: async (req, res) => {

    try {

      await mongoose.connect(uri);

      const { email, otp } = req.body;



      const user = await UserModel.findOne({ email });



      if (!user) return res.status(404).json({ error: "Không tìm thấy người dùng" });

      if (user.verified) return res.status(400).json({ error: "Tài khoản đã được xác thực" });

      if (user.otp !== otp) return res.status(400).json({ error: "OTP không đúng" });

      if (user.otpExpires < Date.now()) return res.status(400).json({ error: "OTP đã hết hạn" });



      // Cập nhật xác thực

      user.verified = true;

      user.otp = null;

      user.otpExpires = null;

      await user.save();



      return res.status(200).json({ status: 200, message: "Xác thực thành công. Bạn có thể đăng nhập." });

    } catch (err) {

      console.error("Lỗi xác thực OTP:", err);

      res.status(500).json({ error: "Lỗi server khi xác thực OTP" });

    }

  },



  do: async (req, res) => {
    try {
      const { name, email, password } = req.body;

      // 1. Kiểm tra xem người dùng đã nhập đủ thông tin chưa
      if (!name || !email || !password) {
        return res.status(400).json({ error: "Vui lòng cung cấp đầy đủ tên, email và mật khẩu." });
      }

      // 2. Kiểm tra xem email đã tồn tại trong hệ thống chưa
      const existingUser = await UserModel.findOne({ email });

      if (existingUser && existingUser.verified) {
        return res.status(400).json({ error: "Email này đã được đăng ký và xác thực." });
      }

      // 3. Tạo mã OTP 6 chữ số và đặt thời gian hết hạn (5 phút)
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpires = new Date(Date.now() + 5 * 60 * 1000);
      
      // 4. Mã hóa mật khẩu
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      let user;

      // 5. Cập nhật hoặc Tạo mới User
      if (existingUser && !existingUser.verified) {
        // Trường hợp user đã đăng ký nhưng chưa xác thực OTP (gửi lại yêu cầu)
        user = await UserModel.findOneAndUpdate(
          { email },
          { name, password: hashedPassword, otp, otpExpires, verified: false },
          { new: true }
        );
      } else {
        // Trường hợp user hoàn toàn mới
        user = new UserModel({
          name,
          email,
          password: hashedPassword,
          otp,
          otpExpires,
          verified: false
        });
        await user.save();
      }

      if (!user) {
        return res.status(500).json({ error: "Không thể tạo hoặc cập nhật thông tin người dùng." });
      }

      // 6. Gửi email chứa mã OTP với giao diện HTML thân thiện hơn
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2 style="color: #4CAF50;">Xác thực tài khoản của bạn</h2>
          <p>Xin chào <strong>${name}</strong>,</p>
          <p>Cảm ơn bạn đã đăng ký. Mã OTP để xác thực tài khoản của bạn là:</p>
          <h1 style="color: #d9534f; background-color: #f9f9f9; padding: 10px; display: inline-block; border-radius: 5px;">${otp}</h1>
          <p>Mã này sẽ hết hiệu lực sau <strong>5 phút</strong>.</p>
          <p>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.</p>
        </div>
      `;
      await sendEmail(email, "Xác thực đăng ký - Mã OTP", htmlContent);

      // 7. Trả về phản hồi thành công
      return res.status(200).json({
        status: 200,
        success: true,
        message: "Đã gửi mã OTP đến email của bạn. Vui lòng kiểm tra hộp thư để xác thực."
      });

    } catch (err) {
      console.error("Lỗi trong quá trình đăng ký (registerUser):", err);
      return res.status(500).json({ error: "Đã xảy ra lỗi máy chủ khi đăng ký tài khoản." });
    }
  },



  generateAccessToken: (newuser) => {

    return jwt.sign({

      id: newuser.id,

      name: newuser.name,

      email: newuser.email,

      admin: newuser.admin

    },

      process.env.key,

      { expiresIn: "350d" }

    )

  },

  generateRefreshToken: (newuser) => {

    return jwt.sign({

      id: newuser.id,

      name: newuser.name,

      email: newuser.email,

      admin: newuser.admin

    },

      process.env.keyRefresh,

      { expiresIn: "365d" }

    );

  },



  van: async (req, res) => {

    await mongoose.connect(uri);

    try {



      const newuser = await UserModel.findOne({ name: req.body.name });

      if (!newuser) {

        return res.status(404).json("sai")

      }

      const lgp = await bcrypt.compare(

        req.body.password,

        newuser.password

      )

      if (!lgp) {

        return res.status(404).json("sai mk")

      }

      if (newuser && lgp) {

        const accessToken = router.generateAccessToken(newuser);

        const refreshToken = router.generateRefreshToken(newuser);

        refreshTokens.push(refreshToken);

        res.cookie("refreshToken", refreshToken, {

          httpOnly: true,

          secure: false,         // true nếu bạn dùng HTTPS

          sameSite: "lax",       // hoặc "none" nếu dùng HTTPS

          path: "/"

        });









        const { password, ...others } = newuser._doc;

        return res.status(200).json({

          status: 200,

          user: others,

          accessToken,

          refreshToken

        });



      }

    } catch (err) {

      return res.status(500).json(err)

    }



  },

  delete: async (req, res) => {

    try {

      const newuser = await UserModel.findByIdAndDelete(req.params.id);

      res.status(200).json("xoa thanh cong");

    } catch (err) {

      res.status(500).json(err);

    }





  },

  requestRefreshToken: async (req, res) => {

    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {

      return res.status(401).json("chua dang nhap")

    }

    if (!refreshTokens.includes(refreshToken)) {

      return res.status(200).json("ko phai la ban")

    }

    jwt.verify(refreshToken, process.env.keyRefresh, (err, newuser) => {

      if (err) {

        console.log(err);

      }

      refreshTokens = refreshTokens.filter((token) => token !== refreshToken)

      const newAccessToken = router.generateAccessToken(newuser);

      const newRefreshToken = router.generateRefreshToken(newuser);

      refreshTokens.push(newRefreshToken)

      res.cookie("refreshToken", newRefreshToken, {

        httpOnly: true,

        secure: false,

        path: "/",

        sameSite: "strict",

      })

      res.status(200).json({ accessToken: newAccessToken })

    })



  },



  useLogout: async (req, res) => {

    try {

      const refreshToken = req.cookies.refreshToken;

      console.log('RefreshToken từ cookie:', refreshToken);



      if (!refreshToken) {

        return res.status(400).json({ message: "Không có refresh token để đăng xuất" });

      }



      // Loại bỏ refresh token khỏi danh sách

      refreshTokens = refreshTokens.filter(token => token !== refreshToken);



      // Xoá cookie refreshToken trên trình duyệt client

      res.clearCookie("refreshToken", {

        httpOnly: true,

        secure: false, // Chạy local để false, production https thì true

        sameSite: "lax", // thử đổi từ strict sang lax để test

        path: "/"

      });



      return res.status(200).json({ message: "Đăng xuất thành công" });

    } catch (err) {

      console.error("Lỗi khi đăng xuất:", err);

      return res.status(500).json({ message: "Lỗi server khi đăng xuất" });

    }

  },

  followUser: async (req, res) => {
    try {
      const currentUserId = req.user.id;
      const targetUserId = req.params.id;

      if (currentUserId === targetUserId) {
        return res.status(400).json({ message: "Không thể tự theo dõi chính mình." });
      }

      const currentUser = await UserModel.findById(currentUserId);
      const targetUser = await UserModel.findById(targetUserId);

      if (!targetUser) return res.status(404).json({ message: "Người dùng không tồn tại." });

      const isFollowing = currentUser.following.some(id => id.equals(targetUserId));

      if (isFollowing) {
        // --- TRƯỜNG HỢP BỎ THEO DÕI (UNFOLLOW) ---
        currentUser.following = currentUser.following.filter(id => !id.equals(targetUserId));
        targetUser.followers = targetUser.followers.filter(id => !id.equals(currentUserId));
        
        // (Tùy chọn) Có thể xóa thông báo cũ nếu muốn
        // await Notification.findOneAndDelete({ user: targetUserId, from: currentUserId, type: 'follow' });

      } else {
        // --- TRƯỜNG HỢP THEO DÕI (FOLLOW) ---
        currentUser.following.push(targetUserId);
        targetUser.followers.push(currentUserId);

        // 1. Tạo thông báo lưu vào DB
        const newNotification = await Notification.create({
          user: targetUserId,       // Người nhận thông báo (người được follow)
          from: currentUserId,      // Người gửi (người đi follow)
          type: 'follow',           // Loại thông báo để frontend chuyển hướng
          content: 'đã bắt đầu theo dõi bạn.'
        });

        // 2. Populate thông tin người gửi để hiển thị Avatar/Tên ngay lập tức
        await newNotification.populate('from', 'name avatar');

        // 3. Gửi Socket realtime (Nếu có cấu hình socket.io)
        const io = req.app.get('io');
        if (io) {
          // Gửi sự kiện đến room của người nhận (targetUserId)
          io.to(String(targetUserId)).emit('newNotification', newNotification);
        }
      }

      await currentUser.save();
      await targetUser.save();

      res.status(200).json({
        status: 200,
        following: currentUser.following.length,
        followers: targetUser.followers.length,
        isFollowing: !isFollowing,
        message: isFollowing ? "Đã bỏ theo dõi" : "Đã theo dõi",
      });

    } catch (err) {
      console.error("Follow error:", err);
      res.status(500).json({ message: "Lỗi server" });
    }
  },



 



}





module.exports = router;