<!-- AI 辅助生成：DeepSeek V4 + Claude -->
<script setup>
import { ref, onMounted, computed } from 'vue'
import { useMemoryStore } from '@/stores/memoryStore'
import { useUserStore } from '@/stores/userStore'
import { useUiStore } from '@/stores/uiStore'
import { formatDateCN } from '@/utils/date'
import html2canvas from 'html2canvas'
import AppHeader from '@/components/layout/AppHeader.vue'
import Loader from '@/components/common/Loader.vue'

const memoryStore = useMemoryStore()
const userStore = useUserStore()
const uiStore = useUiStore()
const loading = ref(true)
const selectedId = ref(null)
const saving = ref(false)
const cardRef = ref(null)

const selectedMemory = computed(() => memoryStore.memories.find((m) => m.id === selectedId.value))

async function saveImage() {
  if (!cardRef.value) return
  saving.value = true
  try {
    const canvas = await html2canvas(cardRef.value, { backgroundColor: '#F7F2E9', scale: 2, useCORS: true })
    const link = document.createElement('a')
    link.download = `memento-${selectedMemory.value?.title || 'postcard'}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
    uiStore.showToast('明信片已保存 📮', 'success')
  } catch {
    uiStore.showToast('保存失败', 'error')
  } finally { saving.value = false }
}

onMounted(async () => {
  if (!userStore.userId) await new Promise((r) => setTimeout(r, 400))
  if (userStore.userId) await memoryStore.fetchMemories(userStore.userId)
  if (memoryStore.memories.length > 0) selectedId.value = memoryStore.memories[0].id
  loading.value = false
})
</script>

<template>
  <div class="postcard-page">
    <AppHeader />
    <Loader :visible="loading" />
    <main v-if="!loading" class="postcard-page__main container">
      <h1 class="pc__title"><i class="fa-solid fa-envelope"></i> 手札·明信片工坊</h1>

      <!-- 选择记忆 -->
      <div class="pc-select glass" v-if="memoryStore.memories.length > 0">
        <label>选择记忆：</label>
        <select v-model="selectedId" class="pc-select__dropdown">
          <option v-for="m in memoryStore.memories" :key="m.id" :value="m.id">{{ m.title }} — {{ m.location_name }}</option>
        </select>
      </div>

      <!-- 明信片预览 -->
      <div v-if="selectedMemory" class="pc-preview">
        <div ref="cardRef" class="pc-card">
          <div class="pc-card__stamp">MEMENTO·迹</div>
          <div class="pc-card__image">
            <img v-if="selectedMemory.images?.length" :src="selectedMemory.images[0]" crossorigin="anonymous" />
          </div>
          <div class="pc-card__body">
            <h2 class="pc-card__title">{{ selectedMemory.title }}</h2>
            <p class="pc-card__location"><i class="fa-solid fa-location-dot"></i> {{ selectedMemory.location_name }}</p>
            <p class="pc-card__date"><i class="fa-solid fa-calendar"></i> {{ formatDateCN(selectedMemory.happened_date) }}</p>
            <p class="pc-card__story">{{ selectedMemory.story?.replace(/[#*`]/g, '').slice(0, 200) }}</p>
            <div class="pc-card__footer">
              <span>From: {{ userStore.username }}</span>
              <span>{{ formatDateCN(new Date()) }}</span>
            </div>
          </div>
        </div>
        <button class="btn btn--save" :disabled="saving" @click="saveImage">
          <i class="fa-solid fa-download"></i> {{ saving ? '生成中...' : '保存为图片' }}
        </button>
      </div>

      <div v-else class="pc__empty text-muted">
        <i class="fa-solid fa-envelope-open-text"></i>
        <p>还没有记忆可以制作明信片</p>
      </div>
    </main>
  </div>
</template>

<style scoped>
.postcard-page { min-height: 100vh; background: var(--color-bg); padding-top: 64px; }
.postcard-page__main { padding: var(--space-6); max-width: 600px; }
.pc__title { font: var(--text-h1); color: var(--color-primary-dark); margin-bottom: var(--space-5); }
.pc__title i { color: var(--color-accent); }

.pc-select { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-3) var(--space-4); margin-bottom: var(--space-5); }
.pc-select label { font-weight: 600; white-space: nowrap; }
.pc-select__dropdown { flex: 1; padding: var(--space-2) var(--space-3); border: 1px solid var(--color-border); border-radius: var(--radius-sm); font-size: var(--text-sm); }

.pc-preview { display: flex; flex-direction: column; align-items: center; gap: var(--space-4); }

.pc-card {
  width: 100%;
  max-width: 500px;
  background: #fff;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
  position: relative;
}

.pc-card__stamp {
  position: absolute;
  top: var(--space-4);
  right: var(--space-4);
  padding: var(--space-1) var(--space-3);
  border: 2px solid var(--color-accent);
  border-radius: var(--radius-pill);
  font-family: var(--font-serif);
  font-size: 11px;
  color: var(--color-accent);
  transform: rotate(8deg);
  background: rgba(255,255,255,0.8);
  z-index: 2;
}

.pc-card__image { width: 100%; height: 240px; overflow: hidden; }
.pc-card__image img { width: 100%; height: 100%; object-fit: cover; }

.pc-card__body { padding: var(--space-4); }
.pc-card__title { font: var(--text-h2); color: var(--color-primary-dark); }
.pc-card__location, .pc-card__date { font-size: var(--text-xs); color: var(--color-text-secondary); margin-top: 2px; }
.pc-card__story { margin-top: var(--space-3); font-size: var(--text-sm); line-height: 1.6; color: var(--color-text-primary); }
.pc-card__footer { margin-top: var(--space-4); padding-top: var(--space-3); border-top: 1px dashed var(--color-border); display: flex; justify-content: space-between; font-size: var(--text-xs); color: var(--color-text-muted); }

.btn--save {
  padding: var(--space-3) var(--space-6);
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light));
  color: #fff;
  border-radius: var(--radius-pill);
  font-weight: 600;
  font-size: var(--text-btn);
  display: flex; align-items: center; gap: var(--space-2);
}
.btn--save:disabled { opacity: 0.5; }

.pc__empty { text-align: center; padding: var(--space-8); }
.pc__empty i { font-size: 48px; margin-bottom: var(--space-3); display: block; }
</style>
