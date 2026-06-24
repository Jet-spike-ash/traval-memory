<!-- AI 辅助生成：DeepSeek V4 + Claude -->
<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useMemoryStore } from '@/stores/memoryStore'
import { useUserStore } from '@/stores/userStore'
import { useUiStore } from '@/stores/uiStore'
import { compressImage, fileToDataURL } from '@/utils/compress'
import AppHeader from '@/components/layout/AppHeader.vue'
import MapPicker from '@/components/memory/MapPicker.vue'

const router = useRouter()
const memoryStore = useMemoryStore()
const userStore = useUserStore()
const uiStore = useUiStore()

// ---- 步骤控制 ----
const currentStep = ref(1)
const totalSteps = 3
const submitting = ref(false)

const stepLabels = ['📍 选点定位', '📷 镌刻影像', '✍️ 书写故事']

function nextStep() {
  if (currentStep.value < totalSteps) {
    if (!validateStep()) return
    currentStep.value++
  }
}

function prevStep() {
  if (currentStep.value > 1) currentStep.value--
}

// ---- 表单数据 ----
const form = reactive({
  lat: 39.9042,
  lng: 116.4074,
  location_name: '',
  images: [],
  previews: [],
  title: '',
  story: '',
  happened_date: new Date().toISOString().slice(0, 10),
  weather_type: 'sunny',
  privacy_level: 0,
})

// ---- 步骤校验 ----
function validateStep() {
  if (currentStep.value === 1) {
    if (!form.lat || !form.lng) {
      uiStore.showToast('请在地图上选择一个位置', 'warning')
      return false
    }
    if (!form.location_name.trim()) {
      uiStore.showToast('请输入地点名称', 'warning')
      return false
    }
  }
  if (currentStep.value === 2) {
    if (form.previews.length === 0) {
      uiStore.showToast('请至少上传一张照片', 'warning')
      return false
    }
  }
  return true
}

// ---- 地址反查 ----
async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=zh&zoom=18`
    )
    const data = await res.json()
    if (data.address) {
      const a = data.address
      // 按中国地址层级拼接：省 > 市 > 区/县 > 街道/镇 > 路
      const parts = [
        a.state || '',
        a.city || a.town || '',
        a.county || a.district || a.suburb || '',
        a.road || a.pedestrian || a.neighbourhood || '',
      ].filter(Boolean)
      if (parts.length > 0) {
        form.location_name = parts.join('·')
      } else {
        form.location_name = data.display_name?.split(',').slice(0, 3).join('·') || `${lat.toFixed(4)}, ${lng.toFixed(4)}`
      }
    } else if (data.display_name) {
      form.location_name = data.display_name.split(',').slice(0, 3).join('·')
    }
  } catch {
    form.location_name = `${lat.toFixed(4)}, ${lng.toFixed(4)}`
  }
}

function onMapPick({ lat, lng }) {
  form.lat = lat
  form.lng = lng
  reverseGeocode(lat, lng)
}

// ---- 图片处理 ----
const isDragging = ref(false)

async function handleFiles(files) {
  const remaining = 9 - form.previews.length
  const fileList = [...files].slice(0, remaining)

  for (const file of fileList) {
    if (!file.type.startsWith('image/')) continue
    try {
      const compressed = await compressImage(file, 200)
      const dataURL = await fileToDataURL(compressed)
      form.previews.push({ file: compressed, dataURL, id: Date.now() + Math.random() })
      form.images.push(compressed)
    } catch (err) {
      console.error('图片处理失败:', err)
    }
  }
}

function onDragOver(e) { e.preventDefault(); isDragging.value = true }
function onDragLeave() { isDragging.value = false }
function onDrop(e) { e.preventDefault(); isDragging.value = false; handleFiles(e.dataTransfer.files) }
function onFileInput(e) { handleFiles(e.target.files) }
function removeImage(idx) { form.previews.splice(idx, 1); form.images.splice(idx, 1) }

// ---- 提交 ----
async function handleSubmit() {
  if (!validateStep() || submitting.value) return
  submitting.value = true

  try {
    await memoryStore.addMemory({
      user_id: userStore.userId,
      title: form.title,
      story: form.story,
      lat: form.lat,
      lng: form.lng,
      location_name: form.location_name,
      happened_date: form.happened_date,
      weather_type: form.weather_type,
      images: form.previews.map((p) => p.dataURL),
      privacy_level: form.privacy_level,
      created_at: new Date().toISOString(),
    })
    router.push('/timeline')
  } catch (err) {
    // 已在 store 中处理 toast
  } finally {
    submitting.value = false
  }
}

// ---- 天气选项 ----
const weatherOptions = [
  { value: 'sunny', label: '晴', icon: 'fa-sun' },
  { value: 'cloudy', label: '多云', icon: 'fa-cloud' },
  { value: 'rain', label: '雨', icon: 'fa-cloud-rain' },
  { value: 'snow', label: '雪', icon: 'fa-snowflake' },
  { value: 'fog', label: '雾', icon: 'fa-smog' },
  { value: 'wind', label: '风', icon: 'fa-wind' },
]
</script>

<template>
  <div class="add-page">
    <AppHeader />

    <main class="add-page__main">
      <!-- 步骤指示器 -->
      <div class="steps-indicator">
        <div
          v-for="(label, idx) in stepLabels"
          :key="idx"
          class="step-dot"
          :class="{
            'step-dot--active': currentStep === idx + 1,
            'step-dot--done': currentStep > idx + 1,
          }"
        >
          <div class="step-dot__circle">
            <i v-if="currentStep > idx + 1" class="fa-solid fa-check"></i>
            <span v-else>{{ idx + 1 }}</span>
          </div>
          <span class="step-dot__label">{{ label }}</span>
        </div>
        <div class="steps-line">
          <div class="steps-line__fill" :style="{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }"></div>
        </div>
      </div>

      <!-- 步骤内容 -->
      <div class="add-page__card glass">
        <!-- Step 1: 地图选点 -->
        <div v-show="currentStep === 1" class="step-content">
          <h2 class="step-content__title">📍 在地图上标记你的足迹</h2>
          <p class="step-content__desc text-muted">点击地图选择位置，或拖拽缩放定位到你的目的地</p>

          <MapPicker
            :lat="form.lat"
            :lng="form.lng"
            @pick="onMapPick"
          />
        </div>

        <!-- Step 2: 图片上传 -->
        <div v-show="currentStep === 2" class="step-content">
          <h2 class="step-content__title">📷 镌刻此刻影像</h2>
          <p class="step-content__desc text-muted">拖拽或点击上传照片，自动压缩至 200KB 以内</p>

          <div
            class="upload-zone"
            :class="{ 'upload-zone--dragging': isDragging }"
            @dragover="onDragOver"
            @dragleave="onDragLeave"
            @drop="onDrop"
          >
            <input
              type="file"
              accept="image/*"
              multiple
              class="upload-zone__input"
              @change="onFileInput"
            />
            <i class="fa-solid fa-cloud-arrow-up upload-zone__icon"></i>
            <p class="upload-zone__text">拖拽图片到此处</p>
            <p class="text-muted" style="font-size: var(--text-xs);">或点击选择 · 最多 9 张 · 自动压缩</p>
          </div>

          <!-- 预览网格 -->
          <div v-if="form.previews.length" class="preview-grid">
            <div v-for="(p, idx) in form.previews" :key="p.id" class="preview-grid__item">
              <img :src="p.dataURL" alt="预览" />
              <button class="preview-grid__remove" @click="removeImage(idx)">
                <i class="fa-solid fa-times"></i>
              </button>
              <span class="preview-grid__badge">{{ idx + 1 }}</span>
            </div>
          </div>
        </div>

        <!-- Step 3: 书写故事 -->
        <div v-show="currentStep === 3" class="step-content">
          <h2 class="step-content__title">✍️ 书写你的记忆</h2>
          <p class="step-content__desc text-muted">记录下此刻的感受，支持 Markdown 格式</p>

          <div class="form-group">
            <label class="form-label"><i class="fa-solid fa-heading"></i> 记忆标题</label>
            <input
              v-model="form.title"
              type="text"
              class="form-input"
              placeholder="给这段记忆起个名字..."
            />
          </div>

          <div class="form-row">
            <div class="form-group form-group--half">
              <label class="form-label"><i class="fa-solid fa-calendar"></i> 发生日期</label>
              <input v-model="form.happened_date" type="date" class="form-input" />
            </div>
            <div class="form-group form-group--half">
              <label class="form-label"><i class="fa-solid fa-cloud-sun"></i> 天气</label>
              <div class="weather-select">
                <button
                  v-for="w in weatherOptions"
                  :key="w.value"
                  class="weather-btn"
                  :class="{ 'weather-btn--active': form.weather_type === w.value }"
                  @click="form.weather_type = w.value"
                  :title="w.label"
                >
                  <i class="fa-solid" :class="w.icon"></i>
                </button>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label"><i class="fa-solid fa-feather"></i> 记忆故事</label>
            <textarea
              v-model="form.story"
              class="form-textarea"
              rows="8"
              placeholder="写下你的故事... 支持 Markdown 格式&#10;&#10;## 小标题&#10;**粗体** *斜体*&#10;- 列表项"
            ></textarea>
          </div>

          <div class="form-group">
            <label class="form-label">
              <i class="fa-solid fa-shield-halved"></i> 隐私设置
            </label>
            <div class="privacy-toggle">
              <button
                class="privacy-btn"
                :class="{ 'privacy-btn--active': form.privacy_level === 0 }"
                @click="form.privacy_level = 0"
              >
                <i class="fa-solid fa-earth-americas"></i> 公开
              </button>
              <button
                class="privacy-btn"
                :class="{ 'privacy-btn--active': form.privacy_level === 1 }"
                @click="form.privacy_level = 1"
              >
                <i class="fa-solid fa-lock"></i> 仅自己
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部按钮 -->
      <div class="add-page__actions">
        <button v-if="currentStep > 1" class="btn btn--ghost" @click="prevStep">
          <i class="fa-solid fa-arrow-left"></i> 上一步
        </button>
        <div class="spacer"></div>
        <button v-if="currentStep < totalSteps" class="btn btn--primary" @click="nextStep">
          下一步 <i class="fa-solid fa-arrow-right"></i>
        </button>
        <button v-else class="btn btn--submit" :disabled="submitting" @click="handleSubmit">
          <i v-if="submitting" class="fa-solid fa-spinner fa-spin"></i>
          <i v-else class="fa-solid fa-check"></i>
          {{ submitting ? '保存中...' : '镌刻记忆' }}
        </button>
      </div>
    </main>
  </div>
</template>

<style scoped>
.add-page {
  min-height: 100vh;
  background: var(--color-bg);
  padding-top: 64px;
}

.add-page__main {
  max-width: 720px;
  margin: 0 auto;
  padding: var(--space-5);
}

/* ====== 步骤指示器 ====== */
.steps-indicator {
  display: flex;
  justify-content: space-between;
  position: relative;
  margin-bottom: var(--space-6);
  padding: 0 var(--space-4);
}

.steps-line {
  position: absolute;
  top: 20px;
  left: 10%;
  right: 10%;
  height: 2px;
  background: var(--color-border);
  z-index: 0;
}

.steps-line__fill {
  height: 100%;
  background: var(--color-accent);
  transition: width var(--duration-normal) var(--ease-out);
}

.step-dot {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  z-index: 1;
}

.step-dot__circle {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-round);
  background: #fff;
  border: 2px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: var(--color-text-muted);
  transition: all var(--duration-normal) var(--ease-out);
}

.step-dot--active .step-dot__circle {
  border-color: var(--color-accent);
  background: var(--color-accent);
  color: #fff;
  box-shadow: 0 4px 16px rgba(200, 169, 110, 0.35);
}

.step-dot--done .step-dot__circle {
  border-color: var(--color-success);
  background: var(--color-success);
  color: #fff;
}

.step-dot__label {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  white-space: nowrap;
}

.step-dot--active .step-dot__label { color: var(--color-accent); font-weight: 600; }
.step-dot--done .step-dot__label { color: var(--color-success); }

/* ====== 卡片 ====== */
.add-page__card {
  padding: var(--space-6);
  margin-bottom: var(--space-5);
}

.step-content__title {
  font: var(--text-h2);
  margin-bottom: var(--space-1);
}

.step-content__desc {
  margin-bottom: var(--space-5);
  font-size: var(--text-sm);
}

/* ====== 表单 ====== */
.form-group { margin-bottom: var(--space-4); }
.form-group--half { flex: 1; }

.form-label {
  display: block;
  margin-bottom: var(--space-1);
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-text-secondary);
}
.form-label i { color: var(--color-accent); margin-right: var(--space-1); }

.form-input {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  border: var(--border-width) solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: var(--text-body);
  background: #fff;
  transition: border-color var(--duration-fast);
}
.form-input:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px rgba(200, 169, 110, 0.12);
}

.form-textarea {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  border: var(--border-width) solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: var(--text-body);
  background: #fff;
  resize: vertical;
  font-family: var(--font-sans);
  line-height: 1.6;
}
.form-textarea:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px rgba(200, 169, 110, 0.12);
}

.form-row {
  display: flex;
  gap: var(--space-4);
}

/* ====== 天气选择 ====== */
.weather-select {
  display: flex;
  gap: var(--space-1);
}

.weather-btn {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-round);
  border: 2px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: var(--color-text-muted);
  transition: all var(--duration-fast);
}
.weather-btn:hover { border-color: var(--color-accent); color: var(--color-accent); }
.weather-btn--active {
  background: var(--color-accent);
  border-color: var(--color-accent);
  color: #fff;
}

/* ====== 隐私开关 ====== */
.privacy-toggle {
  display: flex;
  gap: var(--space-2);
}

.privacy-btn {
  flex: 1;
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-pill);
  border: 2px solid var(--color-border);
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  transition: all var(--duration-fast);
}
.privacy-btn:hover { border-color: var(--color-primary-light); }
.privacy-btn--active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: #fff;
}
.privacy-btn--active:nth-child(2) {
  background: var(--color-danger);
  border-color: var(--color-danger);
}

/* ====== 上传区域 ====== */
.upload-zone {
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-7);
  text-align: center;
  cursor: pointer;
  transition: all var(--duration-fast);
  position: relative;
}
.upload-zone:hover,
.upload-zone--dragging {
  border-color: var(--color-accent);
  background: rgba(200, 169, 110, 0.06);
}

.upload-zone__input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.upload-zone__icon {
  font-size: 48px;
  color: var(--color-accent);
  margin-bottom: var(--space-3);
}

.upload-zone__text {
  font-size: var(--text-body);
  color: var(--color-text-secondary);
}

/* ====== 预览网格 ====== */
.preview-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-3);
  margin-top: var(--space-4);
}

.preview-grid__item {
  position: relative;
  aspect-ratio: 1;
  border-radius: var(--radius-sm);
  overflow: hidden;
}
.preview-grid__item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-grid__remove {
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
  font-size: 11px;
  opacity: 0;
  transition: opacity var(--duration-fast);
}
.preview-grid__item:hover .preview-grid__remove { opacity: 1; }

.preview-grid__badge {
  position: absolute;
  bottom: 4px;
  left: 4px;
  padding: 1px 6px;
  border-radius: var(--radius-pill);
  background: rgba(0,0,0,0.6);
  color: #fff;
  font-size: 11px;
}

/* ====== 按钮 ====== */
.add-page__actions {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.spacer { flex: 1; }

.btn {
  padding: var(--space-3) var(--space-5);
  border-radius: var(--radius-pill);
  font-weight: 600;
  font-size: var(--text-btn);
  display: flex;
  align-items: center;
  gap: var(--space-2);
  transition: all var(--duration-fast);
}

.btn--ghost {
  background: transparent;
  border: 2px solid var(--color-border);
  color: var(--color-text-secondary);
}
.btn--ghost:hover { border-color: var(--color-primary-light); }

.btn--primary {
  background: var(--color-primary);
  color: #fff;
}
.btn--primary:hover { background: var(--color-primary-light); }

.btn--submit {
  background: linear-gradient(135deg, var(--color-accent), #a88b4e);
  color: #fff;
  box-shadow: 0 6px 20px rgba(200, 169, 110, 0.3);
}
.btn--submit:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(200, 169, 110, 0.45); }
.btn--submit:disabled { opacity: 0.6; cursor: not-allowed; }

@media (max-width: 768px) {
  .form-row { flex-direction: column; }
  .preview-grid { grid-template-columns: repeat(2, 1fr); }
  .add-page__card { padding: var(--space-4); }
}
</style>
