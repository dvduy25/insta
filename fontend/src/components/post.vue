<template>
  <div class="instagram-layout-light">
    
    <Sidebar :user="me" />

    <div class="content-area">
      
      <div v-if="loading" class="loading-state">Đang tải...</div>

      <div v-else-if="!post" class="empty-state">
        <p>Bài viết không tồn tại hoặc đã bị xóa.</p>
        <button @click="goHome">Quay lại trang chủ</button>
      </div>

      <div v-else class="post-modal-light">
        
        <div class="post-media-col">
          <div class="media-container" @click="openLightbox">
            <template v-if="hasMedia(post)">
              <div v-if="currentMedia.type === 'image'" class="media-wrapper zoomable">
                <img :src="currentMedia.src" class="media-content contain-mode" />
              </div>
              <div v-else class="media-wrapper zoomable">
                <video :src="currentMedia.src" controls autoplay muted class="media-content contain-mode"></video>
              </div>

              <button v-if="mediaList.length > 1 && currentMediaIndex > 0" class="nav-btn prev" @click.stop="prevMedia">‹</button>
              <button v-if="mediaList.length > 1 && currentMediaIndex < mediaList.length - 1" class="nav-btn next" @click.stop="nextMedia">›</button>
              
              <div v-if="mediaList.length > 1" class="dots-indicator">
                 <span v-for="(m, i) in mediaList" :key="i" :class="{ active: i === currentMediaIndex }"></span>
              </div>
            </template>
            <div v-else class="no-media">Bài viết văn bản</div>
          </div>
        </div>

        <div class="post-info-col">
          
          <div class="col-header">
            <div class="user-row">
              <img :src="getImageUrl(post.author?.avatar)" class="avatar" />
              <div class="user-meta">
                <span class="username text-dark">{{ post.author?.name }}</span>
                <span class="location" v-if="post.location">{{ post.location }}</span>
              </div>
              <button class="more-options text-dark">•••</button>
            </div>
          </div>

          <div class="col-body custom-scrollbar">
            <div class="comment-row caption-row">
              <img :src="getImageUrl(post.author?.avatar)" class="avatar-small" />
              <div class="comment-text">
                <span class="username-inline text-dark">{{ post.author?.name }}</span>
                <span class="text-content text-dark">{{ post.content }}</span>
                <div class="time-ago">{{ formatTimeAgo(post.createdAt) }}</div>
              </div>
            </div>

            <div v-for="c in post.comments" :key="c._id" class="comment-row">
              <img :src="getImageUrl(c.user?.avatar)" class="avatar-small" />
              <div class="comment-text">
                <span class="username-inline text-dark">{{ c.user?.name || 'User' }}</span>
                <span class="text-content text-dark">{{ c.content }}</span>
                <div class="comment-meta">
                  <span class="time-ago">{{ formatTimeAgo(c.createdAt) }}</span>
                  <span class="reply-btn">Trả lời</span>
                </div>
              </div>
              <button class="like-comment-btn">♡</button>
            </div>
          </div>

          <div class="col-footer">
            <div class="action-icons">
              <div class="left-icons">
                <button @click="toggleLike" class="text-dark">
                  <svg v-if="liked" fill="#ed4956" viewBox="0 0 48 48" width="24" height="24"><path d="M34.6 3.1c-4.5 0-7.9 1.8-10.6 5.6-2.7-3.7-6.1-5.5-10.6-5.5C6 3.1 0 9.6 0 17.6c0 7.3 5.4 12 10.6 16.5.6.5 1.3 1.1 1.9 1.7l2.3 2 4.4 3.9a6.8 6.8 0 0 0 9.6 0l4.4-3.9 2.3-2c.6-.6 1.3-1.2 1.9-1.7C42.6 29.6 48 24.9 48 17.6c0-8-6-14.5-13.4-14.5z"></path></svg>
                  <svg v-else fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" width="24" height="24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.15C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path></svg>
                </button>
                <button class="text-dark"><svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" width="24" height="24"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg></button>
                <button class="text-dark"><svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" width="24" height="24"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg></button>
              </div>
              <button class="save-btn text-dark"><svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" width="24" height="24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg></button>
            </div>

            <div class="likes-info text-dark" v-if="likeCount > 0">{{ likeCount }} lượt thích</div>
            <div class="post-date">{{ formatDate(post.createdAt) }}</div>

            <form @submit.prevent="addComment" class="comment-form-light">
              <button type="button" class="emoji-btn text-dark">☺</button>
              <input v-model="newComment" placeholder="Thêm bình luận..." class="text-dark" />
              <button type="submit" class="post-btn" :disabled="!newComment.trim()">Đăng</button>
            </form>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showLightbox && currentMedia" class="lightbox-overlay" @click.self="closeLightbox">
      <button class="lightbox-close" @click="closeLightbox">✕</button>
      
      <div class="lightbox-content">
         <img v-if="currentMedia.type === 'image'" :src="currentMedia.src" class="lightbox-media" />
         <video v-else :src="currentMedia.src" controls autoplay class="lightbox-media"></video>
      </div>

      <button v-if="mediaList.length > 1 && currentMediaIndex > 0" class="nav-btn fixed-prev" @click.stop="prevMedia">‹</button>
      <button v-if="mediaList.length > 1 && currentMediaIndex < mediaList.length - 1" class="nav-btn fixed-next" @click.stop="nextMedia">›</button>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, computed, onUnmounted } from "vue";
import axios from "axios";
import { useRoute, useRouter } from "vue-router";
import Sidebar from "../components/Sidebar.vue";

const route = useRoute();
const router = useRouter();

const userStr = localStorage.getItem("user");
const me = ref(userStr ? JSON.parse(userStr) : {});

const post = ref(null);
const loading = ref(true);
const newComment = ref("");
const liked = ref(false);
const likeCount = ref(0);

const currentMediaIndex = ref(0);
// State cho lightbox
const showLightbox = ref(false);

// --- Computed ---
const mediaList = computed(() => {
  if (!post.value) return [];
  const list = [];
  if (post.value.imageUrl && Array.isArray(post.value.imageUrl)) {
    post.value.imageUrl.forEach(src => list.push({ type: 'image', src: getImageUrl(src) }));
  }
  if (post.value.videoUrl) {
    list.push({ type: 'video', src: getImageUrl(post.value.videoUrl) });
  }
  return list;
});

const currentMedia = computed(() => mediaList.value[currentMediaIndex.value]);

// --- Utilities ---
const getImageUrl = (path) => path?.startsWith("http") ? path : `http://localhost:8080${path || ''}`;

const formatTimeAgo = (date) => {
  const d = new Date(date);
  const now = new Date();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return `vừa xong`;
  if (diff < 3600) return `${Math.floor(diff/60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff/3600)} giờ trước`;
  return `${Math.floor(diff/86400)} ngày trước`;
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('vi-VN', { month: 'long', day: 'numeric', year: 'numeric' });
};

// --- Logic ---
const fetchPost = async () => {
  try {
    const token = localStorage.getItem("token");
    const id = route.params.id;
    const res = await axios.get(`http://localhost:8080/post/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    post.value = res.data;
    
    const userId = me.value._id || me.value.id;
    liked.value = post.value.likes?.includes(userId);
    likeCount.value = post.value.likes?.length || 0;
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const toggleLike = async () => {
  liked.value = !liked.value;
  likeCount.value += liked.value ? 1 : -1;
  const token = localStorage.getItem("token");
  try {
    await axios.post(`http://localhost:8080/${post.value._id}/like`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
  } catch (e) { console.error(e); }
};

const addComment = async () => {
  if (!newComment.value.trim()) return;
  const token = localStorage.getItem("token");
  try {
    await axios.post(`http://localhost:8080/${post.value._id}/comment`, 
      { content: newComment.value }, 
      { headers: { Authorization: `Bearer ${token}` } }
    );
    await fetchPost();
    newComment.value = "";
  } catch (e) { console.error(e); }
};

const prevMedia = () => { if (currentMediaIndex.value > 0) currentMediaIndex.value--; };
const nextMedia = () => { if (currentMediaIndex.value < mediaList.value.length - 1) currentMediaIndex.value++; };
const hasMedia = () => mediaList.value.length > 0;
const goHome = () => router.push("/");

// --- Lightbox Logic ---
const openLightbox = () => { showLightbox.value = true; document.body.style.overflow = 'hidden'; };
const closeLightbox = () => { showLightbox.value = false; document.body.style.overflow = ''; };
// Đóng lightbox khi nhấn Esc
const handleKeydown = (e) => { if (e.key === 'Escape' && showLightbox.value) closeLightbox(); };

onMounted(() => {
  fetchPost();
  window.addEventListener('keydown', handleKeydown);
});
onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
  document.body.style.overflow = ''; // Đảm bảo scroll hoạt động lại khi thoát
});
</script>

<style scoped>
/* =========================================
   1. GIAO DIỆN TRẮNG ĐEN (LIGHT THEME)
   ========================================= */
.instagram-layout-light {
  display: flex;
  min-height: 100vh;
  background-color: #fafafa; /* Nền xám nhạt của Insta Web */
  color: #262626; /* Màu chữ đen */
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.text-dark {
  color: #262626 !important;
}

/* =========================================
   2. MAIN CONTENT AREA
   ========================================= */
.content-area {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

/* Modal Container (Giao diện trắng) */
.post-modal-light {
  display: flex;
  width: 100%;
  max-width: 935px;
  height: 600px;
  max-height: 90vh;
  background: #fff; /* Nền trắng */
  border: 1px solid #dbdbdb; /* Viền xám nhạt */
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

/* =========================================
   3. CỘT TRÁI: MEDIA (Ảnh/Video vừa khung)
   ========================================= */
.post-media-col {
  flex: 1.5;
  /* Nền đen cho cột media để làm nổi bật ảnh contain */
  background: #000; 
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  /* Border phải màu sáng */
  border-right: 1px solid #dbdbdb; 
}

.media-container {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.media-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
/* Con trỏ kính lúp để báo hiệu click phóng to */
.zoomable {
  cursor: zoom-in; 
}

/* YÊU CẦU 2: ẢNH VỪA KHUNG (CONTAIN MODE) */
.contain-mode {
  width: 100%;
  height: 100%;
  /* Quan trọng: Giữ nguyên tỉ lệ ảnh, không bị cắt */
  object-fit: contain; 
}

/* Nav Buttons (Màu trắng trên nền tối) */
.nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255,255,255,0.8);
  border: none;
  border-radius: 50%;
  width: 30px; height: 30px;
  cursor: pointer;
  font-size: 18px;
  display: flex; align-items: center; justify-content: center;
  z-index: 10; color: #000;
}
.prev { left: 10px; }
.next { right: 10px; }

.dots-indicator {
  position: absolute; bottom: 15px; left: 0; right: 0;
  display: flex; justify-content: center; gap: 4px;
}
.dots-indicator span {
  width: 6px; height: 6px; background: rgba(255,255,255,0.4); border-radius: 50%;
}
.dots-indicator span.active { background: #fff; }

/* =========================================
   4. CỘT PHẢI: INFO (Giao diện trắng)
   ========================================= */
.post-info-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #fff; /* Nền trắng */
  min-width: 335px;
}

/* Header */
.col-header {
  padding: 14px 16px;
  border-bottom: 1px solid #dbdbdb; /* Border sáng */
  display: flex; align-items: center;
}
.user-row { display: flex; align-items: center; width: 100%; }
.avatar { width: 32px; height: 32px; border-radius: 50%; object-fit: cover; margin-right: 12px; border: 1px solid #dbdbdb; }
.user-meta { flex: 1; display: flex; flex-direction: column; }
.username { font-weight: 600; font-size: 14px; cursor: pointer; }
.location { font-size: 12px; color: #8e8e8e; }
.more-options { background: none; border: none; cursor: pointer; }

/* Body */
.col-body { flex: 1; overflow-y: auto; padding: 16px; }
.comment-row { display: flex; margin-bottom: 16px; }
.avatar-small { width: 32px; height: 32px; border-radius: 50%; object-fit: cover; margin-right: 12px; flex-shrink: 0; }
.comment-text { flex: 1; font-size: 14px; line-height: 1.4; }
.username-inline { font-weight: 600; margin-right: 5px; }
.text-content { color: #262626; }
.comment-meta { margin-top: 4px; font-size: 12px; color: #8e8e8e; display: flex; gap: 12px; }
.time-ago { color: #8e8e8e; font-size: 12px; margin-top: 4px; }
.reply-btn { font-weight: 600; cursor: pointer; color: #8e8e8e; }
.like-comment-btn { background: none; border: none; color: #8e8e8e; cursor: pointer; font-size: 12px; align-self: center; }

/* Footer */
.col-footer {
  border-top: 1px solid #dbdbdb; /* Border sáng */
  padding: 12px 16px;
  background: #fff;
}
.action-icons { display: flex; justify-content: space-between; margin-bottom: 10px; }
.left-icons button, .save-btn { background: none; border: none; cursor: pointer; margin-right: 12px; padding: 0; }
.likes-info { font-weight: 600; font-size: 14px; margin-bottom: 6px; }
.post-date { font-size: 10px; color: #8e8e8e; text-transform: uppercase; margin-bottom: 12px; }

/* Comment Form Light */
.comment-form-light {
  display: flex;
  align-items: center;
  border-top: 1px solid #dbdbdb;
  padding-top: 12px;
}
.emoji-btn { background: none; border: none; font-size: 24px; cursor: pointer; padding: 0 10px 0 0; }
.comment-form-light input {
  flex: 1; background: none; border: none; outline: none; font-size: 14px;
}
.comment-form-light input::placeholder { color: #8e8e8e; }
.post-btn { background: none; border: none; color: #0095f6; font-weight: 600; cursor: pointer; }
.post-btn:disabled { opacity: 0.4; }

/* =========================================
   5. YÊU CẦU 3: LIGHTBOX (Xem ảnh to)
   ========================================= */
.lightbox-overlay {
  position: fixed;
  top: 0; left: 0; width: 100vw; height: 100vh;
  background: rgba(0, 0, 0, 0.85); /* Nền tối mờ */
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.2s ease-out;
}

.lightbox-content {
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.lightbox-media {
  max-width: 100%;
  max-height: 90vh;
  /* Đảm bảo ảnh to vẫn giữ tỉ lệ */
  object-fit: contain; 
  box-shadow: 0 0 20px rgba(0,0,0,0.5);
}

.lightbox-close {
  position: absolute;
  top: 20px; right: 20px;
  background: none; border: none; color: #fff;
  font-size: 30px; cursor: pointer; z-index: 10000;
}
.fixed-prev, .fixed-next {
  position: fixed; /* Cố định nút nav trên màn hình */
  background: rgba(255,255,255,0.2);
  color: #fff;
  width: 40px; height: 40px; font-size: 24px;
}
.fixed-prev:hover, .fixed-next:hover { background: rgba(255,255,255,0.4); }
.fixed-prev { left: 20px; }
.fixed-next { right: 20px; }

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

/* loading / empty */
.loading-state, .empty-state { text-align: center; color: #8e8e8e; }

/* Scrollbar custom cho nền trắng */
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: #fff; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #dbdbdb; border-radius: 4px; }

/* Responsive */
@media (max-width: 768px) {
  .post-modal-light { flex-direction: column; height: auto; max-height: none; }
  .post-media-col { width: 100%; height: 400px; border-right: none; border-bottom: 1px solid #dbdbdb; }
  .post-info-col { width: 100%; min-width: 0; }
  .col-body { max-height: 350px; }
}
</style>