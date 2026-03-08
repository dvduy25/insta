<template>
  <div class="app-layout">
    
    <Sidebar 
      :user="{ _id: currentUserId, avatar: currentUserAvatar }" 
      :activeRoute="route.name"
      :targetProfileId="route.params.id"
    /> 

    <main class="main-content">
      
      <div class="profile-page" v-if="user">
        <div class="profile-header">
          <img :src="getImageUrl(user.avatar)" alt="Avatar" class="avatar" />

          <div class="info">
            <h2>{{ user.name }}</h2>
            <p class="email">{{ user.email }}</p>

            <div class="stats">
              <span><strong>{{ user.followers?.length || 0 }}</strong> người theo dõi</span>
              <span><strong>{{ user.following?.length || 0 }}</strong> đang theo dõi</span>
            </div>

            <div class="actions">
              <button
                class="btn follow"
                :class="{ active: isFollowing(user._id) }"
                @click="toggleFollow(user._id)"
                v-if="user._id !== currentUserId"
              >
                {{ isFollowing(user._id) ? "Đã Follow" : "Theo dõi" }}
              </button>

              <button class="btn message" @click="startConversation(user._id)" v-if="user._id !== currentUserId">
                💬 Nhắn tin
              </button>
              
              <button class="btn edit-profile" v-if="user._id === currentUserId" @click="router.push('/edit-profile')">
                ⚙️ Chỉnh sửa hồ sơ
              </button>
            </div>
          </div>
        </div>

        <div class="feed posts">
          <h3>Bài viết của {{ user.name }}</h3>

          <div v-if="posts.length === 0 && !loadingPosts" class="no-posts empty">
            😔 Chưa có bài viết nào
          </div>

          <article v-for="post in posts" :key="post._id" :id="`post-${post._id}`" class="card">
            <div class="card-header">
              <img v-if="post.author?.avatar" :src="getImageUrl(post.author.avatar)" class="author-avatar" loading="lazy" @click.stop="goToProfile(post.author._id)" />
              <div class="author-meta" @click="goToProfile(post.author._id)">
                <div class="author-name">{{ post.author?.name || 'Ẩn danh' }}</div>
                <div class="post-time">{{ formatDate(post.createdAt) }}</div>
              </div>

              <div class="header-actions">
                <button v-if="isFollowing(post.author._id) && post.author._id !== currentUserId" class="follow-action-link following" @click.stop="toggleFollow(post.author._id)">
                  Đang theo dõi
                </button>
                <button v-else-if="post.author._id !== currentUserId" class="follow-action-link" @click.stop="toggleFollow(post.author._id)">
                  Theo dõi
                </button>
                
                <button class="icon-btn more-options" title="Tùy chọn" @click.stop="openOptionsModal(post)">
                  <svg fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="icon-24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                  </svg>
                </button>
              </div>
            </div>

            <div v-if="hasMedia(post)" class="media-carousel-wrapper">
              <div class="media-carousel-track" @dblclick.stop="toggleLike(post)">
                <div v-for="(m, idx) in getMediaList(post)" :key="idx" class="media-slide">
                  <figure v-if="m.type === 'image'" class="media-item image-item" @click.stop="openMediaModal(post, idx)">
                    <img :src="m.src" :alt="post.content?.slice(0, 30)" />
                  </figure>
                  <figure v-else-if="m.type === 'video'" class="media-item video-item" @click.stop="openMediaModal(post, idx)">
                    <video :src="m.src" controls preload="metadata" playsinline></video>
                  </figure>
                </div>
              </div>

              <template v-if="getMediaList(post).length > 1">
                <div class="carousel-indicators">
                  <div v-for="(_, index) in getMediaList(post).length" :key="index" class="dot" :class="{ active: (currentSlide[post._id] || 0) === index }" @click="setSlide(post._id, index)"></div>
                </div>
                <button class="carousel-control prev-btn" @click.stop="prevSlide(post._id)" :disabled="(currentSlide[post._id] || 0) === 0">
                  <svg fill="#fff" viewBox="0 0 24 24" class="icon-24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" /></svg>
                </button>
                <button class="carousel-control next-btn" @click.stop="nextSlide(post._id)" :disabled="(currentSlide[post._id] || 0) === getMediaList(post).length - 1">
                  <svg fill="#fff" viewBox="0 0 24 24" class="icon-24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" /></svg>
                </button>
              </template>
            </div>

            <div class="card-info">
              <div class="card-actions">
                <button class="icon-btn" @click.stop="toggleLike(post)">
                  <svg class="heart-icon icon-24" viewBox="0 0 24 24">
                    <path v-if="post.isLiked" fill="#e0245e" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.15C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    <path v-else fill="none" stroke="currentColor" stroke-width="2" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.15C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                </button>
                <button class="icon-btn" @click.stop="openCommentsSidebar(post)">
                  <svg fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="icon-24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 20.25c4.97 0 9-3.35 9-7.5s-4.03-7.5-9-7.5S3 8.35 3 12.75c0 1.95.83 3.71 2.17 5.06l-.55 1.55 1.55-.55c1.35 1.34 3.11 2.17 5.06 2.17z" />
                  </svg>
                </button>
                <button class="icon-btn" @click.stop="startConversation(post.author._id)">
                  <svg fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="icon-24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0 1 21.485 12 59.77 59.77 0 0 1 3.27 20.876L5.999 12Zm0 0h7.5" />
                  </svg>
                </button>
              </div>

              <div class="likes-count" v-if="post.likes?.length > 0">
                {{ post.likes?.length }} lượt thích
              </div>

              <div class="caption">
                <span class="author-name-inline" @click="goToProfile(post.author._id)">{{ post.author?.name || 'Ẩn danh' }}:</span>
                <span class="content">{{ post.content }}</span>
              </div>
            </div>

            <div class="view-all-comments" v-if="post.comments?.length > 0" @click.stop="openCommentsSidebar(post)">
              Xem tất cả {{ post.comments.length }} bình luận
            </div>
          </article>

          <div v-if="loadingPosts" class="empty loading-more">⏳ Đang tải thêm bài viết...</div>
          <div v-else-if="!allLoaded && posts.length > 0" class="scroll-sentinel"></div>
          <div v-else-if="allLoaded && posts.length > 0" class="empty no-more">Đã tải hết bài viết</div>
        </div>
      </div>

      <div v-else class="loading-user">Đang tải hồ sơ...</div>
    </main>
    
    <transition name="fade">
      <div v-if="isOptionsOpen" class="modal-overlay" @click.self="closeOptionsModal">
        <div class="options-modal">
          <button v-if="isMyPost(optionsPost)" class="option-btn danger" @click="deletePost(optionsPost._id)">
            Xóa bài viết
          </button>
          
          <button class="option-btn" @click="goToPost(optionsPost._id)">Đi tới bài viết</button>
          <button class="option-btn" @click="closeOptionsModal">Hủy</button>
        </div>
      </div>
    </transition>

    <transition name="slide-right">
      <div v-if="isSidebarOpen" class="sidebar-overlay" @click.self="closeCommentsSidebar">
        <div class="sidebar-content comment-sidebar-content">
          <div class="sidebar-header">
            <h3 class="sidebar-title">Bình luận</h3>
            <button class="icon-btn close-btn" @click="closeCommentsSidebar">
              <svg fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" class="icon-24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div class="post-summary" v-if="selectedPost">
            <img v-if="selectedPost.author?.avatar" :src="getImageUrl(selectedPost.author.avatar)" class="author-avatar" />
            <span class="author-name-inline">{{ selectedPost.author?.name }}:</span>
            <span class="content">{{ selectedPost.content?.slice(0, 100) }}...</span>
          </div>
          <div class="sidebar-comments-list">
            <div v-for="c in selectedPost?.comments || []" :key="c._id" class="comment">
              <img v-if="c.user?.avatar" :src="getImageUrl(c.user.avatar)" class="comment-user-avatar" />
              <div class="comment-body">
                <strong @click="goToProfile(c.user?._id)">{{ c.user?.name || 'Ẩn danh' }}:</strong>
                <span>{{ c.content }}</span>
              </div>
            </div>
            <div v-if="!selectedPost?.comments?.length" class="empty">Chưa có bình luận nào</div>
          </div>
          <div class="comment-input-area sidebar-input-area">
            <form class="comment-form" @submit.prevent="addCommentToSidebar">
              <input v-model="commentTexts[selectedPost._id]" placeholder="Thêm bình luận..." class="comment-input" />
              <button class="post-comment-btn" type="submit" :disabled="!commentTexts[selectedPost._id]">Đăng</button>
            </form>
          </div>
        </div>
      </div>
    </transition>
    
    <transition name="fade">
      <div v-if="isModalOpen" class="media-modal-overlay" @click.self="closeMediaModal">
        <div class="media-modal-content">
          <button class="modal-close-btn" @click="closeMediaModal">
            <svg fill="#fff" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="icon-24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          <div class="modal-media-display">
            <figure v-if="currentMedia?.type === 'image'" class="modal-media-item image-item">
              <img :src="currentMedia.src" />
            </figure>
            <figure v-else-if="currentMedia?.type === 'video'" class="modal-media-item video-item">
              <video :src="currentMedia.src" controls autoplay playsinline></video>
            </figure>
          </div>
          <template v-if="getMediaList(currentPost).length > 1">
            <button class="modal-control prev-btn" @click.stop="prevModalMedia" :disabled="currentModalIndex === 0">‹</button>
            <button class="modal-control next-btn" @click.stop="nextModalMedia" :disabled="currentModalIndex === getMediaList(currentPost).length - 1">›</button>
          </template>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, onUnmounted } from "vue"; 
import axios from "axios";
import { useRoute, useRouter } from "vue-router";
import Sidebar from './Sidebar.vue'; 

defineOptions({ name: 'Profile' })

const route = useRoute();
const router = useRouter();

// State
const user = ref(null); 
const posts = ref([]);
const followingIds = ref([]);
const currentUserId = ref(null); 
const currentUserAvatar = ref(null); 

const page = ref(1);
const limit = 5;
const loadingPosts = ref(false);
const allLoaded = ref(false);
const observer = ref(null); 

// Modal & Sidebar State
const isSidebarOpen = ref(false);
const selectedPost = ref(null);
const isModalOpen = ref(false);
const currentPost = ref(null); 
const currentModalIndex = ref(0); 
const currentMedia = ref(null); 
const currentSlide = ref({}); 
const commentTexts = ref({}); 
const API = "https://insta-123.onrender.com";
// Options Modal State (Cho xóa bài viết)
const isOptionsOpen = ref(false);
const optionsPost = ref(null);

// --- Helper Functions ---
const getImageUrl = (path) => path?.startsWith("http") ? path : `${API}${path || ''}`;
const formatDate = (d) => d ? new Date(d).toLocaleDateString('vi-VN') : '';
const isFollowing = (id) => Array.isArray(followingIds.value) && followingIds.value.includes(id);
const goToProfile = (id) => { if (id) router.push(`/profile/${id}`) }
const goToPost = (id) => { router.push(`/post/${id}`) }

// Media Helpers
const hasMedia = (post) => (post.imageUrl?.length || post.videoUrl ? true : false)
const getMediaList = (post) => {
  const list = []
  if (Array.isArray(post.imageUrl)) post.imageUrl.forEach((p) => list.push({ type: 'image', src: getImageUrl(p) }))
  if (Array.isArray(post.videoUrl)) post.videoUrl.forEach((v) => list.push({ type: 'video', src: getImageUrl(v) }))
  else if (post.videoUrl) list.push({ type: 'video', src: getImageUrl(post.videoUrl) })
  return list
}

// --- LOGIC XÓA BÀI VIẾT ---
const openOptionsModal = (post) => {
  optionsPost.value = post;
  isOptionsOpen.value = true;
  document.body.style.overflow = 'hidden';
};

const closeOptionsModal = () => {
  isOptionsOpen.value = false;
  optionsPost.value = null;
  document.body.style.overflow = '';
};

// Kiểm tra quyền sở hữu
const isMyPost = (post) => {
  if (!post || !currentUserId.value) return false;
  const authorId = typeof post.author === 'object' ? post.author._id : post.author;
  return authorId === currentUserId.value;
};

const deletePost = async (postId) => {
  if (!confirm("Bạn có chắc chắn muốn xóa bài viết này?")) return;
  
  try {
    const token = localStorage.getItem("token");
    await axios.delete(`${API}/${postId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    // Cập nhật UI: Xóa khỏi mảng posts
    posts.value = posts.value.filter(p => p._id !== postId);
    closeOptionsModal();
    alert("Đã xóa bài viết.");
  } catch (err) {
    console.error("Lỗi xóa bài viết:", err);
    alert("Không thể xóa bài viết.");
  }
};

// --- Carousel & Modal Logic (Giữ nguyên) ---
const initCurrentSlide = (postId) => { if (currentSlide.value[postId] === undefined) currentSlide.value[postId] = 0; }
const scrollToSlide = (postId, index) => {
  nextTick(() => { 
    const carouselEl = document.querySelector(`#post-${postId} .media-carousel-track`);
    if (carouselEl) {
      const slideWidth = carouselEl.clientWidth;
      carouselEl.scrollTo({ left: slideWidth * index, behavior: 'smooth' });
    }
  })
}
const nextSlide = (postId) => {
  const post = posts.value.find(p => p._id === postId);
  if (!post) return;
  const mediaCount = getMediaList(post).length;
  const currentIdx = currentSlide.value[postId] || 0;
  if (currentIdx < mediaCount - 1) {
    currentSlide.value[postId] = currentIdx + 1;
    scrollToSlide(postId, currentIdx + 1);
  }
}
const prevSlide = (postId) => {
  const currentIdx = currentSlide.value[postId] || 0;
  if (currentIdx > 0) {
    currentSlide.value[postId] = currentIdx - 1;
    scrollToSlide(postId, currentIdx - 1);
  }
}
const setSlide = (postId, index) => { currentSlide.value[postId] = index; scrollToSlide(postId, index); }

const openMediaModal = (post, index) => {
  currentPost.value = post; currentModalIndex.value = index; currentMedia.value = getMediaList(post)[index];
  isModalOpen.value = true; document.body.style.overflow = 'hidden';
}
const closeMediaModal = () => {
  isModalOpen.value = false; currentPost.value = null; currentMedia.value = null; currentModalIndex.value = 0;
  document.body.style.overflow = '';
}
const updateModalMedia = (index) => {
  const mediaList = getMediaList(currentPost.value);
  if (index >= 0 && index < mediaList.length) {
    currentModalIndex.value = index; currentMedia.value = mediaList[index];
  }
}
const prevModalMedia = () => { if (currentModalIndex.value > 0) updateModalMedia(currentModalIndex.value - 1) }
const nextModalMedia = () => { if (currentPost.value && currentModalIndex.value < getMediaList(currentPost.value).length - 1) updateModalMedia(currentModalIndex.value + 1) }

const openCommentsSidebar = (post) => { selectedPost.value = post; isSidebarOpen.value = true; document.body.style.overflow = 'hidden' }
const closeCommentsSidebar = () => { isSidebarOpen.value = false; selectedPost.value = null; document.body.style.overflow = '' }
const addCommentToSidebar = async () => {
  if (!selectedPost.value) return;
  const postId = selectedPost.value._id;
  const content = commentTexts.value[postId];
  if (!content?.trim()) return;
  try {
    const token = localStorage.getItem('token');
    const res = await axios.post(`${API}/${postId}/comment`, { content }, { headers: { Authorization: `Bearer ${token}` } });
    const post = posts.value.find((p) => p._id === postId);
    const newComment = { _id: res.data?.commentId || Date.now(), user: { _id: currentUserId.value, name: user.value.name, avatar: user.value.avatar }, content };
    if (post) { post.comments = post.comments || []; post.comments.push(newComment); selectedPost.value = { ...post }; }
    commentTexts.value[postId] = '';
  } catch (e) { alert('Không thể gửi bình luận') }
}

const setupIntersectionObserver = () => {
  if (observer.value) observer.value.disconnect();
  nextTick(() => {
    const sentinel = document.querySelector('.scroll-sentinel');
    if (!sentinel) return; 
    observer.value = new IntersectionObserver((entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !loadingPosts.value && !allLoaded.value) fetchMorePosts();
      }, { root: null, rootMargin: '0px', threshold: 0.1 });
    observer.value.observe(sentinel);
  });
};

const fetchUserInfo = async () => {
  try {
    const token = localStorage.getItem("token");
    const userId = route.params.id;
    const res = await axios.get(`${API}/profile/${userId}`, { headers: { Authorization: `Bearer ${token}` } });
    user.value = res.data.user;
    currentUserId.value = res.data.currentUserId;
    followingIds.value = res.data.followingIds || [];
    if (res.data.currentUserAvatar) currentUserAvatar.value = res.data.currentUserAvatar;
    else if (userId === currentUserId.value) currentUserAvatar.value = user.value.avatar;
  } catch (err) { console.error(err); }
};

const fetchPosts = async (pageNum = 1) => {
  if (loadingPosts.value || allLoaded.value) return;
  loadingPosts.value = true;
  try {
    const token = localStorage.getItem("token");
    const userId = route.params.id;
    const res = await axios.get(`${API}/profile/${userId}?page=${pageNum}&limit=${limit}`, { headers: { Authorization: `Bearer ${token}` } });
    const newPosts = res.data.posts.map((p) => {
        const isLiked = p.likes?.some((like) => like._id === currentUserId.value);
        return { ...p, isLiked: isLiked }
    });
    if (newPosts.length < limit) allLoaded.value = true;
    posts.value.push(...newPosts);
    newPosts.forEach(p => initCurrentSlide(p._id));
    if (!allLoaded.value) setupIntersectionObserver();
  } catch (err) { console.error(err); } finally { loadingPosts.value = false; }
};

const fetchMorePosts = async () => { page.value++; await fetchPosts(page.value); };

const toggleLike = async (post) => {
  const token = localStorage.getItem("token");
  const uid = currentUserId.value;
  post.isLiked = !post.isLiked;
  if (post.isLiked) post.likes.push({_id: uid}); else {
    const index = post.likes.findIndex(l => (l._id || l) === uid);
    if (index > -1) post.likes.splice(index, 1);
  }
  try { await axios.post(`${API}/${post._id}/like`, {}, { headers: { Authorization: `Bearer ${token}` } }); } catch (err) { console.error(err); }
};

const toggleFollow = async (targetId) => {
  if (targetId === currentUserId.value) return;
  const token = localStorage.getItem("token");
  const currentlyFollowing = isFollowing(targetId);
  if (currentlyFollowing) {
    followingIds.value = followingIds.value.filter((id) => id !== targetId);
    if (user.value.followers) user.value.followers = user.value.followers.filter((id) => id !== currentUserId.value);
  } else {
    followingIds.value.push(targetId);
    if (user.value.followers) user.value.followers.push(currentUserId.value);
  }
  try { await axios.post(`${API}/${targetId}`, {}, { headers: { Authorization: `Bearer ${token}` } }); } catch (err) { console.error(err); }
};

const startConversation = async (receiverId) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return alert("Bạn cần đăng nhập để nhắn tin.");
    const res = await axios.get(`${API}/conversation/${receiverId}`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.data?.conversation) router.push({ path: "/message", query: { conversationId: res.data.conversation._id } });
  } catch (e) { console.error(e); alert("Không thể tạo cuộc trò chuyện"); }
};

onMounted(async () => { await fetchUserInfo(); await fetchPosts(); });
onUnmounted(() => { if (observer.value) observer.value.disconnect(); });
</script>

<style scoped>
/* BASE VARIABLES */
:root {
  --color-primary: #1e293b; 
  --color-secondary: #f9fafb; 
  --color-border: #475569; 
  --color-text-muted: #94a3b8; 
  --color-red: #ed4956;
  --color-blue: #0ea5e9; 
  --color-bg-hover: #334155; 
}

/* LAYOUT */
.app-layout { display: flex; min-height: 100vh; background-color: #ffffff; color: var(--color-secondary); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
.main-content { flex: 1; margin-left: 245px; display: flex; justify-content: center; }
.profile-page { max-width: 630px; margin: 40px 20px; padding: 0; width: 100%; }

/* --- CSS SỬA LẠI: MEDIA KHUNG VỪA ẢNH --- */
.media-carousel-wrapper {
  position: relative;
  width: 100%;
  /* Bỏ aspect-ratio cứng để khung co giãn theo ảnh */
  /* aspect-ratio: 1 / 1; */ 
  height: auto; 
  /* Đặt chiều cao tối đa để ảnh dọc không chiếm hết màn hình */
  max-height: 700px;
  background-color: #000;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}

.media-carousel-track {
  display: flex;
  width: 100%;
  /* Chiều cao auto để track ôm theo slide cao nhất */
  height: auto;
  scroll-snap-type: x mandatory;
  overflow-x: scroll;
  scrollbar-width: none;
  align-items: center; /* Căn giữa theo chiều dọc */
}

.media-slide {
  flex: 0 0 100%;
  /* Chiều cao auto */
  height: auto;
  scroll-snap-align: start;
  display: flex;
  justify-content: center;
  align-items: center;
}

.media-item {
  width: 100%;
  height: auto;
  margin: 0;
  display: flex;
  justify-content: center;
}

/* Quan trọng: object-fit: contain để ảnh không bị cắt */
.image-item img, .video-item video {
  width: 100%;
  height: auto;
  max-height: 700px; /* Giới hạn chiều cao */
  object-fit: contain; 
  display: block;
}

/* --- OPTIONS MODAL STYLES --- */
.modal-overlay {
  position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
  background: rgba(0,0,0,0.65); z-index: 9999;
  display: flex; align-items: center; justify-content: center;
}
.options-modal {
  background: #fff; width: 400px; border-radius: 12px; overflow: hidden;
  display: flex; flex-direction: column; text-align: center;
}
.option-btn {
  background: #fff; border: none; padding: 14px; font-size: 14px; cursor: pointer;
  border-bottom: 1px solid #dbdbdb; color: #262626; font-weight: 600;
}
.option-btn:last-child { border-bottom: none; font-weight: 400; }
.option-btn.danger { color: #ed4956; font-weight: 700; }
.option-btn:active { background: #efefef; }

/* Các style khác giữ nguyên */
@media (max-width: 1000px) { .main-content { margin-left: 72px; } }
@media (max-width: 768px) { .main-content { margin-left: 0; } .profile-page { margin: 20px auto; padding: 0 10px; } }

.profile-header { display: flex; align-items: center; background: var(--color-primary); padding: 25px; border-radius: 10px; gap: 25px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3); margin-bottom: 40px; }
.avatar { width: 150px; height: 150px; border-radius: 50%; border: 3px solid var(--color-blue); object-fit: cover; flex-shrink: 0; }
.info h2 { font-size: 1.8rem; margin-bottom: 5px; color: var(--color-secondary); }
.email { color: var(--color-text-muted); margin-bottom: 10px; font-size: 0.9rem; }
.stats { display: flex; gap: 30px; margin-bottom: 20px; font-size: 1rem; }
.actions { display: flex; gap: 10px; }
.btn { padding: 6px 14px; border-radius: 6px; cursor: pointer; border: 1px solid var(--color-border); font-weight: 600; transition: 0.2s; font-size: 0.9rem; color: var(--color-secondary); background: none; }
.btn.follow { background: var(--color-blue); color: white; border-color: var(--color-blue); }
.btn.follow.active { background: none; border-color: var(--color-text-muted); color: var(--color-text-muted); }
.feed { width: 100%; max-width: 630px; display: flex; flex-direction: column; gap: 20px; }
.posts h3 { margin-bottom: 20px; padding: 0 5px; color: var(--color-secondary); }
.card { background-color: var(--color-primary); border: 1px solid var(--color-border); border-radius: 4px; color: var(--color-secondary); }
.card-header { display: flex; align-items: center; gap: 12px; padding: 10px 14px; }
.author-avatar { width: 32px; height: 32px; border-radius: 50%; object-fit: cover; border: 1px solid var(--color-border); cursor: pointer; }
.author-name { font-weight: 600; font-size: 0.875rem; color: var(--color-secondary); }
.post-time { font-size: 0.75rem; color: var(--color-text-muted); }
.follow-action-link { margin-left: auto; background: none; border: none; color: var(--color-blue); font-weight: 600; font-size: 0.875rem; cursor: pointer; }
.follow-action-link.following { color: var(--color-secondary); }
.header-actions { display: flex; gap: 8px; align-items: center; margin-left: auto;}
.icon-24 { width: 24px; height: 24px; }
.icon-btn { background: none; border: none; cursor: pointer; padding: 8px; color: var(--color-secondary); display: flex; }
.carousel-control { position: absolute; top: 50%; transform: translateY(-50%); background: rgba(0,0,0,0.5); border: none; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 10; }
.prev-btn { left: 10px; } .next-btn { right: 10px; }
.carousel-indicators { position: absolute; top: 10px; right: 10px; display: flex; gap: 4px; z-index: 10; padding: 4px 8px; background: rgba(0,0,0,0.4); border-radius: 99px; }
.dot { width: 5px; height: 5px; border-radius: 50%; background: rgba(255,255,255,0.4); }
.dot.active { background: var(--color-blue); transform: scale(1.1); }
.card-info { padding: 0 16px; }
.card-actions { display: flex; gap: 16px; padding: 8px 0; }
.likes-count { font-weight: 600; font-size: 0.875rem; margin-bottom: 8px; color: var(--color-secondary);}
.caption { font-size: 0.875rem; margin-bottom: 8px; color: var(--color-secondary);}
.author-name-inline { font-weight: 600; margin-right: 5px; cursor: pointer;}
.view-all-comments { color: var(--color-text-muted); font-size: 0.875rem; padding: 0 16px 16px; cursor: pointer; }
.loading-more, .no-more, .no-posts { text-align: center; padding: 20px; color: var(--color-text-muted); }
.sidebar-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 100; }
.comment-sidebar-content { position: absolute; top: 0; right: 0; bottom: 0; width: 400px; background: var(--color-primary); display: flex; flex-direction: column; border-left: 1px solid var(--color-border); }
.sidebar-header { display: flex; justify-content: space-between; padding: 10px 16px; border-bottom: 1px solid var(--color-border); }
.sidebar-title { color: var(--color-secondary); }
.sidebar-comments-list { flex: 1; overflow-y: auto; padding: 10px 16px; }
.post-summary { padding: 10px 16px; display: flex; align-items: center; gap: 10px; border-bottom: 1px solid var(--color-border); color: var(--color-secondary);}
.post-summary .author-avatar { width: 24px; height: 24px; }
.comment { display: flex; gap: 10px; padding: 8px 0; font-size: 0.875rem; color: var(--color-secondary);}
.comment-user-avatar { width: 32px; height: 32px; border-radius: 50%; object-fit: cover; flex-shrink: 0;}
.sidebar-input-area { padding: 10px 16px; border-top: 1px solid var(--color-border); }
.comment-form { display: flex; gap: 8px; }
.comment-input { flex: 1; border: 1px solid var(--color-border); padding: 8px 12px; border-radius: 18px; outline: none; background: var(--color-bg-hover); color: var(--color-secondary); }
.post-comment-btn { color: var(--color-blue); border: none; background: none; font-weight: 600; cursor: pointer; }
.post-comment-btn:disabled { opacity: 0.5; }
.media-modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.9); z-index: 200; display: flex; justify-content: center; align-items: center; }
.media-modal-content { position: relative; width: 90vw; height: 90vh; display: flex; justify-content: center; align-items: center; }
.modal-close-btn { position: absolute; top: 10px; right: 10px; background: none; border: none; cursor: pointer; color: #fff; z-index: 210; }
.modal-media-item img, .modal-media-item video { max-width: 100%; max-height: 90vh; object-fit: contain; }
.modal-control { position: absolute; top: 50%; transform: translateY(-50%); background: rgba(255,255,255,0.2); border: none; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
.modal-control:disabled { opacity: 0; }
.modal-control.prev-btn { left: 20px; } .modal-control.next-btn { right: 20px; }
.slide-right-enter-active, .slide-right-leave-active { transition: transform 0.3s ease; }
.slide-right-enter-from, .slide-right-leave-to { transform: translateX(100%); }
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>