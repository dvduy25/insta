<template>
  <div class="instagram-layout-light">
    
    <Sidebar :user="me" :activeId="'notifications'" />

    <div class="content-area">
      <div class="notifications-wrapper">
        <div class="page-title">
          <h2>Thông báo</h2>
        </div>

        <div class="notification-group">
          <div class="group-header" v-if="notifications.length">
             <span>Mới nhất</span>
             <button class="mark-all-btn" @click="markAllAsRead">Đánh dấu tất cả đã đọc</button>
          </div>

          <div v-if="notifications.length > 0">
            <div v-for="n in notifications" :key="n._id"
                 class="notif-item"
                 :class="{ 'unread': !n.read }"
                 @click="handleNotificationClick(n)">
              
              <div class="notif-avatar-wrapper">
                <img v-if="n.from?.avatar" :src="getImageUrl(n.from.avatar)" class="avatar" />
                <div v-else class="avatar-placeholder"></div>
                
                <div class="icon-badge like" v-if="n.type === 'like'">
                  <svg fill="white" height="12" viewBox="0 0 24 24" width="12"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.15C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path></svg>
                </div>
                <div class="icon-badge comment" v-if="n.type === 'comment'">
                  <svg fill="white" height="12" viewBox="0 0 24 24" width="12"><path d="M20.656 17.008a9.993 9.993 0 10-3.59 3.615L22 22z" fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="2"></path></svg>
                </div>
                <div class="icon-badge follow" v-if="n.type === 'follow'">
                  <svg fill="white" height="12" viewBox="0 0 24 24" width="12"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"></path></svg>
                </div>
              </div>

              <div class="notif-content">
                <span class="username">{{ n.from?.name || "Người dùng" }}</span>
                <span class="text">{{ n.content }}</span>
                <span class="time">{{ formatShortTime(n.createdAt) }}</span>
              </div>

              <div class="notif-action">
                
                <button v-if="n.type === 'follow'" class="btn-primary" @click.stop="handleFollowBack(n.from?._id)">
                  Theo dõi
                </button>
                
                <div v-else-if="n.postId && getPostImage(n.postId)" class="post-preview-wrapper">
                   <img :src="getPostImage(n.postId)" class="post-preview-img" />
                </div>

                <button class="btn-delete" @click.stop="deleteNotification(n._id)" title="Xóa thông báo">
                  <svg aria-label="Delete" fill="currentColor" height="16" viewBox="0 0 24 24" width="16"><path d="M3 6h18v2H3V6zm2 2h14v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V8zm5-4h6v2H10V4z"></path></svg>
                </button>

                <div v-if="!n.read" class="unread-dot"></div>
              </div>

            </div>
          </div>

          <div v-else class="empty-state">
            <div class="empty-icon">
               <svg aria-label="Activity Feed" fill="currentColor" height="60" viewBox="0 0 24 24" width="60"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.15C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" stroke="currentColor" stroke-width="1.5" fill="none"></path></svg>
            </div>
            <p>Hoạt động trên bài viết của bạn</p>
            <span>Khi có người thích hoặc bình luận về bài viết của bạn, bạn sẽ nhìn thấy thông báo ở đây.</span>
          </div>

        </div>
      </div>
    </div>

  </div>
</template>

<script>
import { ref, onMounted } from "vue";
import { io } from "socket.io-client";
import axios from "axios";
import { useRouter } from "vue-router";
import Sidebar from "../components/Sidebar.vue";

export default {
  name: "NotificationView",
  components: { Sidebar },
  setup() {
    const router = useRouter();
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    const me = ref(userStr ? JSON.parse(userStr) : {});
    
    const notifications = ref([]);
    const socket = io("http://localhost:8080", { auth: { token } });

    // Utility: Lấy URL ảnh (Avatar hoặc Post Image)
    const getImageUrl = (path) => path?.startsWith('http') ? path : `http://localhost:8080${path || ''}`;

    // Helper: Lấy ảnh thumbnail từ object postId (Cần backend populate 'postId')
    const getPostImage = (postObj) => {
        if (!postObj) return null;
        // Ưu tiên ảnh, nếu không có thì lấy video thumbnail (nếu backend xử lý) hoặc placeholder
        if (Array.isArray(postObj.imageUrl) && postObj.imageUrl.length > 0) {
            return getImageUrl(postObj.imageUrl[0]);
        }
        if (postObj.videoUrl) {
            // Nếu là video, có thể trả về một icon video hoặc poster
            // Ở đây tạm thời trả về URL video nếu trình duyệt hỗ trợ poster, hoặc null
            return null; // Video cần xử lý thumbnail riêng
        }
        return null;
    };

    const formatShortTime = (dateStr) => {
      const date = new Date(dateStr);
      const now = new Date();
      const diff = Math.floor((now - date) / 1000);

      if (diff < 60) return 'vừa xong';
      if (diff < 3600) return `${Math.floor(diff/60)}p`;
      if (diff < 86400) return `${Math.floor(diff/3600)}g`;
      if (diff < 604800) return `${Math.floor(diff/86400)}ng`;
      return `${Math.floor(diff/604800)}w`;
    };

    const fetchNotifications = async () => {
      try {
        const res = await axios.get("http://localhost:8080/notifications", {
          headers: { Authorization: `Bearer ${token}` }
        });
        notifications.value = res.data.notifications || [];
      } catch (e) { console.error(e); }
    };

    const markAsRead = async (id) => {
      try {
        await axios.put(`http://localhost:8080/notifications/${id}/read`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const n = notifications.value.find(x => x._id === id);
        if (n) n.read = true;
      } catch (e) { console.error(e); }
    };

    const markAllAsRead = async () => {
      try {
        await axios.put(`http://localhost:8080/notifications/read-all`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        notifications.value.forEach(n => n.read = true);
      } catch (e) { console.error(e); }
    };

    // --- CHỨC NĂNG XÓA THÔNG BÁO ---
    const deleteNotification = async (id) => {
      if(!confirm("Bạn có chắc muốn xóa thông báo này?")) return;
      try {
        await axios.delete(`http://localhost:8080/notifications/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        // Xóa khỏi danh sách local
        notifications.value = notifications.value.filter(n => n._id !== id);
      } catch (e) { 
        console.error("Lỗi xóa thông báo:", e); 
        alert("Không thể xóa thông báo");
      }
    };

    const handleNotificationClick = async (n) => {
      if (!n.read) await markAsRead(n._id);

      if (n.type === 'message') {
        router.push({ path: '/message', query: { conversationId: n.conversationId } });
      } 
      else if (n.type === 'follow') {
        router.push(`/profile/${n.from._id}`);
      }
      else if (n.postId) {
         // Chuyển đến bài viết (n.postId có thể là object hoặc string tùy populate)
         const pid = typeof n.postId === 'object' ? n.postId._id : n.postId;
         router.push(`/post/${pid}`);
      }
      else {
        if (n.from?._id) router.push(`/profile/${n.from._id}`);
      }
    };

    // --- Xử lý nút Follow lại ngay trên thông báo ---
    const handleFollowBack = async (userId) => {
        // Gọi API follow (Logic giống trang profile)
        try {
            await axios.post(`http://localhost:8080/follow/${userId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert("Đã gửi yêu cầu theo dõi!");
        } catch (e) { console.error(e); }
    };

    socket.on("newNotification", (noti) => {
      notifications.value.unshift(noti);
      // Có thể thêm toast thông báo nhỏ ở góc màn hình tại đây
    });

    onMounted(fetchNotifications);

    return {
      me, notifications, getImageUrl, getPostImage, formatShortTime, 
      handleNotificationClick, markAllAsRead, deleteNotification, handleFollowBack
    };
  }
};
</script>

<style scoped>
/* 1. LAYOUT CHUNG (Light Theme) */
.instagram-layout-light {
  display: flex;
  min-height: 100vh;
  background-color: #ffffff; /* Nền trắng */
  color: #000;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

/* 2. CONTENT AREA */
.content-area {
  flex: 1;
  display: flex;
  justify-content: center;
}

.notifications-wrapper {
  width: 100%;
  max-width: 600px;
  padding: 20px 0;
}

.page-title h2 {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 20px;
  padding: 0 20px;
  color: #000;
}

.group-header {
    display: flex;
    justify-content: space-between;
    padding: 10px 20px;
    font-weight: 600;
    font-size: 16px;
    border-bottom: 1px solid #efefef;
}
.mark-all-btn {
    background: none; border: none; color: #0095f6; font-weight: 600; cursor: pointer; font-size: 14px;
}

/* 3. NOTIFICATION ITEM */
.notif-item {
  display: flex;
  align-items: center;
  padding: 14px 20px;
  cursor: pointer;
  transition: background-color 0.2s;
  border-bottom: 1px solid #fafafa;
}

.notif-item:hover {
  background-color: #fafafa; /* Hover màu xám rất nhạt */
}

.notif-item:hover .btn-delete {
    opacity: 1; /* Hiện nút xóa khi hover */
}

/* Chưa đọc: nền xanh rất nhạt hoặc icon chấm xanh */
.notif-item.unread {
  background-color: #f0f9ff; /* Xanh nhạt */
}

/* Avatar Wrapper */
.notif-avatar-wrapper {
  position: relative;
  margin-right: 14px;
}

.avatar {
  width: 44px; height: 44px; border-radius: 50%; object-fit: cover;
  border: 1px solid #dbdbdb;
}

.avatar-placeholder {
  width: 44px; height: 44px; border-radius: 50%; background: #dbdbdb;
}

/* Icon nhỏ góc avatar */
.icon-badge {
  position: absolute; bottom: -2px; right: -2px;
  border-radius: 50%; width: 22px; height: 22px;
  display: flex; align-items: center; justify-content: center;
  border: 2px solid #fff;
}
.icon-badge.like { background: #ed4956; } /* Đỏ */
.icon-badge.comment { background: #0095f6; } /* Xanh */
.icon-badge.follow { background: #a855f7; } /* Tím */

/* Content Text */
.notif-content {
  flex: 1;
  font-size: 14px;
  line-height: 1.4;
  margin-right: 10px;
  color: #000;
}

.username { font-weight: 600; margin-right: 4px; cursor: pointer; }
.text { color: #262626; }
.time { color: #8e8e8e; margin-left: 4px; font-size: 13px; }

/* Action (Right side) */
.notif-action {
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn-primary {
  background-color: #0095f6;
  color: #fff;
  border: none;
  padding: 7px 16px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
}
.btn-primary:hover { background-color: #1877f2; }

/* Ảnh Preview bài viết */
.post-preview-wrapper {
    width: 44px; height: 44px;
}
.post-preview-img {
  width: 100%; height: 100%;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid #dbdbdb;
}

/* Nút xóa */
.btn-delete {
    background: none; border: none;
    color: #8e8e8e;
    cursor: pointer;
    opacity: 0; /* Ẩn mặc định */
    transition: opacity 0.2s, color 0.2s;
    padding: 4px;
}
.btn-delete:hover { color: #ed4956; }

.unread-dot {
  width: 8px; height: 8px;
  background-color: #0095f6;
  border-radius: 50%;
}

/* EMPTY STATE */
.empty-state {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 60px 20px; text-align: center;
}
.empty-icon {
  font-size: 40px; color: #262626;
  border: 2px solid #262626; border-radius: 50%;
  width: 70px; height: 70px;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 20px;
}
.empty-state p { font-size: 18px; margin-bottom: 10px; font-weight: 600; }
.empty-state span { color: #8e8e8e; font-size: 14px; max-width: 300px; }

/* RESPONSIVE */
@media (max-width: 768px) {
  .page-title { display: none; }
  .notifications-wrapper { padding: 0; }
  .btn-delete { opacity: 1; } /* Trên mobile hiện nút xóa luôn vì không có hover */
}
</style>