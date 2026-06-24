<!-- AI 辅助生成：DeepSeek V4 + Claude -->
<script setup>
import { ref } from 'vue'
import { compressImage, fileToDataURL } from '@/utils/compress'

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  maxFiles: { type: Number, default: 9 },
  maxSizeKB: { type: Number, default: 200 },
})

const emit = defineEmits(['update:modelValue'])

const previews = ref([])
const isDragging = ref(false)

async function handleFiles(files) {
  const fileList = [...files].slice(0, props.maxFiles - previews.value.length)

  for (const file of fileList) {
    if (!file.type.startsWith('image/')) continue

    try {
      const compressed = await compressImage(file, props.maxSizeKB)
      const dataURL = await fileToDataURL(compressed)
      previews.value.push({ file: compressed, dataURL, id: Date.now() + Math.random() })
    } catch (err) {
      console.error('图片处理失败:', err)
    }
  }

  emit('update:modelValue', previews.value.map((p) => p.file))
}

function onDragOver(e) {
  e.preventDefault()
  isDragging.value = true
}

function onDragLeave() {
  isDragging.value = false
}

function onDrop(e) {
  e.preventDefault()
  isDragging.value = false
  handleFiles(e.dataTransfer.files)
}

function onFileInput(e) {
  handleFiles(e.target.files)
}

function removeImage(index) {
  previews.value.splice(index, 1)
  emit('update:modelValue', previews.value.map((p) => p.file))
}
</script>

<template>
  <div class="image-uploader">
    <!-- 拖拽区域 -->
    <div
      class="image-uploader__zone"
      :class="{ 'image-uploader__zone--dragging': isDragging }"
      @dragover="onDragOver"
      @dragleave="onDragLeave"
      @drop="onDrop"
    >
      <input
        type="file"
        accept="image/*"
        multiple
        class="image-uploader__input"
        @change="onFileInput"
      />
      <i class="fa-solid fa-cloud-arrow-up image-uploader__icon"></i>
      <p>拖拽图片到此处</p>
      <p class="text-muted">或点击选择文件（最多 {{ maxFiles }} 张）</p>
    </div>

    <!-- 预览列表 -->
    <div v-if="previews.length" class="image-uploader__previews">
      <div v-for="(preview, idx) in previews" :key="preview.id" class="image-uploader__preview">
        <img :src="preview.dataURL" alt="预览" />
        <button class="image-uploader__remove" @click="removeImage(idx)">
          <i class="fa-solid fa-times"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.image-uploader__zone {
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-6);
  text-align: center;
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
  position: relative;
}
.image-uploader__zone:hover,
.image-uploader__zone--dragging {
  border-color: var(--color-accent);
  background: var(--color-accent-light);
}

.image-uploader__input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.image-uploader__icon {
  font-size: 48px;
  color: var(--color-accent);
  margin-bottom: var(--space-3);
}

.image-uploader__previews {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: var(--space-3);
  margin-top: var(--space-4);
}

.image-uploader__preview {
  position: relative;
  aspect-ratio: 1;
  border-radius: var(--radius-sm);
  overflow: hidden;
}
.image-uploader__preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-uploader__remove {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 24px;
  height: 24px;
  border-radius: var(--radius-round);
  background: var(--color-danger);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  opacity: 0;
  transition: opacity var(--duration-fast);
}
.image-uploader__preview:hover .image-uploader__remove {
  opacity: 1;
}
</style>
