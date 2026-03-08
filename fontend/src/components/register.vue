<template>
  <div class="card p-4">
    <h3>Đăng ký</h3>

    <form @submit.prevent="register">
      <input
        v-model="name"
        type="text"
        class="form-control mb-3"
        placeholder="Tên người dùng"
        required
        :disabled="loading"
      />
      <input
        v-model="email"
        type="email"
        class="form-control mb-3"
        placeholder="Email"
        required
        :disabled="loading"
      />
      <input
        v-model="password"
        type="password"
        class="form-control mb-3"
        placeholder="Mật khẩu"
        required
        :disabled="loading"
      />

      <button
        type="submit"
        class="btn btn-primary w-100"
        :disabled="loading || !email || !password || !name"
      >
        <span v-if="loading">
          <span
            class="spinner-border spinner-border-sm me-2"
            role="status"
            aria-hidden="true"
          ></span>
          Đang xử lý...
        </span>
        <span v-else>Đăng ký</span>
      </button>
    </form>

    <div v-if="message.text" :class="`alert mt-3 alert-${message.type}`">
      {{ message.text }}
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'

const router = useRouter()
const API = "https://insta-123.onrender.com"

const name = ref('')
const email = ref('')
const password = ref('')
const loading = ref(false)
const message = ref({ text: '', type: '' })

const register = async () => {
  message.value = { text: '', type: '' }
  loading.value = true

  try {
    // Lưu ý: Endpoint phải khớp với router backend của bạn (ví dụ: /add)
    const res = await axios.post(`${API}/add`, {
      name: name.value,
      email: email.value,
      password: password.value
    })

    // Kiểm tra status 200 từ backend mới viết
    if (res.data.status === 200 || res.data.success) {
      message.value = {
        text: 'Mã OTP đã được gửi đến email của bạn!',
        type: 'success'
      }
      
      // Chuyển sang trang nhập OTP sau 1.5s
      setTimeout(() => {
        router.push({ 
          path: '/otp', 
          query: { email: email.value } 
        })
      }, 1500)
    }
  } catch (err) {
    // Hiển thị lỗi cụ thể từ server (lỗi 400, 500, v.v.)
    const errorMsg = err.response?.data?.error || 'Đăng ký thất bại. Vui lòng thử lại.'
    message.value = { 
      text: errorMsg, 
      type: 'danger' 
    }
    console.error("Lỗi đăng ký:", err)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* Giữ nguyên CSS của bạn vì nó rất đẹp rồi */
.card {
  max-width: 400px;
  margin: 80px auto;
  padding: 2.5rem 3rem;
  border-radius: 1rem;
  background: #ffffffdd;
  backdrop-filter: blur(15px);
  box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3),
    0 4px 15px rgba(118, 75, 162, 0.3);
  animation: fadeInUp 0.7s ease forwards;
}

h3 {
  font-weight: 700;
  font-size: 1.8rem;
  color: #4e3b8b;
  margin-bottom: 2rem;
  text-align: center;
}

.form-control {
  width: 100%;
  padding: 12px 16px;
  font-size: 1rem;
  border-radius: 12px;
  border: 1.8px solid rgba(102, 126, 234, 0.3);
  background: #f9faff;
  color: #333;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
  outline: none;
}

.form-control:focus {
  border-color: #764ba2;
  box-shadow: 0 0 8px 2px rgba(118, 75, 162, 0.4);
  background: #fff;
}

.btn-primary {
  width: 100%;
  padding: 14px 0;
  font-weight: 700;
  font-size: 1.1rem;
  border: none;
  border-radius: 18px;
  color: white;
  background: linear-gradient(90deg, #667eea, #764ba2);
  box-shadow: 0 6px 12px rgba(102, 126, 234, 0.5);
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(90deg, #5a6bd8, #6a3ea7);
  transform: translateY(-2px);
}

.btn-primary:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.spinner-border {
  width: 20px;
  height: 20px;
  border-width: 2.5px;
}

.alert {
  font-weight: 600;
  border-radius: 14px;
  padding: 1rem 1.4rem;
  text-align: center;
}

.alert-success {
  background-color: #e3e0ff;
  color: #4e3b8b;
}

.alert-danger {
  background-color: #ffe3e3;
  color: #8b3b3b;
}

@keyframes fadeInUp {
  0% { opacity: 0; transform: translateY(25px); }
  100% { opacity: 1; transform: translateY(0); }
}
</style>