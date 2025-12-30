<template>

  <aside class="sidebar-left">

    <div class="sidebar-brand" @click="goHome">Instaclone</div>

   

    <nav class="sidebar-menu">

      <div class="menu-item" @click="goHome" title="Trang chủ">

        <svg fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="menu-icon">

          <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />

        </svg>

        <span class="menu-label">Trang chủ</span>

      </div>



      <div class="menu-item" @click="$emit('toggleSearch')" title="Tìm kiếm">

        <svg fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="menu-icon">

          <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />

        </svg>

        <span class="menu-label">Tìm kiếm</span>

      </div>



      <div class="menu-item" @click="startConversation" title="Tin nhắn">

        <svg fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="menu-icon">

          <path stroke-linecap="round" stroke-linejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />

        </svg>

        <span class="menu-label">Tin nhắn</span>

      </div>



      <div class="menu-item" @click="goNotifications" title="Thông báo">

        <svg fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="menu-icon">

          <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />

        </svg>

        <span class="menu-label">Thông báo</span>

      </div>



      <div class="menu-item" @click="dangbai" title="Tạo bài viết">

        <svg fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="menu-icon">

          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />

        </svg>

        <span class="menu-label">Tạo</span>

      </div>



      <div class="menu-item" @click="goToProfile(user?._id)" title="Trang cá nhân">

        <img v-if="user?.avatar" :src="getImageUrl(user.avatar)" class="menu-avatar" />

        <span class="menu-label" :style="{ fontWeight: 'bold' }">Trang cá nhân</span>

      </div>

    </nav>



    <div class="sidebar-footer">

      <div class="menu-item" @click="logout" title="Đăng xuất">

        <svg fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="menu-icon">

          <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />

        </svg>

        <span class="menu-label">Xem thêm</span>

      </div>

    </div>

  </aside>

</template>



<script setup>

import { defineProps, defineEmits } from 'vue';

import { useRouter } from 'vue-router';



// Nhận thông tin user hiện tại qua props để hiển thị avatar và ID cho link profile

const props = defineProps({

  user: {

    type: Object,

    default: () => ({}),

  },

});



// Định nghĩa event để component cha (home.vue) có thể lắng nghe

const emit = defineEmits(['toggleSearch']);



const router = useRouter();



const getImageUrl = (path) => path?.startsWith('http') ? path : `http://localhost:8080${path || ''}`;



// Chuyển toàn bộ logic điều hướng từ home.vue sang đây

const dangbai = () => router.push('/post');

const goHome = () => router.push('/duy123');

const goToProfile = (id) => { if (id) router.push(`/profile/${id}`) };

const goNotifications = () => { router.push('/NotificationList'); };

const startConversation = () => { router.push('/message'); };

const logout = () => {

  localStorage.removeItem('token');

  router.push('/login');

};

</script>



<style scoped>

/* Di chuyển toàn bộ style liên quan đến sidebar-left từ home.vue sang đây */

  :root {

    --color-primary: #ffffff;

    --color-secondary: #000000;

    --color-border: #dbdbdb;

    --color-bg-hover: #fafafa;

  }



  /* 1. SIDEBAR LEFT STYLES (Desktop) */

  .sidebar-left {

    width: 245px;

    height: 100vh;

    position: fixed;

    top: 0;

    left: 0;

    border-right: 1px solid var(--color-border, #dbdbdb);

    background-color: var(--color-primary, #ffffff);

    z-index: 10;

    padding: 8px 12px 20px;

    display: flex;

    flex-direction: column;

    box-sizing: border-box;

    color: var(--color-secondary, #000000);

  }



  .sidebar-brand {

    font-family: 'Billabong', cursive;

    font-size: 28px;

    padding: 25px 12px 16px;

    margin-bottom: 20px;

    cursor: pointer;

  }



  .sidebar-menu {

    flex: 1;

    display: flex;

    flex-direction: column;

    gap: 8px;

  }



  .sidebar-footer {

    margin-top: auto;

    display: flex;

    flex-direction: column;

    gap: 8px;

  }

 

  .menu-item {

    display: flex;

    align-items: center;

    padding: 12px;

    border-radius: 8px;

    cursor: pointer;

    transition: background-color 0.2s;

    color: inherit;

  }



  .menu-item:hover {

    background-color: var(--color-bg-hover, #fafafa);

  }



  .menu-icon {

    width: 24px;

    height: 24px;

    margin-right: 16px;

    transition: transform 0.2s;

  }

 

  .menu-item:hover .menu-icon {

    transform: scale(1.05);

  }



  .menu-label {

    font-size: 1rem;

    font-weight: 400;

  }



  .menu-avatar {

    width: 24px;

    height: 24px;

    border-radius: 50%;

    margin-right: 16px;

    object-fit: cover;

    border: 1px solid var(--color-border, #dbdbdb);

  }



  /* --- RESPONSIVE LOGIC CỦA SIDEBAR --- */

  @media (max-width: 1000px) {

     .sidebar-left { width: 72px; padding: 8px; }

     .sidebar-brand { display: none; }

     .menu-label { display: none; }

     .menu-icon { margin-right: 0; }

     .menu-item { justify-content: center; }

  }



  @media (max-width: 768px) {

    /* Ẩn sidebar trên mobile để Topbar mobile hoạt động */

    .sidebar-left { display: none; }

  }

</style>