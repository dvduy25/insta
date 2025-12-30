<template>
  <div class="app-layout">
    
    <Sidebar :user="user" @toggleSearch="toggleSearch" />
    
    <header class="topbar mobile-only">
      <div class="brand" @click="goHome">Instaclone</div>
      <div class="actions">
        <button class="icon-btn" @click="dangbai" title="Đăng bài">
          <svg fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" class="icon-24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
        </button>
        <div class="user-profile" @click="goToProfile(user._id)">
          <img v-if="user.avatar" :src="getImageUrl(user.avatar)" class="avatar" />
        </div>
        <button class="icon-btn" @click="logout" title="Đăng xuất">
          <svg fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" class="icon-24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12" />
          </svg>
        </button>
      </div>
    </header>

    <main class="main-content">
      <div class="feed" ref="feedContainer">
        <div v-if="loading && posts.length === 0" class="empty">Đang tải...</div>
        <div v-else-if="!loading && posts.length === 0" class="empty">Chưa có bài viết</div>

        <article v-for="post in posts" :key="post._id" :id="`post-${post._id}`" class="card">

          <div class="card-header">
            <img v-if="post.author?.avatar" :src="getImageUrl(post.author.avatar)" class="author-avatar" loading="lazy" @click.stop="goToProfile(post.author._id)" />
            <div class="author-meta" @click="goToProfile(post.author._id)">
              <div class="author-name">{{ post.author?.name || 'Ẩn danh' }}</div>
              <div class="post-time">{{ formatDate(post.createdAt) }}</div>
            </div>

            <div class="header-actions">
              <button v-if="isFollowing(post.author._id) && post.author._id !== user._id" class="follow-action-link following" @click.stop="toggleFollow(post.author._id)">
                Đang theo dõi
              </button>
              <button v-else-if="post.author._id !== user._id" class="follow-action-link" @click.stop="toggleFollow(post.author._id)">
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
            <div class="media-carousel-track" @dblclick.stop="likePost(post._id)">
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
              <button class="icon-btn" @click.stop="likePost(post._id)">
                <svg class="heart-icon icon-24" viewBox="0 0 24 24">
                  <path v-if="isLiked(post)" fill="#e0245e" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.15C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
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

        <div v-if="loading && posts.length > 0" class="empty loading-more">Đang tải thêm...</div>
        <div v-else-if="noMore" class="empty no-more">Đã tải hết bài viết</div>
      </div>
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
      <div v-if="isSearchOpen" class="sidebar-overlay" @click.self="toggleSearch">
        <div class="sidebar-content search-sidebar">
          <div class="sidebar-header">
            <h3 class="sidebar-title">Tìm kiếm</h3>
            <button class="icon-btn close-btn" @click="toggleSearch">
              <svg fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" class="icon-24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div class="sidebar-body">
             <div class="search-input-wrapper">
               <input v-model="searchQuery" placeholder="Tìm kiếm..." class="search-input" />
               <button class="search-btn" disabled>
                 <svg fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="icon-16"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
               </button>
             </div>
             <div class="search-results">
                <p class="text-muted mt-4 text-center">Nhập tên người dùng để tìm kiếm (Tính năng đang phát triển)</p>
             </div>
          </div>
        </div>
      </div>
    </transition>

    <transition name="slide-right">
      <div v-if="isSidebarOpen" class="sidebar-overlay" @click.self="closeCommentsSidebar">
        <div class="sidebar-content">
          <div class="sidebar-header">
            <h3 class="sidebar-title">Bình luận</h3>
            <button class="icon-btn close-btn" @click="closeCommentsSidebar">
              <svg fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" class="icon-24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div class="post-summary" v-if="selectedPost">
            <img v-if="selectedPost.author?.avatar" :src="getImageUrl(selectedPost.author.avatar)" class="author-avatar" />
            <span class="author-name-inline" @click="goToProfile(selectedPost.author._id)">
              {{ selectedPost.author?.name || 'Ẩn danh' }}:
            </span>
            <span class="content">{{ selectedPost.content?.slice(0, 100) }}{{ (selectedPost.content?.length > 100) ? '...' : '' }}</span>
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
              <img :src="currentMedia.src" :alt="currentPost.content?.slice(0, 30)" />
            </figure>
            <figure v-else-if="currentMedia?.type === 'video'" class="modal-media-item video-item">
              <video :src="currentMedia.src" controls autoplay playsinline></video>
            </figure>
          </div>

          <template v-if="getMediaList(currentPost).length > 1">
            <button class="modal-control prev-btn" @click.stop="prevModalMedia" :disabled="currentModalIndex === 0">
              <svg fill="#fff" viewBox="0 0 24 24" class="icon-24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" /></svg>
            </button>
            <button class="modal-control next-btn" @click.stop="nextModalMedia" :disabled="currentModalIndex === getMediaList(currentPost).length - 1">
              <svg fill="#fff" viewBox="0 0 24 24" class="icon-24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" /></svg>
            </button>
          </template>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, onActivated, onDeactivated, nextTick } from 'vue'
import axios from 'axios'
import router from '../router'
// 2. Import component Sidebar
import Sidebar from './Sidebar.vue' 

defineOptions({ name: 'Home' })

const user = ref({})
const posts = ref([])
const loading = ref(false)
const page = ref(1)
const limit = 5
const noMore = ref(false)
const commentTexts = ref({})
const followingIds = ref([])
const scrollKey = 'feed-scroll-position'

// Sidebar & Modal States
const isSidebarOpen = ref(false) // Sidebar Bình luận
const isSearchOpen = ref(false)  // Sidebar Tìm kiếm
const searchQuery = ref('')      // Từ khóa tìm kiếm
const selectedPost = ref(null)
const isModalOpen = ref(false)
const currentPost = ref(null) 
const currentModalIndex = ref(0) 
const currentMedia = ref(null) 
const currentSlide = ref({}); 

// Options Modal State (Cho xóa/đi tới bài viết)
const isOptionsOpen = ref(false);
const optionsPost = ref(null);

// --- Navigation Actions ---
const dangbai = () => router.push('/post')
const goHome = () => router.push('/duy123')
const goToProfile = (id) => { if (id) router.push(`/profile/${id}`) }
// Đi tới bài viết (Hàm cũ, giữ nguyên)
const goToPost = (id) => {
  sessionStorage.setItem('last-viewed-post-id', id);
  closeOptionsModal(); // Đóng modal nếu đang mở
  router.push(`/post/${id}`);
}
const logout = () => {
  localStorage.removeItem('token')
  router.push('/login')
}

// Chức năng Tin nhắn
const startConversation = (id) => {
  router.push('/message'); 
}

// Chức năng Tìm kiếm
const toggleSearch = () => {
  isSearchOpen.value = !isSearchOpen.value;
  if (isSearchOpen.value) {
    // searchQuery.value = '';
  }
}

// --- Helper Functions ---
const getImageUrl = (path) => path?.startsWith('http') ? path : `http://localhost:8080${path || ''}`

const formatDate = (d) => {
  if (!d) return ''
  const now = new Date();
  const date = new Date(d);
  const diffInSeconds = Math.floor((now - date) / 1000);
  if (diffInSeconds < 60) return `${diffInSeconds} giây trước`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} ngày trước`;
  return date.toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' });
}

// --- LOGIC XÓA BÀI VIẾT & OPTIONS MODAL ---
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

// Kiểm tra quyền sở hữu bài viết
const isMyPost = (post) => {
  if (!post || !user.value._id) return false;
  const authorId = typeof post.author === 'object' ? post.author._id : post.author;
  return authorId === user.value._id;
};

const deletePost = async (postId) => {
  if (!confirm("Bạn có chắc chắn muốn xóa bài viết này?")) return;
  
  try {
    const token = localStorage.getItem("token");
    await axios.delete(`http://localhost:8080/${postId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    // Xóa khỏi danh sách posts hiện tại để không cần reload
    posts.value = posts.value.filter(p => p._id !== postId);
    closeOptionsModal();
    alert("Đã xóa bài viết.");
  } catch (err) {
    console.error("Lỗi xóa bài viết:", err);
    alert("Không thể xóa bài viết. Vui lòng thử lại.");
  }
};

// --- Carousel & Modal Logic ---
const initCurrentSlide = (postId) => { if (currentSlide.value[postId] === undefined) currentSlide.value[postId] = 0; }
const scrollToSlide = (postId, index) => {
  const carouselEl = document.querySelector(`#post-${postId} .media-carousel-track`);
  if (carouselEl) {
    const slideWidth = carouselEl.clientWidth;
    carouselEl.scrollTo({ left: slideWidth * index, behavior: 'smooth' });
  }
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
  currentPost.value = post
  currentModalIndex.value = index
  currentMedia.value = getMediaList(post)[index]
  isModalOpen.value = true
  document.body.style.overflow = 'hidden' 
}
const closeMediaModal = () => {
  isModalOpen.value = false
  currentPost.value = null
  currentMedia.value = null
  currentModalIndex.value = 0
  document.body.style.overflow = '' 
}
const updateModalMedia = (index) => {
  const mediaList = getMediaList(currentPost.value)
  if (index >= 0 && index < mediaList.length) {
    currentModalIndex.value = index
    currentMedia.value = mediaList[index]
  }
}
const prevModalMedia = () => { if (currentModalIndex.value > 0) updateModalMedia(currentModalIndex.value - 1) }
const nextModalMedia = () => { if (currentPost.value && currentModalIndex.value < getMediaList(currentPost.value).length - 1) updateModalMedia(currentModalIndex.value + 1) }

// --- Data Fetching ---
onDeactivated(() => { sessionStorage.setItem('feed-scroll', window.scrollY) })
onActivated(() => {
  const lastPostId = sessionStorage.getItem('last-viewed-post-id')
  if (lastPostId) {
    nextTick(() => {
      const el = document.getElementById(`post-${lastPostId}`)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      sessionStorage.removeItem('last-viewed-post-id')
    })
  } else {
    const savedScroll = sessionStorage.getItem('feed-scroll')
    if (savedScroll) {
      nextTick(() => window.scrollTo(0, parseInt(savedScroll)))
      sessionStorage.removeItem('feed-scroll')
    }
  }
})

const fetchUser = async () => {
  try {
    const token = localStorage.getItem('token')
    const res = await axios.get('http://localhost:8080/duy123', { headers: { Authorization: `Bearer ${token}` } })
    user.value = res.data?.use || {}
    followingIds.value = user.value.following || []
  } catch (e) { console.error(e) }
}

const fetchPosts = async () => {
  if (loading.value || noMore.value) return
  loading.value = true
  try {
    const token = localStorage.getItem('token')
    const res = await axios.get(`http://localhost:8080?page=${page.value}&limit=${limit}`, { headers: { Authorization: `Bearer ${token}` } })
    const newPosts = res.data?.posts || []
    if (newPosts.length === 0) noMore.value = true
    else {
      posts.value.push(...newPosts)
      newPosts.forEach(p => initCurrentSlide(p._id)); 
      page.value++
    }
  } catch (err) { console.error(err) } finally { loading.value = false }
}

const handleScroll = () => {
  const bottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 400
  if (bottom && !loading.value && !noMore.value) fetchPosts()
}

onMounted(() => {
  if (posts.value.length === 0) {
    fetchUser()
    fetchPosts()
  } else {
    posts.value.forEach(p => initCurrentSlide(p._id));
  }
  window.addEventListener('scroll', handleScroll)
})
onBeforeUnmount(() => { window.removeEventListener('scroll', handleScroll) })

// --- Interactions ---
const likePost = async (postId) => {
  const post = posts.value.find((p) => p._id === postId)
  const uid = user.value._id
  if (!post) return
  if (isLiked(post)) post.likes = post.likes.filter((id) => id !== uid)
  else post.likes.push(uid)

  try {
    const token = localStorage.getItem('token')
    await axios.post(`http://localhost:8080/${postId}/like`, {}, { headers: { Authorization: `Bearer ${token}` } })
  } catch { console.error('Like failed') }
}
const isLiked = (post) => post.likes?.includes(user.value._id)
const toggleFollow = async (id) => {
  if (!id || id === user.value._id) return
  if (isFollowing(id)) followingIds.value = followingIds.value.filter((f) => f !== id)
  else followingIds.value.push(id)

  const token = localStorage.getItem('token')
  try { await axios.post(`http://localhost:8080/follow/${id}`, {}, { headers: { Authorization: `Bearer ${token}` } }) } catch { console.error('Follow failed') }
}
const isFollowing = (id) => followingIds.value.includes(id)

const openCommentsSidebar = (post) => { selectedPost.value = post; isSidebarOpen.value = true; document.body.style.overflow = 'hidden' }
const closeCommentsSidebar = () => { isSidebarOpen.value = false; selectedPost.value = null; document.body.style.overflow = '' }
const addCommentToSidebar = async () => {
  if (!selectedPost.value) return;
  const postId = selectedPost.value._id;
  const content = commentTexts.value[postId];
  if (!content?.trim()) return;
  try {
    const token = localStorage.getItem('token');
    const res = await axios.post(`http://localhost:8080/${postId}/comment`, { content }, { headers: { Authorization: `Bearer ${token}` } });
    const post = posts.value.find((p) => p._id === postId);
    if (post) {
      post.comments = post.comments || [];
      const newComment = { _id: res.data?.commentId || Date.now(), user: { ...user.value, avatar: user.value.avatar }, content };
      post.comments.push(newComment);
      selectedPost.value = { ...post };
    }
    commentTexts.value[postId] = '';
  } catch (e) { alert('Không thể gửi bình luận') }
}
const hasMedia = (post) => (post.imageUrl?.length || post.videoUrl ? true : false)
const getMediaList = (post) => {
  const list = []
  if (Array.isArray(post.imageUrl)) post.imageUrl.forEach((p) => list.push({ type: 'image', src: getImageUrl(p) }))
  if (Array.isArray(post.videoUrl)) post.videoUrl.forEach((v) => list.push({ type: 'video', src: getImageUrl(v) }))
  else if (post.videoUrl) list.push({ type: 'video', src: getImageUrl(post.videoUrl) })
  return list
}
</script>

<style scoped>
  /* Base Variables */
  :root {
    --color-primary: #ffffff;
    --color-secondary: #000000;
    --color-border: #dbdbdb;
    --color-text-muted: #737373;
    --color-red: #ed4956;
    --color-blue: #0095f6;
    --color-bg-hover: #fafafa;
  }

  /* Layout Structure */
  .app-layout {
    display: flex;
    min-height: 100vh;
    background-color: var(--color-primary);
    color: var(--color-secondary);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  }

  /* Main Content */
  .main-content {
    flex: 1;
    margin-left: 245px; /* Bù khoảng trống cho sidebar */
    display: flex;
    justify-content: center;
    padding: 20px 0;
  }

  .feed {
    width: 100%;
    max-width: 630px; 
    display: flex;
    flex-direction: column;
    gap: 20px;
    margin-top: 20px;
  }

  /* TOPBAR STYLES (Mobile) */
  .topbar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 50;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 16px;
    background-color: var(--color-primary);
    border-bottom: 1px solid var(--color-border);
    height: 54px;
  }
  
  .topbar .brand {
    font-family: 'Billabong', cursive;
    font-size: 28px;
    cursor: pointer;
  }

  .topbar .actions {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .topbar .avatar {
    width: 24px;
    height: 24px;
    border-radius: 50%;
  }

  /* Common Icons */
  .icon-24 { width: 24px; height: 24px; }
  .icon-16 { width: 16px; height: 16px; }
  .icon-btn {
    background: none; border: none; cursor: pointer; padding: 8px;
    color: var(--color-secondary); display: flex;
  }
  .icon-btn:hover { opacity: 0.7; }

  /* Card & Feed Styles */
  .card {
    background-color: var(--color-primary);
    border: 1px solid var(--color-border);
    border-radius: 4px;
    margin-bottom: 20px;
  }
  
  .card-header {
    display: flex; align-items: center; gap: 12px; padding: 10px 14px;
  }
  
  .author-avatar {
    width: 32px; height: 32px; border-radius: 50%; object-fit: cover; border: 1px solid var(--color-border); cursor: pointer;
  }
  
  .author-name { font-weight: 600; font-size: 0.875rem; cursor: pointer; }
  .post-time { font-size: 0.75rem; color: var(--color-text-muted); }
  
  .follow-action-link {
    margin-left: auto; background: none; border: none; color: #0095f6; font-weight: 600; font-size: 0.875rem; cursor: pointer;
  }
  .follow-action-link.following { color: var(--color-secondary); }
  
  .header-actions { display: flex; gap: 8px; align-items: center; margin-left: auto;}

  /* --- MEDIA CAROUSEL (VIỀN ĐEN + NỀN ĐEN + BO GÓC) --- */
  .media-carousel-wrapper {
    position: relative;
    /* 1. Tạo khoảng cách 2 bên để nhìn giống khung */
    width: calc(100% - 24px); 
    margin: 0 auto; /* Căn giữa */
    
    /* 2. Viền đen và Bo góc */
    border: 1px solid #dbdbdb; /* Hoặc #000 nếu thích viền đen hẳn */
    border-radius: 8px; 
    
    height: auto;           
    min-height: 200px;
    
    /* 3. QUAN TRỌNG: Nền đen để phần thừa khi ảnh không fit sẽ là màu đen */
    background-color: #000; 
    
    overflow: hidden; /* Cắt góc ảnh theo border-radius */
  }
  
  .media-carousel-track {
    display: flex;
    width: 100%;
    height: auto;
    scroll-snap-type: x mandatory;
    overflow-x: scroll;
    scrollbar-width: none;
    align-items: center; 
  }
  .media-slide {
    flex: 0 0 100%;
    height: auto;
    scroll-snap-align: start;
    display: flex;
    justify-content: center; /* Căn giữa ảnh trong khung */
    
    /* Đảm bảo nền slide cũng đen */
    background: #000; 
  }
  .media-item {
    width: 100%;
    height: auto;
    margin: 0;
    display: flex;
    justify-content: center;
  }
  .image-item img, .video-item video {
    /* Auto width: Để ảnh tự co kích thước chiều ngang */
    width: auto; 
    /* Max-width 100%: Nhưng không được tràn khung */
    max-width: 100%;  
    height: auto;
    max-height: 80vh;      
    object-fit: contain;
    display: block;
    margin: 0 auto; /* Căn giữa */
  }
  
  /* Carousel Controls */
  .carousel-control {
    position: absolute; top: 50%; transform: translateY(-50%); background: rgba(0,0,0,0.5); border: none; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 10;
  }
  .prev-btn { left: 10px; } .next-btn { right: 10px; }
  .carousel-indicators {
    position: absolute; top: 10px; right: 10px; display: flex; gap: 4px; z-index: 10; padding: 4px 8px; background: rgba(0,0,0,0.4); border-radius: 99px;
  }
  .dot { width: 5px; height: 5px; border-radius: 50%; background: rgba(255,255,255,0.4); }
  .dot.active { background: #0095f6; transform: scale(1.1); }

  /* Card Info */
  .card-info { padding: 0 16px; }
  .card-actions { display: flex; gap: 16px; padding: 8px 0; }
  .likes-count { font-weight: 600; font-size: 0.875rem; margin-bottom: 8px; }
  .caption { font-size: 0.875rem; margin-bottom: 8px; }
  .author-name-inline { font-weight: 600; margin-right: 5px; cursor: pointer;}
  .view-all-comments { color: var(--color-text-muted); font-size: 0.875rem; padding: 0 16px 16px; cursor: pointer; }

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

  /* --- RESPONSIVE LOGIC --- */
  .mobile-only { display: none; }

  @media (max-width: 1000px) {
     .main-content { margin-left: 72px; }
  }

  @media (max-width: 768px) {
    .mobile-only { display: flex; } 
    .main-content { margin-left: 0; padding-top: 54px; } 
    .feed { padding: 0; gap: 0; max-width: 100%; margin-top: 0; }
    .card { border: none; border-bottom: 1px solid var(--color-border); border-radius: 0; }
    .comment-sidebar-content { width: 100%; }
  }

  /* --- Sidebar Comment & Search Styles --- */
  .sidebar-overlay, .comment-sidebar-overlay, .media-modal-overlay {
    position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 100;
  }
  .media-modal-overlay { background: rgba(0,0,0,0.9); z-index: 200; display: flex; justify-content: center; align-items: center; }
  
  .sidebar-content, .comment-sidebar-content {
    position: absolute; top: 0; right: 0; bottom: 0; width: 500px; background:#dbdbdb ; display: flex; flex-direction: column;
  }
  
  /* Search Specific Styles */
  .search-sidebar { width: 400px; border-left: 1px solid var(--color-border); }
  .search-input-wrapper {
    padding: 16px; border-bottom: 1px solid var(--color-border); display: flex; gap: 8px;
  }
  .search-input {
    flex: 1; background: var(--color-bg-hover); border: none; padding: 10px; border-radius: 8px; outline: none; font-size: 1rem;
  }
  .search-btn {
    background: none; border: none; cursor: pointer; color: var(--color-text-muted);
  }
  .search-results { padding: 16px; }

  .sidebar-header { display: flex; justify-content: space-between; padding: 10px 16px; border-bottom: 1px solid var(--color-border); }
  .sidebar-comments-list { flex: 1; overflow-y: auto; padding: 10px 16px; }
  .comment { display: flex; gap: 10px; padding: 8px 0; font-size: 0.875rem; }
  .comment-user-avatar { width: 32px; height: 32px; border-radius: 50%; object-fit: cover; flex-shrink: 0;}
  .sidebar-input-area { padding: 10px 16px; border-top: 1px solid var(--color-border); }
  .comment-form { display: flex; gap: 8px; }
  .comment-input { flex: 1; border: 1px solid var(--color-border); padding: 8px; border-radius: 18px; outline: none; }
  .post-comment-btn { color: var(--color-blue); border: none; background: none; font-weight: 600; cursor: pointer; }
  .post-comment-btn:disabled { opacity: 0.5; }

  /* Transitions */
  .slide-right-enter-active, .slide-right-leave-active { transition: transform 0.3s ease; }
  .slide-right-enter-from, .slide-right-leave-to { transform: translateX(100%); }
  .fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
  .fade-enter-from, .fade-leave-to { opacity: 0; }
  
  /* Modal Inner */
  .media-modal-content { position: relative; width: 90vw; height: 90vh; display: flex; justify-content: center; align-items: center; }
  .modal-close-btn { position: absolute; top: 10px; right: 10px; background: none; border: none; cursor: pointer; color: #fff; z-index: 210; }
  .modal-media-item img, .modal-media-item video { max-width: 100%; max-height: 90vh; object-fit: contain; }
  .modal-control { position: absolute; top: 50%; transform: translateY(-50%); background: rgba(255,255,255,0.2); border: none; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
  .modal-control:disabled { opacity: 0; }
  .modal-control.prev-btn { left: 20px; } .modal-control.next-btn { right: 20px; }
</style>