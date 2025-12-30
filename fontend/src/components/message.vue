<template>
  <div class="instagram-direct-layout">
    
    <Sidebar :user="me" />

    <div class="direct-content">
      
      <div class="inbox-column" :class="{ 'hidden-on-mobile': activeConversation }">
        <div class="sidebar-header">
          <div class="username-wrapper">
            <span class="my-username">{{ me?.name || 'Đang tải...' }}</span>
            <svg aria-label="Down Chevron" class="chevron-icon" fill="currentColor" height="12" viewBox="0 0 24 24" width="12"><path d="M21 17.502a.997.997 0 0 1-.707-.293L12 8.913l-8.293 8.296a1 1 0 1 1-1.414-1.414l9-9.004a1.03 1.03 0 0 1 1.414 0l9 9.004A1 1 0 0 1 21 17.502Z"></path></svg>
          </div>
          <button class="new-msg-btn">
            <svg aria-label="New Message" fill="currentColor" height="24" viewBox="0 0 24 24" width="24"><path d="M12.202 3.203H5.25a3 3 0 0 0-3 3V18.75a3 3 0 0 0 3 3h12.547a3 3 0 0 0 3-3v-6.952" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path><path d="M10.002 13.703 19.502 4.203m0 0 1.499 1.499m-1.499-1.499-1.499-1.499" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path><line fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" x1="13.502" x2="7.002" y1="17.203" y2="17.203"></line></svg>
          </button>
        </div>

        <div class="tabs">
          <span class="tab active">Tin nhắn</span>
          <span class="tab">Tin nhắn chờ</span>
        </div>

        <ul class="conversation-list custom-scrollbar">
          <li v-for="conv in conversations" :key="conv._id" 
              :class="{ active: activeConversation?._id === conv._id }"
              @click="selectConversation(conv)">
            <div class="avatar-wrapper">
              <img :src="getAvatar(conv.displayAvatar)" class="avatar" />
            </div>
            <div class="conv-info">
              <span class="conv-name">{{ conv.displayName }}</span>
              <div class="conv-meta">
                <span class="last-msg">
                  {{ isMe(conv.lastMessage?.sender) ? 'Bạn: ' : '' }}
                  {{ conv.lastMessage?.text ? conv.lastMessage.text.slice(0, 30) : (conv.lastMessage?.attachments?.length ? 'Đã gửi file' : '') }}
                </span>
                <span class="dot" v-if="conv.lastMessage">•</span>
                <span class="time" v-if="conv.lastMessage">{{ formatTimeAgo(conv.updatedAt) }}</span>
              </div>
            </div>
          </li>
        </ul>
      </div>

      <div class="chat-column" v-if="activeConversation">
        <div class="chat-header">
          <button class="back-btn-mobile" @click="activeConversation = null">
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </button>
          
          <div class="header-user-info">
            <img :src="getAvatar(activeConversation.displayAvatar)" class="header-avatar" />
            <span class="header-username">{{ activeConversation.displayName }}</span>
          </div>
          
          <div class="header-actions">
             <svg class="icon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" width="24" height="24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
             <svg class="icon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" width="24" height="24"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
          </div>
        </div>

        <div class="messages-container custom-scrollbar" ref="messagesRef">
          <div class="messages-spacer"></div>
          
          <div v-for="(msg, index) in messages" :key="msg._id || msg.tempId" style="width: 100%;">
            <div class="time-divider" v-if="shouldShowTime(index)">{{ formatFullTime(msg.createdAt) }}</div>

            <div class="message-row" :class="isMe(msg.sender) ? 'my-msg' : 'them-msg'">
              <div v-if="!isMe(msg.sender)" class="them-avatar-container">
                 <img v-if="shouldShowAvatar(index)" :src="getAvatar(msg.sender.avatar)" class="msg-avatar" />
                 <div v-else class="avatar-placeholder"></div>
              </div>

              <div class="msg-content-group">
                <div class="msg-actions" v-if="isMe(msg.sender)">
                   <button class="action-btn">⋮</button><button class="action-btn">↩</button><button class="action-btn">☺</button>
                </div>

                <div class="bubble-wrapper">
                   <div v-if="msg.text" class="bubble" :class="isMe(msg.sender) ? 'bubble-me' : 'bubble-them'">{{ msg.text }}</div>
                   <div v-if="msg.attachments?.length" class="media-bubble">
                     <template v-for="(file, i) in msg.attachments" :key="i">
                        <img v-if="file.type === 'image'" :src="getFileUrl(file.url)" class="bubble-img" />
                        <video v-else :src="getFileUrl(file.url)" class="bubble-video" controls></video>
                     </template>
                   </div>
                </div>

                <div class="msg-actions" v-if="!isMe(msg.sender)">
                   <button class="action-btn">☺</button><button class="action-btn">↩</button><button class="action-btn">⋮</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="input-area">
          <div v-if="previewFiles.length" class="preview-bar">
             <div v-for="(file, i) in previewFiles" :key="i" class="preview-item">
                <img v-if="file.type.startsWith('image/')" :src="file.url" />
                <video v-else :src="file.url"></video>
                <button class="remove-preview" @click="removePreview(i)">✕</button>
             </div>
          </div>

          <form @submit.prevent="sendMessage" class="chat-input-wrapper">
            <button type="button" class="icon-btn emoji-btn">☺</button>
            <div class="input-field-wrapper">
               <input v-model="text" placeholder="Nhắn tin..." class="real-input" />
            </div>
            <div class="right-actions" v-if="!text && files.length === 0">
               <button type="button" class="icon-btn" @click="$refs.fileInput.click()">
                 <svg aria-label="Add Photo" fill="currentColor" height="24" viewBox="0 0 24 24" width="24"><path d="M20.627 4H3.373C1.513 4 0 5.52 0 7.387v11.226c0 1.867 1.513 3.387 3.373 3.387h17.254c1.86 0 3.373-1.52 3.373-3.387V7.387C24 5.52 22.487 4 20.627 4ZM8.027 9.013a2.2 2.2 0 1 1-2.2 2.2 2.2 2.2 0 0 1 2.2-2.2Zm13.707 8.974a1.107 1.107 0 0 1-1.107 1.106H3.373a1.107 1.107 0 0 1-1.107-1.106v-1.614l4.6-4.626a1.106 1.106 0 0 1 1.564 0l1.334 1.333 6.32-6.32a1.107 1.107 0 0 1 1.564 0l4.107 4.106v5.12Z"></path></svg>
               </button>
               <button type="button" class="icon-btn like-heart" @click="sendHeart">
                 <svg aria-label="Like" fill="currentColor" height="24" viewBox="0 0 24 24" width="24"><path d="M16.792 3.904A4.989 4.989 0 0 1 21.5 9.122c0 3.072-2.652 4.959-5.197 7.222-2.512 2.243-3.865 3.469-4.303 3.752-.477-.309-2.143-1.823-4.303-3.752C5.141 14.072 2.5 12.167 2.5 9.122a4.989 4.989 0 0 1 4.708-5.218 4.21 4.21 0 0 1 3.675 1.941c.843 1.175 1.23 1.795 1.23 1.795s.306-.494 1.068-1.712a5.685 5.685 0 0 1 3.611-2.024Z"></path></svg>
               </button>
            </div>
            <button v-else type="submit" class="send-text-btn">Gửi</button>
            <input type="file" ref="fileInput" @change="onFileChange" multiple style="display: none" />
          </form>
        </div>
      </div>

      <div class="chat-column empty-state" v-else>
         <div class="empty-content">
            <div class="empty-icon">
               <svg aria-label="Direct" fill="none" stroke="currentColor" stroke-width="2" height="96" viewBox="0 0 24 24" width="96"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            </div>
            <h3>Tin nhắn của bạn</h3>
            <p>Gửi ảnh và tin nhắn riêng tư cho bạn bè hoặc nhóm.</p>
            <button class="send-msg-btn">Gửi tin nhắn</button>
         </div>
      </div>

    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, nextTick } from "vue";
import { io } from "socket.io-client";
import axios from "axios";
import { useRoute } from "vue-router";
import Sidebar from "../components/Sidebar.vue"; // Component Menu chính của App

export default {
  name: "ChatView",
  components: { Sidebar },
  setup() {
    const route = useRoute();
    const userStr = localStorage.getItem("user");
    const me = ref(userStr ? JSON.parse(userStr) : {});
    const token = localStorage.getItem("token");
    const socket = io("http://localhost:8080", { auth: { token } });

    const conversations = ref([]);
    const activeConversation = ref(null);
    const messages = ref([]);
    const text = ref("");
    const files = ref([]);
    const previewFiles = ref([]);
    const messagesRef = ref(null);
    const fileInput = ref(null);

    // --- UTILS ---
    const getAnyId = (obj) => {
        if (!obj) return null;
        if (typeof obj === 'string') return obj;
        return obj._id || obj.id;
    };
    const isMe = (sender) => {
       if (!me.value) return false;
       const myId = getAnyId(me.value);
       const senderId = getAnyId(sender);
       return String(senderId) === String(myId);
    };
    const getAvatar = (avatar) => avatar ? `http://localhost:8080${avatar}` : "/default-avatar.png";
    const getFileUrl = (file) => file && file.startsWith("http") ? file : `http://localhost:8080${file}`;
    const formatTimeAgo = () => 'vừa xong';
    const formatFullTime = (d) => new Date(d).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'numeric' });
    const shouldShowTime = (i) => i === 0;
    const shouldShowAvatar = (i) => {
      const cur = messages.value[i];
      const next = messages.value[i+1];
      return getAnyId(cur.sender) !== getAnyId(next?.sender);
    };

    // --- API & LOGIC ---
    const fetchConversations = async () => {
      try {
        const res = await axios.get("http://localhost:8080/conversations", { headers: { Authorization: `Bearer ${token}` } });
        conversations.value = (res.data.conversations || []);
        if (route.query.conversationId) {
           const target = conversations.value.find(c => c._id === route.query.conversationId);
           if (target) selectConversation(target);
        }
      } catch (err) { console.error(err); }
    };

    const selectConversation = async (conv) => {
      if (activeConversation.value?._id === conv._id) return;
      if (activeConversation.value) socket.emit("leaveConversation", activeConversation.value._id);
      activeConversation.value = conv;
      socket.emit("joinConversation", conv._id);
      try {
        const res = await axios.get(`http://localhost:8080/conversation/${conv._id}/messages`, { headers: { Authorization: `Bearer ${token}` } });
        messages.value = res.data.messages.map((m) => ({...m, sender: m.sender || { _id: m.senderId }}));
        scrollToBottom();
      } catch (err) { console.error(err); }
    };

    const sendMessage = async () => {
      if (!text.value.trim() && files.value.length === 0) return;
      const tempId = crypto.randomUUID();
      const localMsg = { tempId, sender: { ...me.value }, text: text.value, attachments: previewFiles.value.map(f => ({ url: f.url, type: f.type.startsWith("video/") ? "video" : "image" })), createdAt: new Date().toISOString() };
      messages.value.push(localMsg);
      scrollToBottom();
      const formData = new FormData();
      formData.append("conversationId", activeConversation.value._id);
      if (text.value.trim()) formData.append("text", text.value.trim());
      files.value.forEach(f => f.type.startsWith("video/") ? formData.append("videos", f) : formData.append("images", f));
      formData.append("tempId", tempId);
      try {
        const res = await axios.post("http://localhost:8080/message/send", formData, { headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" } });
        const idx = messages.value.findIndex(m => m.tempId === tempId);
        if (idx !== -1) messages.value[idx] = res.data.message;
      } catch (err) { console.error(err); } finally { text.value = ""; files.value = []; previewFiles.value = []; }
    };

    const sendHeart = () => { text.value = "❤️"; sendMessage(); };
    const onFileChange = (e) => {
        const selected = Array.from(e.target.files);
        files.value = [...files.value, ...selected];
        previewFiles.value = [...previewFiles.value, ...selected.map(f => ({ file: f, type: f.type, url: URL.createObjectURL(f) }))];
    };
    const removePreview = (i) => { previewFiles.value.splice(i, 1); files.value.splice(i, 1); };
    const handleReceive = (msg) => { 
       if (activeConversation.value?._id !== msg.conversationId) return; 
       if (!messages.value.some(m => m._id === msg._id || m.tempId === msg.tempId)) {
           messages.value.push(msg); scrollToBottom(); 
       }
    };
    const scrollToBottom = () => { nextTick(() => { if (messagesRef.value) messagesRef.value.scrollTop = messagesRef.value.scrollHeight; }); };

    onMounted(() => { fetchConversations(); socket.on("receiveMessage", handleReceive); });
    onUnmounted(() => socket.off("receiveMessage", handleReceive));

    return {
      me, conversations, activeConversation, messages, text, files, previewFiles,
      selectConversation, sendMessage, getAvatar, getFileUrl, onFileChange, removePreview,
      messagesRef, fileInput, shouldShowAvatar, formatTimeAgo, formatFullTime, shouldShowTime, 
      sendHeart, isMe, getAnyId
    };
  },
};
</script>

<style scoped>
/* 1. LAYOUT CHÍNH (Light Mode) */
.instagram-direct-layout {
  display: flex;
  height: 100vh;
  background-color: #fff;
  color: #262626;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

/* 2. KHU VỰC NỘI DUNG (Bên phải Sidebar) */
.direct-content {
  flex: 1; /* Chiếm hết phần còn lại */
  display: flex;
  background-color: #fff;
  
  /* Căn lề trái bằng độ rộng của Sidebar App để không bị che */
  margin-left: 245px; /* Sidebar rộng 245px */
}

/* Responsive: Sidebar thu nhỏ */
@media (max-width: 1264px) { .direct-content { margin-left: 72px; } }
@media (max-width: 768px) { .direct-content { margin-left: 0; } }

/* 3. CỘT INBOX (List tin nhắn) */
.inbox-column {
  width: 350px;
  border-right: 1px solid #dbdbdb;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.sidebar-header { height: 60px; border-bottom: 1px solid #dbdbdb; display: flex; align-items: center; justify-content: space-between; padding: 0 20px; }
.username-wrapper { font-weight: 700; font-size: 16px; cursor: pointer; display: flex; align-items: center; gap: 5px; }
.new-msg-btn { background: none; border: none; color: #262626; cursor: pointer; }
.tabs { display: flex; padding: 10px 0; border-bottom: 1px solid #dbdbdb; }
.tab { flex: 1; text-align: center; font-weight: 600; color: #8e8e8e; padding-bottom: 10px; cursor: pointer; font-size: 14px; }
.tab.active { color: #262626; border-bottom: 1px solid #262626; }
.conversation-list { list-style: none; padding: 0; margin: 0; overflow-y: auto; flex: 1; }
.conversation-list li { display: flex; align-items: center; padding: 10px 20px; cursor: pointer; }
.conversation-list li:hover { background-color: #fafafa; }
.conversation-list li.active { background-color: #efefef; }
.avatar-wrapper { margin-right: 12px; }
.avatar { width: 56px; height: 56px; border-radius: 50%; object-fit: cover; }
.conv-info { flex: 1; overflow: hidden; }
.conv-name { font-weight: 400; font-size: 14px; color: #262626; }
.conv-meta { color: #8e8e8e; font-size: 13px; margin-top: 2px; }
.last-msg { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 180px; }
.dot { margin: 0 4px; }

/* 4. CỘT CHAT (Cửa sổ chat) */
.chat-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #fff;
  min-width: 0;
}

/* Header */
.chat-header { height: 60px; border-bottom: 1px solid #dbdbdb; display: flex; align-items: center; padding: 0 20px; }
.header-user-info { display: flex; align-items: center; flex: 1; cursor: pointer; }
.header-avatar { width: 24px; height: 24px; border-radius: 50%; margin-right: 12px; object-fit: cover; }
.header-username { font-weight: 600; font-size: 16px; }
.header-actions { display: flex; gap: 15px; color: #262626; }
.icon { cursor: pointer; }

/* Messages List */
.messages-container { flex: 1; padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 2px; }
.time-divider { text-align: center; color: #8e8e8e; font-size: 12px; margin: 15px 0; font-weight: 500; }

/* ROW LAYOUT */
.message-row { display: flex; width: 100%; margin-bottom: 8px; box-sizing: border-box; }
.them-msg { justify-content: flex-start !important; margin-right: auto; }
.my-msg { justify-content: flex-end !important; margin-left: auto; }

.them-avatar-container { width: 28px; margin-right: 8px; display: flex; align-items: flex-end; flex-shrink: 0; }
.msg-avatar { width: 28px; height: 28px; border-radius: 50%; object-fit: cover; }
.avatar-placeholder { width: 28px; }

.msg-content-group { display: flex; align-items: center; max-width: 65%; }

/* BUBBLES */
.bubble-wrapper { display: flex; flex-direction: column; }
.my-msg .bubble-wrapper { align-items: flex-end !important; }
.them-msg .bubble-wrapper { align-items: flex-start !important; }

.bubble { padding: 10px 14px; border-radius: 22px; font-size: 15px; line-height: 1.4; word-wrap: break-word; max-width: 100%; }
.bubble-them { background-color: #efefef; color: #262626; border: 1px solid transparent; }
.bubble-me { background-color: #3797f0; color: #fff; }
.media-bubble img, .media-bubble video { max-width: 240px; border-radius: 18px; border: 1px solid #efefef; margin-top: 2px; }

/* Actions */
.msg-actions { display: flex; gap: 4px; opacity: 0; transition: opacity 0.2s; padding: 0 8px; }
.message-row:hover .msg-actions { opacity: 1; }
.action-btn { background: none; border: none; color: #8e8e8e; cursor: pointer; padding: 4px; font-size: 16px; }
.action-btn:hover { color: #262626; }

/* INPUT */
.input-area { padding: 20px; }
.chat-input-wrapper { display: flex; align-items: center; border: 1px solid #dbdbdb; border-radius: 22px; padding: 6px 12px; min-height: 44px; }
.input-field-wrapper { flex: 1; display: flex; }
.real-input { width: 100%; border: none; outline: none; font-size: 15px; color: #262626; background: transparent; }
.real-input::placeholder { color: #8e8e8e; }
.right-actions { display: flex; gap: 8px; }
.icon-btn { background: none; border: none; color: #262626; cursor: pointer; display: flex; align-items: center; }
.emoji-btn { font-size: 24px; margin-right: 8px; color: #262626; }
.send-text-btn { color: #0095f6; font-weight: 600; font-size: 14px; border: none; background: none; cursor: pointer; }
.preview-bar { display: flex; gap: 10px; padding-bottom: 10px; }
.preview-item img { width: 50px; height: 50px; border-radius: 8px; object-fit: cover; }
.remove-preview { position: absolute; top: -5px; right: -5px; background: #000; color: #fff; border-radius: 50%; width: 16px; height: 16px; font-size: 10px; cursor: pointer; border: none; }

/* EMPTY STATE */
.empty-state { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; background-color: #fff; color: #262626; }
.empty-icon { width: 96px; height: 96px; border: 2px solid #262626; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 15px; }
.empty-content h3 { font-size: 20px; margin-bottom: 5px; font-weight: 400; }
.empty-content p { color: #8e8e8e; font-size: 14px; margin-bottom: 20px; }
.send-msg-btn { background-color: #0095f6; color: #fff; border: none; border-radius: 4px; padding: 6px 14px; font-weight: 600; cursor: pointer; }

/* RESPONSIVE */
@media (max-width: 768px) {
  .direct-content { margin-left: 0; }
  .inbox-column { width: 100%; display: flex; }
  .hidden-on-mobile { display: none; }
  .chat-column { width: 100%; z-index: 20; position: fixed; top: 0; left: 0; height: 100vh; }
  .back-btn-mobile { display: block; background: none; border: none; margin-right: 10px; color: #262626; }
  .empty-state { display: none; }
}

.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #dbdbdb; border-radius: 4px; }
</style>