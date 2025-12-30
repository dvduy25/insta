const Post = require("../user/Post");
const UserModel = require("../user/userModel");
const mongoose = require('mongoose');
const dotenv = require("dotenv");

const Notification = require("../user/notification"); // Import model Notification
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
dotenv.config();
const uri = process.env.mongodb_url;
let refreshTokens = [];

const posts = {

    getPostById: async (req, res) => {
        try {
            const { id } = req.params;
            await mongoose.connect(uri);
            const post = await Post.findById(id)
                .populate("author", "name avatar")
                .populate("comments.user", ["name", "avatar"])
                .populate("sharedFrom");

            if (!post) return res.status(404).json({ message: "Không tìm thấy bài viết" });
            res.status(200).json(post);
        } catch (err) {
            res.status(500).json({ error: "Lỗi khi lấy bài viết" });
        }
    },


    createPost: async (req, res) => {
        try {
            await mongoose.connect(uri);

            const { content } = req.body;
            let imageUrl = [];
            let videoUrl = null;


            if (req.files) {
                if (req.files.images) {
                    imageUrl = req.files.images.map(f => `/upload/${f.filename}`);
                }
                if (req.files.video && req.files.video[0]) {
                    videoUrl = `/upload/${req.files.video[0].filename}`;
                }
            }


            const newPost = await Post.create({
                author: req.user.id,
                content,
                imageUrl,
                videoUrl
            });

            const user = await UserModel.findById(req.user.id).populate("followers", "_id");
            const followers = user.followers;

            // Thông báo cho followers khi có bài mới (Giữ nguyên logic cũ của bạn)
            if (followers && followers.length > 0) {
                await Promise.all(
                    followers.map(async (f) => {
                        const noti = await Notification.create({
                            user: f._id, // người nhận thông báo
                            type: "post",
                            from: req.user.id,
                            postId: newPost._id,
                            content: `đã đăng một bài viết mới`
                        });
                        
                        // Gửi socket realtime
                        const io = req.app.get('io');
                        if(io) {
                             const populatedNoti = await noti.populate('from', 'name avatar');
                             io.to(String(f._id)).emit('newNotification', populatedNoti);
                        }
                        return noti;
                    })
                );
            }

            res.status(200).json({
                status: 200,
                message: "Đăng bài thành công",
                post: newPost
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Không thể tạo bài viết." });
        }
    },


    getAllPosts: async (req, res) => {
        try {
            await mongoose.connect(uri);

            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 5;
            const skip = (page - 1) * limit;

            const totalPosts = await Post.countDocuments();

            const posts = await Post.find()
                .populate("author", ["name", "avatar"])
                .populate("comments.user", ["name", "avatar"])
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);

            const totalPages = Math.ceil(totalPosts / limit);

            return res.status(200).json({
                status: 200,
                currentPage: page,
                totalPages,
                hasNextPage: page < totalPages,
                posts,
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Không thể lấy bài viết." });
        }
    },

    getprofile: async (req, res) => {
        try {
            const { userId } = req.params;
            const currentUserId = req.user?.id;

            if (!currentUserId) {
                return res.status(401).json({ message: "Token không hợp lệ hoặc đã hết hạn" });
            }

            const page = Math.max(1, parseInt(req.query.page)) || 1;
            const limit = Math.min(10, parseInt(req.query.limit)) || 5;
            const skip = (page - 1) * limit;

            const [currentUser, user] = await Promise.all([
                UserModel.findById(currentUserId).select("following").lean(),
                UserModel.findById(userId).select("-password").lean()
            ]);

            if (!user) {
                return res.status(404).json({ message: "Người dùng không tồn tại" });
            }

            if (!currentUser) {
                return res.status(401).json({ message: "Người dùng chưa đăng nhập hợp lệ" });
            }

            const totalPosts = await Post.countDocuments({ author: userId });

            const posts = await Post.find({ author: userId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate("author", "name avatar")
                .populate("comments.user", "name avatar")
                .populate("likes", "name avatar")
                .lean();

            const [followerCount, followingCount] = await Promise.all([
                UserModel.countDocuments({ following: { $in: [userId] } }),
                user.following?.length || 0
            ]);

            return res.status(200).json({
                user,
                stats: {
                    followerCount,
                    followingCount
                },
                posts,
                pagination: {
                    currentPage: page,
                    totalPosts,
                    totalPages: Math.ceil(totalPosts / limit),
                    hasMore: page * limit < totalPosts
                },
                currentUserId,
                followingIds: currentUser.following || []
            });

        } catch (err) {
            console.error("Lỗi getProfile:", err);
            return res.status(500).json({ message: "Lỗi server" });
        }
    },


    getProfileMe: async (req, res) => {
        try {
            await mongoose.connect(uri);
            const myId = req.user.id; 

            if (!myId) {
                return res.status(401).json({ message: "Chưa đăng nhập" });
            }

            const page = Math.max(1, parseInt(req.query.page)) || 1;
            const limit = Math.min(10, parseInt(req.query.limit)) || 5;
            const skip = (page - 1) * limit;

            const user = await UserModel.findById(myId).select("-password").lean();
            
            if (!user) {
                return res.status(404).json({ message: "Không tìm thấy người dùng" });
            }

            const totalPosts = await Post.countDocuments({ author: myId });
            
            const posts = await Post.find({ author: myId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate("author", "name avatar")
                .populate("comments.user", "name avatar")
                .populate("likes", "name avatar")
                .lean();

            const followerCount = await UserModel.countDocuments({ following: { $in: [myId] } });
            const followingCount = user.following?.length || 0;

            return res.status(200).json({
                user, 
                stats: {
                    followerCount,
                    followingCount
                },
                posts, 
                pagination: {
                    currentPage: page,
                    totalPosts,
                    totalPages: Math.ceil(totalPosts / limit),
                    hasMore: page * limit < totalPosts
                },
                currentUserId: myId,
                followingIds: user.following || [] 
            });

        } catch (err) {
            console.error("Lỗi getProfileMe:", err);
            res.status(500).json({ error: "Lỗi server khi lấy thông tin cá nhân." });
        }
    },

    updatePost: async (req, res) => {
        try {
            await mongoose.connect(uri);
            const { content, imageUrl } = req.body;
            const post = await Post.findByIdAndUpdate(
                req.params.id,
                { content, imageUrl },
                { new: true }
            );
            res.json(post);
        } catch (err) {
            res.status(500).json({ error: "Không thể cập nhật bài viết." });
        }
    },

    deletePost: async (req, res) => {
        try {
            await mongoose.connect(uri);
            await Post.findByIdAndDelete(req.params.id);
            res.json({ message: "Xóa thành công." });
        } catch (err) {
            res.status(500).json({ error: "Không thể xóa." });
        }
    },

    // --- LOGIC LIKE POST (Đã thêm thông báo) ---
    likePost: async (req, res) => {
        try {
            await mongoose.connect(uri);
            const post = await Post.findById(req.params.id);
            if (!post) {
                return res.status(404).json({ message: "Bài viết không tồn tại" });
            }

            const userId = req.user.id;
            if (!userId) {
                return res.status(401).json({ message: "Không xác thực người dùng" });
            }
            if (!post.likes) {
                post.likes = [];
            }

            // Loại bỏ null
            post.likes = post.likes.filter(id => id !== null);

            const alreadyLiked = post.likes.includes(userId);
            
            if (alreadyLiked) {
                // UNLIKE
                post.likes = post.likes.filter(id => id.toString() !== userId.toString());
                await post.save();
                
                // (Optional) Xóa thông báo like cũ nếu muốn
                // await Notification.findOneAndDelete({ 
                //    user: post.author, from: userId, type: 'like', postId: post._id 
                // });

                return res.status(200).json({ status: 200, likes: post.likes.length });
            } else {
                // LIKE
                post.likes.push(userId);
                await post.save();

                // ✅ TẠO THÔNG BÁO LIKE
                // Chỉ tạo nếu người like KHÔNG phải là chủ bài viết
                if (post.author.toString() !== userId) {
                    const newNotification = await Notification.create({
                        user: post.author,        // Người nhận (chủ bài viết)
                        from: userId,             // Người like
                        type: 'like',             // Loại
                        postId: post._id,         // ID bài viết để chuyển hướng
                        content: 'đã thích bài viết của bạn.'
                    });

                    // Populate để hiển thị tên và avatar người like ngay lập tức
                    await newNotification.populate('from', 'name avatar');

                    // Gửi Socket Realtime
                    const io = req.app.get('io');
                    if (io) {
                        io.to(String(post.author)).emit('newNotification', newNotification);
                    }
                }

                return res.status(200).json({ status: 200, likes: post.likes.length });
            }

        } catch (err) {
            console.error("Like error:", err);
            res.status(500).json({ error: "Lỗi khi xử lý like" });
        }
    },

    // --- LOGIC COMMENTS (Đã thêm thông báo) ---
    comments: async (req, res) => {
        await mongoose.connect(uri);
        try {
            const { content } = req.body;
            const postId = req.params.id;
            const userId = req.user.id;

            if (!content) return res.status(400).json({ message: 'Nội dung bình luận không được để trống' });

            const post = await Post.findById(postId);
            if (!post) return res.status(404).json({ message: 'Không tìm thấy bài viết' });

            const comment = { user: userId, content, createdAt: new Date() };
            post.comments.push(comment);
            await post.save();

            // ✅ TẠO THÔNG BÁO COMMENT
            // Chỉ tạo nếu người comment KHÔNG phải là chủ bài viết
            if (post.author.toString() !== userId) {
                const newNotification = await Notification.create({
                    user: post.author,        // Người nhận
                    from: userId,             // Người comment
                    type: 'comment',          // Loại
                    postId: post._id,         // ID bài viết
                    content: `đã bình luận về bài viết của bạn: "${content.substring(0, 20)}${content.length > 20 ? '...' : ''}"`
                });

                await newNotification.populate('from', 'name avatar');

                // Gửi Socket Realtime
                const io = req.app.get('io');
                if (io) {
                    io.to(String(post.author)).emit('newNotification', newNotification);
                }
            }

            res.json({ status: 200, message: 'Bình luận thành công', posts: post });
        } catch (err) {
            console.error('Lỗi khi bình luận:', err);
            res.status(500).json({ status: 500, message: 'Lỗi server' });
        }
    },

}
module.exports = posts;