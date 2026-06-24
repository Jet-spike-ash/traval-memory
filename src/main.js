/* AI 辅助生成：DeepSeek V4 + Claude */
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

import App from './App.vue'
import router from './router'
import '@fortawesome/fontawesome-free/css/all.css'
import 'leaflet/dist/leaflet.css'
import '@/assets/styles/variables.css'
import '@/assets/styles/global.css'

const app = createApp(App)

// Pinia 状态管理 + 持久化插件
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

app.use(pinia)
app.use(router)
app.mount('#app')
