import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router/index'
// axios.defaults.baseURL = 'https://insta-123.onrender.com';
// axios.defaults.withCredentials = true;
createApp(App).use(router).mount('#app')
