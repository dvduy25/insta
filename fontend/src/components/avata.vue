<template>
  <div class="upload-container">
    <h2 class="title">Tải ảnh đại diện</h2>

    <label class="custom-file-upload">
      <input type="file" @change="onFileChange" />
      Chọn ảnh
    </label>

    <button @click="upload" class="btn-upload">Tải lên</button>

    <div v-if="imageUrl" class="preview">
      <h3>Ảnh đã tải lên:</h3>
      <img :src="imageUrl" alt="Uploaded" class="uploaded-image" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import axios from 'axios';

const imageFile = ref(null);
const imageUrl = ref(null);

const onFileChange = (event) => {
  const file = event.target.files[0];
  imageFile.value = file;
  imageUrl.value = URL.createObjectURL(file); // Hiển thị trước ảnh
};

const upload = async () => {
  if (!imageFile.value) {
    alert('Vui lòng chọn ảnh.');
    return;
  }

  const formData = new FormData();
  formData.append('images', imageFile.value); 

  try {
    const token = localStorage.getItem('token');
    const res = await axios.post('http://localhost:8080/upload', formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    });

    const avatarPath = res.data.user.avatar;
    imageUrl.value = avatarPath.startsWith('http')
      ? avatarPath
      : `http://localhost:8080${avatarPath}`;
  } catch (error) {
    console.error('Lỗi khi upload ảnh:', error.response?.data || error);
    alert('Upload thất bại.');
  }
};

</script>

<style scoped>
.upload-container {
  max-width: 500px;
  margin: 50px auto;
  padding: 30px;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.05);
  text-align: center;
  font-family: 'Segoe UI', sans-serif;
}

.title {
  font-size: 1.5rem;
  margin-bottom: 20px;
  color: #333;
}

.custom-file-upload {
  display: inline-block;
  padding: 10px 20px;
  cursor: pointer;
  background-color: #667eea;
  color: white;
  border-radius: 8px;
  margin-bottom: 20px;
  transition: background 0.3s ease;
}

.custom-file-upload:hover {
  background-color: #5a67d8;
}

.custom-file-upload input {
  display: none;
}

.btn-upload {
  background-color: #38a169;
  border: none;
  color: white;
  padding: 10px 24px;
  font-size: 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.3s ease;
}

.btn-upload:hover {
  background-color: #2f855a;
}

.preview {
  margin-top: 30px;
}

.uploaded-image {
  max-width: 100%;
  border-radius: 10px;
  border: 2px solid #cbd5e0;
  margin-top: 10px;
  transition: transform 0.3s;
}

.uploaded-image:hover {
  transform: scale(1.05);
}
</style>
