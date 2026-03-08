<template>
  <div class="card p-4">
    <h3>Đăng ký</h3>

    <input
      v-model="name"
      class="form-control mb-3"
      placeholder="Tên người dùng"
      :disabled="loading"
    />
    <input
      v-model="email"
      class="form-control mb-3"
      placeholder="Email"
      :disabled="loading"
    />
    <input
      v-model="password"
      type="password"
      class="form-control mb-3"
      placeholder="Mật khẩu"
      :disabled="loading"
    />

    <button
      @click="register"
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

    <div v-if="message.text" :class="`alert mt-3 alert-${message.type}`">
      {{ message.text }}
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import axios from 'axios'
import router from '../router/index'
const API = "https://insta-123.onrender.com";
const name = ref('')
const email = ref('')
const password = ref('')
const loading = ref(false)
const message = ref({ text: '', type: '' })

const register = async () => {
  message.value = { text: '', type: '' }
  loading.value = true
  try {
    const res = await axios.post(`${API}/add`, {
      name: name.value,
      email: email.value,
      password: password.value
    })

    if (res.data.status === 200) {
      message.value = {
        text: 'Mã OTP đã được gửi đến email của bạn!',
        type: 'success'
      }
      setTimeout(() => {
        router.push({ path: '/otp', query: { email: email.value } })
      }, 1500)
    } else {
      message.value = { text: res.data.error || 'Lỗi không xác định', type: 'danger' }
    }
  } catch {
    message.value = { text: 'Đăng ký thất bại. Vui lòng thử lại.', type: 'danger' }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
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
  border-top-color: #764ba2;
  border-right-color: transparent;
  animation: spinnerRotate 0.75s linear infinite;
}

.alert {
  font-weight: 600;
  border-radius: 14px;
  padding: 1rem 1.4rem;
  text-align: center;
  box-shadow: 0 3px 15px rgba(102, 126, 234, 0.2);
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
  0% {
    opacity: 0;
    transform: translateY(25px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes spinnerRotate {
  to {
    transform: rotate(360deg);
  }
}
</style>
