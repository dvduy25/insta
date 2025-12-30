<template>
  <div class="d-flex justify-content-center align-items-center min-vh-100 bg-light">
    <div class="card shadow p-4" style="width: 100%; max-width: 400px;">
      <h3 class="text-center mb-4">Login</h3>

      <input v-model="name" class="form-control mb-3" placeholder="Username" />
      <input v-model="password" type="password" class="form-control mb-3" placeholder="Password" />

      <button @click="login" class="btn btn-success w-100 mb-2" :disabled="loading">
        <span v-if="loading">
          <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
          Đang xử lý...
        </span>
        <span v-else>Login</span>
      </button>

      <button @click="goToRegister" class="btn btn-outline-primary w-100">Register</button>

      <div v-if="user" class="alert alert-success mt-3">
        Welcome, {{ user.name }}!
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import axios from 'axios'
import router from '../router/index'

const name = ref('')
const password = ref('')
const user = ref(null)
const loading = ref(false)

const login = async () => {
  loading.value = true
  try {
    const res = await axios.post('http://localhost:8080/login', {
      name: name.value,
      password: password.value
    }, {
      withCredentials: true
    })
    if (res.data.status === 200) {
      user.value = res.data.user
      localStorage.setItem('token', res.data.accessToken)
      alert('Đăng nhập thành công!')
      router.push({ path: '/duy123', query: { id: res.data.user._id } })
    } else {
      alert(res.data.error)
    }
  } catch {
    alert('Login failed')
  } finally {
    loading.value = false
  }
}

const goToRegister = () => {
  router.push('/add')
}
</script>
<style scoped>
/* Toàn màn hình với gradient hiện đại */
body, html {
  height: 100%;
  margin: 0;
  font-family: 'Poppins', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: linear-gradient(135deg, #667eea, #764ba2);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

/* Card trung tâm */
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

.card:hover {
  transform: translateY(-5px);
}

/* Tiêu đề */
h3 {
  font-weight: 700;
  font-size: 1.8rem;
  color: #4e3b8b;
  margin-bottom: 2rem;
  text-align: center;
  letter-spacing: 1.2px;
}

/* Input style: phẳng, viền mờ, bóng nhẹ */
.form-control {
  width: 100%;
  padding: 12px 16px;
  font-size: 1rem;
  border-radius: 12px;
  border: 1.8px solid rgba(102, 126, 234, 0.3);
  background: #f9faff;
  color: #333;
  box-shadow: inset 0 2px 5px rgb(255 255 255 / 0.7);
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
  outline: none;
  margin-bottom: 1.4rem;
  font-weight: 500;
}

.form-control::placeholder {
  color: #a0a5c1;
}

.form-control:focus {
  border-color: #764ba2;
  box-shadow: 0 0 8px 2px rgba(118, 75, 162, 0.4);
  background: #fff;
}

/* Nút login - gradient, bo góc to, đổ bóng, hover hiệu ứng nổi */
.btn-success {
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

.btn-success:hover:not(:disabled) {
  background: linear-gradient(90deg, #5a6bd8, #6a3ea7);
  box-shadow: 0 8px 20px rgba(106, 62, 167, 0.7);
  transform: translateY(-2px);
}

.btn-success:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

/* Nút register */
.btn-outline-primary {
  margin-top: 0.9rem;
  width: 100%;
  padding: 14px 0;
  font-weight: 600;
  font-size: 1rem;
  color: #764ba2;
  border: 2px solid #764ba2;
  border-radius: 18px;
  background: transparent;
  transition: all 0.3s ease;
}

.btn-outline-primary:hover {
  background: #764ba2;
  color: white;
  box-shadow: 0 6px 12px rgba(118, 75, 162, 0.5);
  transform: translateY(-2px);
}

/* Spinner: mượt, màu tím hợp màu nền */
.spinner-border {
  width: 20px;
  height: 20px;
  border-width: 2.5px;
  border-top-color: #764ba2;
  border-right-color: transparent;
  animation: spinnerRotate 0.75s linear infinite;
}

/* Text loading */
span {
  font-weight: 600;
  letter-spacing: 0.8px;
}

/* Alert thông báo */
.alert-success {
  margin-top: 1.6rem;
  background-color: #e3e0ff;
  color: #4e3b8b;
  font-weight: 600;
  padding: 1rem 1.4rem;
  border-radius: 14px;
  text-align: center;
  box-shadow: 0 3px 15px rgba(102, 126, 234, 0.2);
}

/* Animation */
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