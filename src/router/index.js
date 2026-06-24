/* AI 辅助生成：DeepSeek V4 + Claude */
import { createRouter, createWebHashHistory } from 'vue-router'

/**
 * 路由配置 — 共 16 个页面
 * 使用路由懒加载，按需引入页面组件
 */
const routes = [
  {
    path: '/',
    name: 'Login',
    component: () => import('@/views/LoginView.vue'),
    meta: { title: '启程·登录/注册', guest: true },
  },
  {
    path: '/home',
    name: 'Home',
    component: () => import('@/views/HomeView.vue'),
    meta: { title: '寰宇·总览大厅', requiresAuth: true },
  },
  {
    path: '/timeline',
    name: 'Timeline',
    component: () => import('@/views/TimelineView.vue'),
    meta: { title: '时光·纵向时间线', requiresAuth: true },
  },
  {
    path: '/memory/:id',
    name: 'MemoryDetail',
    component: () => import('@/views/MemoryDetailView.vue'),
    meta: { title: '定格·记忆详情', requiresAuth: true },
  },
  {
    path: '/memory/add',
    name: 'MemoryAdd',
    component: () => import('@/views/MemoryAddView.vue'),
    meta: { title: '镌刻·添加记忆', requiresAuth: true },
  },
  {
    path: '/stats',
    name: 'Stats',
    component: () => import('@/views/StatsView.vue'),
    meta: { title: '足迹·数据仪表盘', requiresAuth: true },
  },
  {
    path: '/blindbox',
    name: 'Blindbox',
    component: () => import('@/views/BlindboxView.vue'),
    meta: { title: '邂逅·记忆盲盒', requiresAuth: true },
  },
  {
    path: '/compare',
    name: 'Compare',
    component: () => import('@/views/CompareView.vue'),
    meta: { title: '叠影·时空对比', requiresAuth: true },
  },
  {
    path: '/wishlist',
    name: 'Wishlist',
    component: () => import('@/views/WishlistView.vue'),
    meta: { title: '远方·愿望清单', requiresAuth: true },
  },
  {
    path: '/companions',
    name: 'Companions',
    component: () => import('@/views/CompanionsView.vue'),
    meta: { title: '结伴·同行人', requiresAuth: true },
  },
  {
    path: '/postcard',
    name: 'Postcard',
    component: () => import('@/views/PostcardView.vue'),
    meta: { title: '手札·明信片工坊', requiresAuth: true },
  },
  {
    path: '/seasons',
    name: 'Seasons',
    component: () => import('@/views/SeasonsView.vue'),
    meta: { title: '四时·四季图鉴', requiresAuth: true },
  },
  {
    path: '/privacy',
    name: 'Privacy',
    component: () => import('@/views/PrivacyView.vue'),
    meta: { title: '秘匣·隐私地图', requiresAuth: true },
  },
  {
    path: '/retrospect',
    name: 'Retrospect',
    component: () => import('@/views/RetrospectView.vue'),
    meta: { title: '年轮·数据回溯', requiresAuth: true },
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/views/SettingsView.vue'),
    meta: { title: '行囊·设置与备份', requiresAuth: true },
  },
  {
    path: '/about',
    name: 'About',
    component: () => import('@/views/AboutView.vue'),
    meta: { title: '漂流广场', requiresAuth: true },
  },
  {
    path: '/traveler/:id',
    name: 'Traveler',
    component: () => import('@/views/TravelerView.vue'),
    meta: { title: '旅人主页', requiresAuth: true },
  },
  {
    path: '/story',
    name: 'Story',
    component: () => import('@/views/StoryView.vue'),
    meta: { title: '记忆漫游', requiresAuth: true },
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/ProfileView.vue'),
    meta: { title: '个人信息', requiresAuth: true },
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/views/SettingsView.vue'),
    meta: { title: '设置中心', requiresAuth: true },
  },
  {
    path: '/favorites',
    name: 'Favorites',
    component: () => import('@/views/FavoritesView.vue'),
    meta: { title: '收藏夹', requiresAuth: true },
  },

  // 404 兜底
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

/**
 * 全局前置守卫 — 鉴权拦截
 * 未登录用户访问需登录页面 → 重定向到 /
 */
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('access_token')
  const requiresAuth = to.meta.requiresAuth

  // 设置页面标题
  document.title = to.meta.title ? `${to.meta.title} | Memento·迹` : 'Memento·迹'

  if (requiresAuth && !token) {
    // 需要登录但未登录 → 跳转登录页
    next({ path: '/', query: { redirect: to.fullPath } })
  } else if (to.meta.guest && token) {
    // 已登录用户访问登录页 → 直接进入首页
    next({ path: '/home' })
  } else {
    next()
  }
})

export default router
