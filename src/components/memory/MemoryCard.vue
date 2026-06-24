<!-- AI 辅助生成：DeepSeek V4 + Claude -->
<script setup>
import { formatDateCN, getSeasonCN } from '@/utils/date'

const props = defineProps({
  memory: { type: Object, required: true },
})

defineEmits(['click'])
</script>

<template>
  <article class="memory-card glass" @click="$emit('click', memory)">
    <div class="memory-card__image">
      <img
        v-if="memory.images?.length"
        :src="memory.images[0]"
        :alt="memory.title"
        loading="lazy"
      />
      <div v-else class="memory-card__placeholder">
        <i class="fa-solid fa-image"></i>
      </div>
    </div>
    <div class="memory-card__body">
      <h3 class="memory-card__title">{{ memory.title }}</h3>
      <div class="memory-card__meta">
        <span class="memory-card__date">
          <i class="fa-solid fa-calendar"></i>
          {{ formatDateCN(memory.happened_date) }}
        </span>
        <span class="memory-card__season">
          <i class="fa-solid fa-leaf"></i>
          {{ getSeasonCN(memory.happened_date) }}
        </span>
      </div>
      <p class="memory-card__location text-muted">
        <i class="fa-solid fa-location-dot"></i>
        {{ memory.location_name }}
      </p>
    </div>
  </article>
</template>

<style scoped>
.memory-card {
  overflow: hidden;
  cursor: pointer;
  transition: transform var(--duration-normal) var(--ease-spring),
              box-shadow var(--duration-normal) var(--ease-out);
}
.memory-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
}

.memory-card__image {
  width: 100%;
  height: 200px;
  overflow: hidden;
}
.memory-card__image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--duration-slow) var(--ease-out);
}
.memory-card:hover .memory-card__image img {
  transform: scale(1.05);
}

.memory-card__placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-accent-light);
  color: var(--color-text-muted);
  font-size: 32px;
}

.memory-card__body {
  padding: var(--space-4);
}

.memory-card__title {
  font: var(--text-h3);
  margin-bottom: var(--space-2);
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.memory-card__meta {
  display: flex;
  gap: var(--space-3);
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-1);
}

.memory-card__location {
  font-size: var(--text-xs);
}
</style>
