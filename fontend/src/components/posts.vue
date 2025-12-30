<template>
  <div class="app-layout">
    
    <Sidebar :user="me" /> 
    
    <main class="main-content">
      <div class="create-post-wrapper">
        
        <div class="create-header">
          <button class="btn-cancel" @click="clearAll" v-if="hasMedia">Hủy</button>
          <div class="header-title">Tạo bài viết mới</div>
          <button 
            @click="createPost" 
            class="btn-share" 
            :disabled="loading || !hasMedia"
          >
            <span v-if="!loading">Chia sẻ</span>
            <span v-else>Đang đăng...</span>
          </button>
        </div>

        <div class="create-body">
          
          <div class="media-section" :class="{ 'has-file': hasMedia }">
            
            <div v-if="!hasMedia" class="upload-placeholder">
              <svg aria-label="Icon to represent media such as images or videos" class="icon-media" color="currentColor" fill="currentColor" height="77" role="img" viewBox="0 0 97.6 77.3" width="96"><path d="M16.3 24h.3c2.8-.2 4.9-2.6 4.8-5.4-.2-2.8-2.6-4.9-5.4-4.8s-4.9 2.6-4.8 5.4c.1 2.7 2.4 4.8 5.1 4.8zm-2.4-7.2c.5-.6 1.3-1 2.1-1h.2c1.7 0 3.1 1.4 3.1 3.1 0 1.7-1.4 3.1-3.1 3.1-1.7 0-3.1-1.4-3.1-3.1 0-.8.3-1.5.8-2.1z" fill="currentColor"></path><path d="M84.7 18.4 58 16.9l-.2-3c-.3-5.7-5.2-10.1-11-9.8L12.9 6c-5.7.3-10.1 5.3-9.8 11L5 51v.8c.7 5.2 5.1 9.1 10.3 9.1h.6l21.7-1.2v.6c-.3 5.7 4 10.7 9.8 11l34 2h.6c5.5 0 10.1-4.3 10.4-9.8l2-34c.4-5.8-4-10.7-9.7-11.1zM7.2 10.8C8.7 9.1 10.8 8.1 13 8l34-1.9c4.6-.3 8.6 3.3 8.9 7.9l.2 2.8-5.3-.3c-5.7-.3-10.7 4-11 9.8l-.6 9.5-9.5 10.7c-.2.3-.6.4-1 .5-.4 0-.7-.1-1-.4l-7.8-7c-1.4-1.3-3.5-1.1-4.9.3L7 45.5c-1.7-3.5-1.5-7.5 1.2-10.8zM4.8 57C2.3 52.7 4 46.7 8.5 44.5l13.2-11.6c.7-.6 1.7-.7 2.5-.1L32 40l11.9-13.4c.4-.5 1-.8 1.6-.8.6-.1 1.3.2 1.6.8l23.5 39.6c-4.6.4-8.7-2.9-9.3-7.5l-.2-2.7c-.2-3.1-2.9-5.5-6-5.3l-34 1.9c-3 .2-5.3 2.8-5.1 5.9l.2 2.8c.2 3.1 2.9 5.5 6 5.3l1-.1v-1.1c0-2.2-1.8-4-4-4H4.8zM92 31l-2 34c-.2 3.2-2.9 5.7-6 5.5l-34-2c-3.2-.2-5.7-2.9-5.5-6l2-34c.2-3.2 2.9-5.7 6-5.5l34 2c3.2.2 5.7 2.9 5.5 6z" fill="currentColor"></path></svg>
              <span class="upload-text">Kéo ảnh và video vào đây</span>
              <label class="btn-select-computer">
                Chọn từ máy tính
                <input type="file" @change="onFileChange" multiple accept="image/*,video/*" />
              </label>
            </div>

            <div v-else class="media-carousel">
              <div v-if="videoPreview" class="preview-item video">
                <video :src="videoPreview" controls></video>
                <button class="remove-btn" @click="removeVideo">✕</button>
              </div>
              
              <div v-else class="image-slider">
                <div class="slider-track">
                  <div v-for="(img, i) in imagePreviews" :key="i" class="slide-item">
                    <img :src="img" />
                    <button class="remove-btn" @click="removeImage(i)">✕</button>
                  </div>
                </div>
                <label class="add-more-btn" v-if="imageFiles.length < MAX_FILES">
                  <input type="file" @change="onFileChange" multiple accept="image/*" />
                  +
                </label>
              </div>
            </div>
          </div>

          <div class="details-section">
            
            <div class="user-info">
              <img :src="getImageUrl(me?.avatar)" class="avatar-small" />
              <span class="username">{{ me?.name || 'User' }}</span>
            </div>

            <textarea
              v-model="content"
              class="caption-input"
              placeholder="Viết chú thích..."
              maxlength="2200"
            ></textarea>

            <div class="char-count">{{ content.length }}/2,200</div>

            <div class="extra-options">
              <div class="option-row">
                <span>Thêm vị trí</span>
                <svg fill="currentColor" viewBox="0 0 24 24" width="16" height="16"><path d="M12 13.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Zm0 9.2a.75.75 0 0 1-.75-.75v-.08a7 7 0 0 1-2.9-1.5 13.92 13.92 0 0 1-2.8-3.4 12.38 12.38 0 0 1-1.3-4.5c0-4.3 3.5-7.7 7.7-7.7s7.7 3.5 7.7 7.7a12.38 12.38 0 0 1-1.3 4.5 13.92 13.92 0 0 1-2.8 3.4 7 7 0 0 1-2.9 1.5v.08a.75.75 0 0 1-.75.75Z"></path></svg>
              </div>
              <div class="option-row">
                <span>Trợ năng</span>
                <svg fill="currentColor" viewBox="0 0 24 24" width="16" height="16"><path d="M12 1L9 9l-8 3 8 3 3 8 3-8 8-3-8-3z"></path></svg>
              </div>
              <div class="option-row">
                <span>Cài đặt nâng cao</span>
                <svg fill="currentColor" viewBox="0 0 24 24" width="16" height="16"><path d="M12 1L9 9l-8 3 8 3 3 8 3-8 8-3-8-3z"></path></svg>
              </div>
            </div>

            <div v-if="loading" class="upload-progress">
               <div class="bar" :style="{ width: uploadProgress + '%' }"></div>
            </div>

          </div>
        </div>

      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onBeforeUnmount, computed } from 'vue'
import axios from 'axios'
import router from '../router'
import Sidebar from '../components/Sidebar.vue'; 

const MAX_FILES = 10
const MAX_SIZE_MB = 20

// User info
const userStr = localStorage.getItem("user");
const me = ref(userStr ? JSON.parse(userStr) : {});

const content = ref('')
const imageFiles = ref([])
const imagePreviews = ref([])
const videoFile = ref(null)
const videoPreview = ref(null)
const loading = ref(false)
const uploadProgress = ref(0)

const hasMedia = computed(() => imageFiles.value.length > 0 || videoFile.value !== null);

const getImageUrl = (path) => path?.startsWith('http') ? path : `http://localhost:8080${path || ''}`;

// Xử lý chọn file (Gộp chung ảnh và video để tiện)
const onFileChange = (e) => {
  const files = Array.from(e.target.files || []);
  if (files.length === 0) return;

  // Nếu là video (chỉ cho phép 1 video)
  const video = files.find(f => f.type.startsWith('video/'));
  if (video) {
    if (imageFiles.value.length > 0) {
      alert('Không thể đăng ảnh và video cùng lúc.');
      return;
    }
    if (video.size > 100 * 1024 * 1024) {
      alert('Video quá lớn (>100MB).');
      return;
    }
    if (videoPreview.value) URL.revokeObjectURL(videoPreview.value);
    videoFile.value = video;
    videoPreview.value = URL.createObjectURL(video);
    return;
  }

  // Nếu là ảnh
  if (videoFile.value) {
    alert('Không thể thêm ảnh khi đã có video.');
    return;
  }
  
  if (files.length + imageFiles.value.length > MAX_FILES) {
    alert(`Tối đa ${MAX_FILES} ảnh.`);
    return;
  }

  const validImages = files.filter(f => f.type.startsWith('image/'));
  imageFiles.value.push(...validImages);
  imagePreviews.value.push(...validImages.map(f => URL.createObjectURL(f)));
  
  // Reset input để chọn lại file cũ nếu muốn
  e.target.value = '';
}

const removeImage = (i) => {
  URL.revokeObjectURL(imagePreviews.value[i]);
  imageFiles.value.splice(i, 1);
  imagePreviews.value.splice(i, 1);
}

const removeVideo = () => {
  if (videoPreview.value) URL.revokeObjectURL(videoPreview.value);
  videoFile.value = null;
  videoPreview.value = null;
}

const clearAll = () => {
  imagePreviews.value.forEach(URL.revokeObjectURL);
  if (videoPreview.value) URL.revokeObjectURL(videoPreview.value);
  imageFiles.value = [];
  imagePreviews.value = [];
  videoFile.value = null;
  videoPreview.value = null;
  content.value = '';
}

onBeforeUnmount(clearAll);

const createPost = async () => {
  const token = localStorage.getItem('token');
  if (!token) return router.push('/login');

  const formData = new FormData();
  formData.append('content', content.value);
  imageFiles.value.forEach(f => formData.append('images', f));
  if (videoFile.value) formData.append('video', videoFile.value);

  try {
    loading.value = true;
    const res = await axios.post('http://localhost:8080/', formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (e) => {
        if (e.total) uploadProgress.value = Math.round((e.loaded * 100) / e.total);
      }
    });

    if (res.data?.status === 200) {
      alert('Đăng bài thành công!');
      router.push('/');
    }
  } catch (err) {
    console.error(err);
    alert('Lỗi đăng bài.');
  } finally {
    loading.value = false;
    uploadProgress.value = 0;
  }
}
</script>

<style scoped>
/* Reset & Base */
.app-layout {
  display: flex;
  min-height: 100vh;
  background-color: rgba(0, 0, 0, 0.65); /* Nền mờ phía sau modal */
}

/* Main Content: Center the modal */
.main-content {
  flex: 1;
  /* Nếu Sidebar fixed thì dùng margin-left, còn không thì flex tự đẩy */
  margin-left: 245px; 
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}

/* Modal Wrapper */
.create-post-wrapper {
  background: #fff;
  width: 750px; /* Chiều rộng chuẩn */
  max-width: 95vw;
  height: 550px; /* Chiều cao cố định */
  max-height: 90vh;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  animation: zoomIn 0.2s ease-out;
}

@keyframes zoomIn {
  from { transform: scale(1.1); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

/* Header */
.create-header {
  height: 44px;
  border-bottom: 1px solid #dbdbdb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px;
  font-size: 16px;
  font-weight: 600;
  color: #262626;
  background: #fff;
}
.btn-share {
  color: #0095f6;
  font-weight: 600;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 14px;
}
.btn-share:disabled { color: #b3dbff; cursor: default; }
.btn-cancel { color: #262626; font-weight: 400; border: none; background: none; cursor: pointer; font-size: 14px;}

/* Body (Split Layout) */
.create-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* LEFT COLUMN: MEDIA */
.media-section {
  width: 100%; /* Mặc định full nếu chưa chọn ảnh */
  background: #fafafa;
  display: flex;
  justify-content: center;
  align-items: center;
  border-right: 1px solid #dbdbdb;
  transition: width 0.3s;
  position: relative;
}
.media-section.has-file {
  width: 60%; /* Thu nhỏ lại khi có ảnh để hiện cột phải */
}

/* Placeholder State */
.upload-placeholder {
  text-align: center;
}
.icon-media { margin-bottom: 16px; }
.upload-text { display: block; font-size: 20px; color: #262626; margin-bottom: 24px; font-weight: 300; }
.btn-select-computer {
  background-color: #0095f6;
  color: #fff;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
}
.btn-select-computer input { display: none; }

/* Media Preview */
.media-carousel {
  width: 100%;
  height: 100%;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
}
.preview-item video {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
.image-slider {
  width: 100%;
  height: 100%;
  overflow-y: auto; /* Cho phép cuộn nếu nhiều ảnh */
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 10px;
}
.slide-item { position: relative; width: 100%; }
.slide-item img { width: 100%; display: block; }
.remove-btn {
  position: absolute; top: 10px; right: 10px;
  background: rgba(0,0,0,0.6); color: #fff;
  border: none; border-radius: 50%; width: 24px; height: 24px;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
}
.add-more-btn {
  width: 40px; height: 40px; border-radius: 50%;
  background: rgba(255,255,255,0.2); border: 2px solid #fff;
  color: #fff; display: flex; align-items: center; justify-content: center;
  font-size: 24px; cursor: pointer; margin-top: 10px;
}
.add-more-btn input { display: none; }

/* RIGHT COLUMN: DETAILS */
.details-section {
  flex: 1; /* Chiếm phần còn lại */
  display: flex;
  flex-direction: column;
  background: #fff;
  display: none; /* Ẩn mặc định */
}
.media-section.has-file + .details-section {
  display: flex; /* Hiện khi có file */
}

.user-info {
  display: flex;
  align-items: center;
  padding: 18px 16px;
  gap: 12px;
}
.avatar-small { width: 28px; height: 28px; border-radius: 50%; object-fit: cover; }
.username { font-weight: 600; font-size: 14px; color: #262626; }

.caption-input {
  flex: 1;
  border: none;
  resize: none;
  padding: 0 16px;
  font-size: 16px;
  outline: none;
  line-height: 1.5;
  color: #262626;
}
.caption-input::placeholder { color: #c7c7c7; }

.char-count {
  text-align: right;
  font-size: 12px;
  color: #c7c7c7;
  padding: 10px 16px;
  border-bottom: 1px solid #dbdbdb;
}

.extra-options {
  padding: 0;
}
.option-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #dbdbdb;
  font-size: 15px;
  color: #262626;
  cursor: pointer;
}
.option-row svg { color: #8e8e8e; }

.upload-progress { height: 4px; background: #efefef; width: 100%; }
.upload-progress .bar { height: 100%; background: #0095f6; transition: width 0.3s; }

/* RESPONSIVE */
@media (max-width: 768px) {
  .main-content { margin-left: 0; padding: 0; align-items: flex-start; }
  .create-post-wrapper { width: 100%; height: 100vh; border-radius: 0; }
  .create-body { flex-direction: column; overflow-y: auto; }
  .media-section { height: 50vh; width: 100% !important; border-right: none; border-bottom: 1px solid #dbdbdb; }
  .details-section { display: flex; } /* Trên mobile hiện luôn input */
  .media-section.has-file + .details-section { display: flex; }
}
</style>