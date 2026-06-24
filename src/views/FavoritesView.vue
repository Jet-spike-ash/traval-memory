<!-- AI 辅助生成：DeepSeek V4 + Claude -->
<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { formatDateCN } from '@/utils/date'
import AppHeader from '@/components/layout/AppHeader.vue'

const router = useRouter()
const KEY = 'memento_favorites'

function loadFavorites() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] }
}
function saveFavorites(list) { localStorage.setItem(KEY, JSON.stringify(list)) }

const favorites = ref(loadFavorites())

function removeFavorite(id) {
  favorites.value = favorites.value.filter((f) => f.id !== id)
  saveFavorites(favorites.value)
}

function openMemory(f) {
  router.push(`/memory/${f.id}?from=favorites`)
}
</script>

<template>
  <div class="fav-page">
    <AppHeader />
    <main class="fav-page__main container">
      <h1 class="fav__title"><i class="fa-solid fa-star"></i> 收藏夹</h1>
      <p class="text-muted fav__subtitle">{{ favorites.length }} 段珍藏</p>

      <div v-if="favorites.length" class="fav-grid">
        <article v-for="f in favorites" :key="f.id" class="fav-card glass">
          <div class="fav-card__image" @click="openMemory(f)">
            <img v-if="f.image" :src="f.image" :alt="f.title" loading="lazy" />
            <div v-else class="fav-card__ph"><i class="fa-solid fa-image"></i></div>
          </div>
          <div class="fav-card__body">
            <h3 @click="openMemory(f)">{{ f.title }}</h3>
            <p class="text-muted" style="font-size: 12px;">
              <i class="fa-solid fa-location-dot"></i> {{ f.location }}
              &nbsp; <i class="fa-solid fa-user"></i> {{ f.author }}
            </p>
            <p class="text-muted" style="font-size: 11px;">{{ formatDateCN(f.date) }}</p>
          </div>
          <button class="fav-card__remove" @click.stop="removeFavorite(f.id)" title="取消收藏">
            <i class="fa-solid fa-star"></i>
          </button>
        </article>
      </div>

      <div v-else class="fav__empty">
        <i class="fa-regular fa-star"></i>
        <p>还没有收藏任何记忆</p>
        <button class="btn btn--go" @click="router.push('/about')">去漂流广场发现</button>
      </div>
    </main>
  </div>
</template>

<style scoped>
.fav-page { min-height: 100vh; background: var(--color-bg); padding-top: 64px; }
.fav-page__main { padding: var(--space-6); max-width: 900px; }
.fav__title { font: var(--text-h1); color: var(--color-primary-dark); }
.fav__title i { color: #D9A05B; margin-right: var(--space-2); }
.fav__subtitle { margin-bottom: var(--space-5); }

.fav-grid { columns: 3; column-gap: var(--space-4); }
.fav-card { break-inside: avoid; margin-bottom: var(--space-4); overflow: hidden; position: relative; }
.fav-card__image { width: 100%; cursor: pointer; overflow: hidden; }
.fav-card__image img { width: 100%; display: block; transition: transform var(--duration-slow); }
.fav-card:hover .fav-card__image img { transform: scale(1.03); }
.fav-card__ph { width: 100%; height: 140px; display: flex; align-items: center; justify-content: center; background: var(--color-accent-light); color: var(--color-text-muted); font-size: 28px; }
.fav-card__body { padding: var(--space-3); }
.fav-card__body h3 { font: 15px/1.3 var(--font-serif); color: var(--color-primary-dark); cursor: pointer; margin-bottom: 2px; }
.fav-card__body h3:hover { color: var(--color-accent); }

.fav-card__remove {
  position: absolute; top: var(--space-2); right: var(--space-2);
  width: 32px; height: 32px; border-radius: var(--radius-round);
  background: rgba(255,255,255,0.85); color: #D9A05B; font-size: 16px;
  display: flex; align-items: center; justify-content: center;
  opacity: 0; transition: opacity var(--duration-fast);
}
.fav-card:hover .fav-card__remove { opacity: 1; }
.fav-card__remove:hover { background: #D9A05B; color: #fff; }

.fav__empty { text-align: center; padding: var(--space-8); color: var(--color-text-muted); }
.fav__empty i { font-size: 56px; margin-bottom: var(--space-4); display: block; }
.btn--go { margin-top: var(--space-4); padding: var(--space-3) var(--space-5); border-radius: var(--radius-pill); background: var(--color-primary); color: #fff; font-weight: 600; }

@media (max-width: 768px) { .fav-grid { columns: 2; } }
@media (max-width: 480px) { .fav-grid { columns: 1; } }
</style>
