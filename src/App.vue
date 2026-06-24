<!-- AI 辅助生成：DeepSeek V4 + Claude -->
<script setup>
import Toast from '@/components/common/Toast.vue'
import Modal from '@/components/common/Modal.vue'
</script>

<template>
  <router-view v-slot="{ Component, route }">
    <transition name="page-fade" mode="out-in">
      <component :is="Component" :key="route.fullPath" />
    </transition>
  </router-view>

  <!-- 全局 Toast 消息提示 -->
  <Toast />
  <!-- 全局 Modal 弹窗 -->
  <Modal />
</template>

<style>
/* 页面切换过渡动画 */
.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity var(--duration-normal) var(--ease-out);
}
.page-fade-enter-from,
.page-fade-leave-to {
  opacity: 0;
}
</style>
