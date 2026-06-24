<!-- AI 辅助生成：DeepSeek V4 + Claude -->
<script setup>
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/userStore'
import { useUiStore } from '@/stores/uiStore'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const uiStore = useUiStore()

// ---- 表单状态 ----
const isLogin = ref(true)
const submitting = ref(false)

const form = reactive({
  email: 'traveler@test.com',
  password: '123456',
  username: '',
  confirmPassword: '',
})

const errors = reactive({
  email: '',
  password: '',
  username: '',
  confirmPassword: '',
})

// ---- 表单校验 ----
function validate() {
  let valid = true
  // 重置错误
  Object.keys(errors).forEach((k) => (errors[k] = ''))

  if (!form.email.trim()) {
    errors.email = '请输入邮箱'
    valid = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = '邮箱格式不正确'
    valid = false
  }

  if (!form.password) {
    errors.password = '请输入密码'
    valid = false
  } else if (form.password.length < 6) {
    errors.password = '密码至少 6 位'
    valid = false
  }

  if (!isLogin.value) {
    if (!form.username.trim()) {
      errors.username = '请输入用户名'
      valid = false
    }
    if (form.password !== form.confirmPassword) {
      errors.confirmPassword = '两次密码不一致'
      valid = false
    }
  }

  return valid
}

// ---- 提交 ----
async function handleSubmit() {
  if (!validate() || submitting.value) return
  submitting.value = true

  try {
    if (isLogin.value) {
      await userStore.login(form.email, form.password)
      uiStore.showToast('欢迎回来，时光旅人 ☕', 'success')
    } else {
      await userStore.register(form.email, form.password, form.username)
      uiStore.showToast('注册成功，旅程开始 ✨', 'success')
    }

    // 跳转到目标页或首页
    const redirect = route.query.redirect || '/home'
    router.push(redirect)
  } catch (err) {
    const msg = err?.response?.data?.message || (isLogin.value ? '登录失败' : '注册失败')
    uiStore.showToast(msg, 'error')
  } finally {
    submitting.value = false
  }
}

// ---- 切换登录/注册 ----
function toggleMode() {
  isLogin.value = !isLogin.value
  Object.keys(errors).forEach((k) => (errors[k] = ''))
}

// ============================================================
//  3D 旋转地球 (Three.js)
// ============================================================
let animationId = null
let earthMesh = null
let scene = null
let camera = null
let renderer = null
let starsGroup = null

const canvasContainer = ref(null)

function initEarth() {
  if (!canvasContainer.value || typeof THREE === 'undefined') return

  const container = canvasContainer.value
  const { width, height } = container.getBoundingClientRect()

  // 场景
  scene = new THREE.Scene()

  // 相机
  camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100)
  camera.position.z = 3.2

  // 渲染器
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setSize(width, height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  container.appendChild(renderer.domElement)

  // 地球纹理
  const textureLoader = new THREE.TextureLoader()
  const earthTexture = textureLoader.load(
    'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg'
  )

  // 地球
  const geometry = new THREE.SphereGeometry(1, 64, 64)
  const material = new THREE.MeshPhongMaterial({
    map: earthTexture,
    shininess: 5,
    specular: new THREE.Color(0x111111),
  })
  earthMesh = new THREE.Mesh(geometry, material)
  scene.add(earthMesh)

  // 大气光晕
  const glowGeometry = new THREE.SphereGeometry(1.02, 64, 64)
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0x3A5F78,
    transparent: true,
    opacity: 0.08,
  })
  const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial)
  scene.add(glowMesh)

  // 光照
  const ambientLight = new THREE.AmbientLight(0x404060, 0.6)
  scene.add(ambientLight)
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2)
  directionalLight.position.set(5, 3, 5)
  scene.add(directionalLight)

  // 星空背景
  starsGroup = new THREE.Group()
  const starGeometry = new THREE.BufferGeometry()
  const starCount = 800
  const positions = new Float32Array(starCount * 3)
  for (let i = 0; i < starCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 20
    positions[i * 3 + 1] = (Math.random() - 0.5) * 12
    positions[i * 3 + 2] = (Math.random() - 0.5) * 8 - 2
  }
  starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  const starMaterial = new THREE.PointsMaterial({
    color: 0xC8A96E,
    size: 0.02,
    transparent: true,
    opacity: 0.7,
  })
  starsGroup = new THREE.Points(starGeometry, starMaterial)
  scene.add(starsGroup)

  // 动画循环
  function animate() {
    animationId = requestAnimationFrame(animate)
    earthMesh.rotation.y += 0.0015
    glowMesh.rotation.y += 0.0015
    starsGroup.rotation.y += 0.0002
    starsGroup.rotation.x += 0.0001
    renderer.render(scene, camera)
  }
  animate()
}

function destroyEarth() {
  if (animationId) cancelAnimationFrame(animationId)
  if (renderer) {
    renderer.dispose()
    if (canvasContainer.value) {
      const canvas = canvasContainer.value.querySelector('canvas')
      if (canvas) canvas.remove()
    }
  }
  if (scene) {
    scene.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose()
      if (obj.material) {
        if (obj.material.map) obj.material.map.dispose()
        obj.material.dispose()
      }
    })
    scene = null
  }
  earthMesh = null
  starsGroup = null
}

function onResize() {
  if (!canvasContainer.value || !renderer) return
  const { width, height } = canvasContainer.value.getBoundingClientRect()
  renderer.setSize(width, height)
  camera.aspect = width / height
  camera.updateProjectionMatrix()
}

onMounted(() => {
  // 延迟初始化确保 Three.js CDN 已加载
  setTimeout(initEarth, 200)
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  destroyEarth()
  window.removeEventListener('resize', onResize)
})
</script>

<template>
  <div class="login-page">
    <!-- 3D 地球背景 -->
    <div ref="canvasContainer" class="login-page__globe"></div>

    <!-- 渐变遮罩 -->
    <div class="login-page__overlay"></div>

    <!-- 装饰粒子（纯 CSS） -->
    <div class="login-page__particles">
      <span v-for="n in 20" :key="n" class="particle" :style="{
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 8}s`,
        animationDuration: `${6 + Math.random() * 8}s`,
      }"></span>
    </div>

    <!-- 表单卡片 -->
    <div class="login-page__card glass">
      <!-- Logo -->
      <div class="login-card__header">
        <div class="login-card__logo">
          <i class="fa-solid fa-hourglass-half"></i>
        </div>
        <h1 class="login-card__title">Memento·迹</h1>
        <p class="login-card__subtitle text-muted">时空旅人 · 交互式记忆博物馆</p>
      </div>

      <!-- 切换 Tab -->
      <div class="login-card__tabs">
        <button
          class="tab-btn"
          :class="{ 'tab-btn--active': isLogin }"
          @click="toggleMode"
        >
          登录
        </button>
        <button
          class="tab-btn"
          :class="{ 'tab-btn--active': !isLogin }"
          @click="toggleMode"
        >
          注册
        </button>
      </div>

      <!-- 表单 -->
      <form class="login-card__form" @submit.prevent="handleSubmit">
        <!-- 邮箱 -->
        <div class="form-group" :class="{ 'form-group--error': errors.email }">
          <label class="form-label">
            <i class="fa-solid fa-envelope"></i> 邮箱
          </label>
          <input
            v-model="form.email"
            type="email"
            class="form-input"
            placeholder="your@email.com"
            autocomplete="email"
          />
          <span v-if="errors.email" class="form-error">{{ errors.email }}</span>
        </div>

        <!-- 用户名（仅注册） -->
        <div
          v-if="!isLogin"
          class="form-group"
          :class="{ 'form-group--error': errors.username }"
        >
          <label class="form-label">
            <i class="fa-solid fa-user"></i> 用户名
          </label>
          <input
            v-model="form.username"
            type="text"
            class="form-input"
            placeholder="你的旅人名号"
            autocomplete="username"
          />
          <span v-if="errors.username" class="form-error">{{ errors.username }}</span>
        </div>

        <!-- 密码 -->
        <div class="form-group" :class="{ 'form-group--error': errors.password }">
          <label class="form-label">
            <i class="fa-solid fa-lock"></i> 密码
          </label>
          <input
            v-model="form.password"
            type="password"
            class="form-input"
            placeholder="至少 6 位密码"
            autocomplete="current-password"
          />
          <span v-if="errors.password" class="form-error">{{ errors.password }}</span>
        </div>

        <!-- 确认密码（仅注册） -->
        <div
          v-if="!isLogin"
          class="form-group"
          :class="{ 'form-group--error': errors.confirmPassword }"
        >
          <label class="form-label">
            <i class="fa-solid fa-check-double"></i> 确认密码
          </label>
          <input
            v-model="form.confirmPassword"
            type="password"
            class="form-input"
            placeholder="再次输入密码"
            autocomplete="new-password"
          />
          <span v-if="errors.confirmPassword" class="form-error">{{ errors.confirmPassword }}</span>
        </div>

        <!-- 提交按钮 -->
        <button
          type="submit"
          class="form-submit"
          :disabled="submitting"
        >
          <i v-if="submitting" class="fa-solid fa-spinner fa-spin"></i>
          <i v-else class="fa-solid" :class="isLogin ? 'fa-right-to-bracket' : 'fa-user-plus'"></i>
          {{ submitting ? '请稍候...' : (isLogin ? '开启旅程' : '注册启程') }}
        </button>
      </form>

      <!-- 底部提示 -->
      <p class="login-card__hint text-muted">
        💡 测试账号：traveler@test.com / 123456
      </p>
    </div>
  </div>
</template>

<style scoped>
/* ========== 整体布局 ========== */
.login-page {
  position: relative;
  width: 100%;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: radial-gradient(ellipse at 30% 50%, #1a2f3d 0%, #0d1a24 60%, #060f16 100%);
}

/* ========== 3D 地球容器 ========== */
.login-page__globe {
  position: absolute;
  right: -10%;
  top: 50%;
  transform: translateY(-50%);
  width: 55vw;
  max-width: 800px;
  height: 55vw;
  max-height: 800px;
  z-index: 1;
  pointer-events: none;
}

/* ========== 渐变遮罩 ========== */
.login-page__overlay {
  position: absolute;
  inset: 0;
  z-index: 2;
  background:
    linear-gradient(135deg, rgba(15, 37, 51, 0.92) 0%, rgba(15, 37, 51, 0.5) 55%, rgba(15, 37, 51, 0.3) 100%);
}

/* ========== 装饰粒子 ========== */
.login-page__particles {
  position: absolute;
  inset: 0;
  z-index: 3;
  pointer-events: none;
}

.particle {
  position: absolute;
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: var(--color-accent);
  animation: float-up linear infinite;
}

@keyframes float-up {
  0% {
    transform: translateY(0) scale(1);
    opacity: 0;
  }
  10% {
    opacity: 0.8;
  }
  90% {
    opacity: 0.2;
  }
  100% {
    transform: translateY(-100vh) scale(0.3);
    opacity: 0;
  }
}

/* ========== 卡片 ========== */
.login-page__card {
  position: relative;
  z-index: 10;
  width: 90%;
  max-width: 420px;
  padding: var(--space-6) var(--space-6);
  background: rgba(247, 242, 233, 0.12);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(200, 169, 110, 0.2);
  border-radius: var(--radius-lg);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
}

/* ========== Logo 区 ========== */
.login-card__header {
  text-align: center;
  margin-bottom: var(--space-5);
}

.login-card__logo {
  width: 64px;
  height: 64px;
  margin: 0 auto var(--space-3);
  border-radius: var(--radius-round);
  background: linear-gradient(135deg, var(--color-accent), #a88b4e);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: #fff;
  box-shadow: 0 8px 24px rgba(200, 169, 110, 0.35);
}

.login-card__title {
  font: var(--text-h1);
  color: var(--color-accent-light);
  margin-bottom: var(--space-1);
}

.login-card__subtitle {
  font-size: var(--text-sm);
  color: rgba(232, 213, 181, 0.7);
}

/* ========== 切换 Tab ========== */
.login-card__tabs {
  display: flex;
  gap: var(--space-2);
  margin-bottom: var(--space-5);
  padding: var(--space-1);
  background: rgba(255, 255, 255, 0.05);
  border-radius: var(--radius-pill);
}

.tab-btn {
  flex: 1;
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-pill);
  font-size: var(--text-sm);
  font-weight: 500;
  color: rgba(232, 213, 181, 0.6);
  transition: all var(--duration-normal) var(--ease-out);
}

.tab-btn--active {
  background: var(--color-accent);
  color: #fff;
  box-shadow: 0 4px 12px rgba(200, 169, 110, 0.3);
}

/* ========== 表单 ========== */
.form-group {
  margin-bottom: var(--space-4);
}

.form-label {
  display: block;
  margin-bottom: var(--space-1);
  font-size: var(--text-xs);
  font-weight: 500;
  color: rgba(232, 213, 181, 0.8);
  letter-spacing: 0.5px;
}

.form-label i {
  margin-right: var(--space-1);
  color: var(--color-accent);
}

.form-input {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(200, 169, 110, 0.2);
  border-radius: var(--radius-sm);
  color: #fff;
  font-size: var(--text-body);
  transition: all var(--duration-fast) var(--ease-out);
}

.form-input::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.form-input:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px rgba(200, 169, 110, 0.15);
  background: rgba(255, 255, 255, 0.12);
}

.form-group--error .form-input {
  border-color: var(--color-danger);
}

.form-error {
  display: block;
  margin-top: var(--space-1);
  font-size: var(--text-xs);
  color: var(--color-danger);
}

/* ========== 提交按钮 ========== */
.form-submit {
  width: 100%;
  padding: var(--space-3) var(--space-5);
  margin-top: var(--space-3);
  border-radius: var(--radius-pill);
  background: linear-gradient(135deg, var(--color-accent), #a88b4e);
  color: #fff;
  font: var(--text-btn);
  font-weight: 600;
  letter-spacing: 1px;
  box-shadow: 0 6px 20px rgba(200, 169, 110, 0.3);
  transition: all var(--duration-normal) var(--ease-out);
}

.form-submit:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 28px rgba(200, 169, 110, 0.45);
}

.form-submit:active:not(:disabled) {
  transform: translateY(0);
}

.form-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ========== 底部提示 ========== */
.login-card__hint {
  text-align: center;
  margin-top: var(--space-4);
  font-size: var(--text-xs);
  color: rgba(255, 255, 255, 0.4);
}

/* ========== 响应式 ========== */
@media (max-width: 768px) {
  .login-page__globe {
    right: -30%;
    width: 80vw;
    height: 80vw;
    top: 20%;
  }

  .login-page__card {
    max-width: 360px;
    padding: var(--space-5) var(--space-4);
  }
}
</style>
