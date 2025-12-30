<template>
  <router-view v-slot="{ Component }">
    <keep-alive include="Home,Message,Explore">
      <component :is="Component" v-if="['Home'].includes(Component.name)" />
    </keep-alive>

    <component :is="Component" v-if="!['Home'].includes(Component.name)" />
  </router-view>
</template>

<script>
export default {
  name: 'App'
}
</script>
