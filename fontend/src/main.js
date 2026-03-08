import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router/index'


createApp(App).use(router).mount('#app')
axios.defaults.baseURL = 'https://insta-123.onrender.com';