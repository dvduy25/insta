<template>
  <div class="card p-4">
    <h3>Nhập OTP</h3>
    <input
      v-model="otp"
      class="form-control mb-3"
      placeholder="Nhập mã OTP"
      :disabled="loading"
    />

    <button
      @click="otpp"
      class="btn btn-primary w-100"
      :disabled="loading || otp.length === 0"
    >
      <span v-if="loading">
        <span
          class="spinner-border spinner-border-sm me-2"
          role="status"
          aria-hidden="true"
        ></span>
        Đang xử lý...
      </span>
      <span v-else>Register</span>
    </button>

    <div v-if="message.text" :class="`alert mt-3 alert-${message.type}`">
      {{ message.text }}
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import axios from "axios";
import router from "../router/index";
import { useRoute } from "vue-router";

const route = useRoute();
const otp = ref("");
const loading = ref(false);
const message = ref({ text: "", type: "" });
const email = route.query.email || "";

const otpp = async () => {
  message.value = { text: "", type: "" };
  loading.value = true;
  try {
    const res = await axios.post("http://localhost:8080/otp", {
      otp: otp.value,
      email: email,
    });
    if (res.data.status === 200) {
      message.value = { text: "Đăng ký thành công!", type: "success" };
       router.push( "/upload" )
      // setTimeout(() => router.push("/login"), 1500);
    } else {
      message.value = { text: res.data.error || "Lỗi không xác định", type: "danger" };
    }
  } catch (error) {
    message.value = { text: "Đăng ký thất bại. Vui lòng thử lại.", type: "danger" };
  } finally {
    loading.value = false;
  }
};
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
  letter-spacing: 1.2px;
}

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
  box-shadow: 0 8px 20px rgba(106, 62, 167, 0.7);
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
