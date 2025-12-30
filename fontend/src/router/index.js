import { createRouter, createWebHistory } from 'vue-router'
import Login from '../components/HelloWorld.vue'
import Home from '../components/home.vue'
import register from '../components/register.vue'
import avatar from '../components/avata.vue'
import otp from '../components/otp.vue'
import post from '../components/posts.vue'
import message from '../components/message.vue'
import profile from '../components/profile.vue'
import NotificationList from '../components/NotificationList.vue'
import pos from '../components/post.vue'

const routes = [
  { path: '/duy123', name: 'Home', component: Home }, // ⚠️ Chữ hoa 'Home' để trùng với keep-alive
  { path: '/login', name: 'Login', component: Login },
  { path: '/add', name: 'Register', component: register },
  { path: '/upload', name: 'Avatar', component: avatar },
  { path: '/otp', name: 'Otp', component: otp },
  { path: '/post', name: 'Posts', component: post },
  { path: '/message', name: 'Message', component: message },
  { path: '/profile/:id', name: 'Profile', component: profile },
  { path: '/NotificationList', name: 'NotificationList', component: NotificationList },
  { path: '/post/:id', name: 'Pos', component: pos },
]

const router = createRouter({
  history: createWebHistory(),
  routes,

  // ✅ Giữ nguyên vị trí cuộn khi quay lại
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

export default router
