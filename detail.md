# 角色设定
请你扮演一名资深**全栈前端架构师**，精通 Vue3 组合式 API、Pinia 状态管理、Vue Router 4、Leaflet/高德地图集成、ECharts 数据可视化以及 Node.js + json-server 后端模拟。你的代码风格必须遵循 **企业级工程化标准**，结构清晰，注释完整，并具备良好的错误处理与可维护性。

---

# 项目概述
我要开发一个名为 **「Memento·迹」（时空旅人 · 交互式记忆博物馆）** 的 Vue3 单页应用，用于课程设计答辩。这是一个以**地理位置 + 时间线**双维度驱动的个人旅行/生活记忆记录平台。

**核心创意亮点**：
- 在地图上标记记忆光晕，点击查看详情。
- 纵向时间轴滑动回溯历史。
- 记忆盲盒随机抽取。
- 时空对比（同月不同年）。
- 框选区域批量设置隐私。

---

# 一、技术栈硬性约束（必须严格遵守）
| 类别 | 技术选型 |
| :--- | :--- |
| 前端框架 | Vue 3.4+ (Composition API，强制使用 `<script setup>` 语法) |
| 构建工具 | Vite 5 |
| 路由管理 | Vue Router 4 (使用 `createWebHashHistory`) |
| 状态管理 | Pinia (需配合 `pinia-plugin-persistedstate` 做本地持久化) |
| 地图引擎 | `vue-leaflet` + `leaflet` (使用 OpenStreetMap 瓦片) |
| 图表库 | `echarts` + `vue-echarts` |
| HTTP 请求 | `axios` (统一拦截器处理 Token 与错误) |
| 后端模拟 | `json-server` (端口 3000) + `json-server-auth` (模拟 JWT 鉴权) |
| 日期处理 | `dayjs` |
| 图片处理 | 原生 `FileReader` + Canvas 压缩 (无需额外第三方库) |
| UI 图标 | `@fortawesome/fontawesome-free` (使用 Font Awesome 6 复古图标) |
| CSS 预处理 | 原生 CSS (使用 `:root` 自定义属性，即 Design Tokens) |

---

# 二、全局设计规范 (Design Tokens)
请将以下 CSS 变量直接放入 `src/styles/variables.css`，并在 `main.js` 中全局导入。

[在此处粘贴我上一轮给你的完整 `:root` CSS 代码块，从 `--color-primary` 到 `--z-toast` 的全部内容]:
/* ============================================
   Memento·迹 设计规范 — CSS Design Tokens
   直接复制至 styles/variables.css 或 :root
   ============================================ */

:root {
  /* ---------- 颜色 ---------- */
  --color-primary: #1E3A4D;
  --color-primary-light: #3A5F78;
  --color-primary-dark: #0F2533;
  --color-bg: #F7F2E9;
  --color-accent: #C8A96E;
  --color-accent-light: #E8D5B5;

  --color-success: #5B8C5A;
  --color-warning: #D9A05B;
  --color-danger: #B55A5A;
  --color-info: #5A7D9A;

  --color-text-primary: #2C2C2C;
  --color-text-secondary: #5A4F44;
  --color-text-muted: #8C7C6B;
  --color-border: #E5DDD2;
  --color-glass: rgba(247, 242, 233, 0.6);
  --color-overlay: rgba(15, 37, 51, 0.55);

  /* ---------- 字体 ---------- */
  --font-serif: 'Playfair Display', Georgia, serif;
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-mono: 'JetBrains Mono', 'Courier New', monospace;

  --text-display: 48px / 1.2 'Playfair Display', Georgia, serif;
  --text-h1: 32px / 1.3 'Playfair Display', Georgia, serif;
  --text-h2: 24px / 1.4 'Playfair Display', Georgia, serif;
  --text-h3: 20px / 1.5 'Playfair Display', Georgia, serif;
  --text-body-lg: 18px / 1.6 'Inter', sans-serif;
  --text-body: 16px / 1.6 'Inter', sans-serif;
  --text-sm: 14px / 1.5 'Inter', sans-serif;
  --text-xs: 13px / 1.4 'Inter', sans-serif;
  --text-btn: 15px / 1 'Inter', sans-serif;

  /* ---------- 间距 ---------- */
  --space-0: 0;
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-7: 48px;
  --space-8: 64px;
  --container-max: 1200px;

  /* ---------- 圆角 & 边框 ---------- */
  --radius-none: 0;
  --radius-sm: 6px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-pill: 24px;
  --radius-round: 50%;
  --border-width: 1px;
  --border-width-thick: 2px;

  /* ---------- 阴影 ---------- */
  --shadow-none: none;
  --shadow-sm: 0 4px 20px rgba(30, 58, 77, 0.08);
  --shadow-md: 0 8px 32px rgba(30, 58, 77, 0.12);
  --shadow-lg: 0 16px 48px rgba(15, 37, 51, 0.20);
  --shadow-inner: inset 0 2px 4px rgba(15, 37, 51, 0.06);

  /* ---------- 动画 ---------- */
  --duration-fast: 150ms;
  --duration-normal: 300ms;
  --duration-slow: 600ms;
  --ease-out: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-in: cubic-bezier(0.5, 0, 0.84, 0.25);

  /* ---------- 断点 ---------- */
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;

  /* ---------- Z-index ---------- */
  --z-base: 0;
  --z-map: 10;
  --z-popup: 100;
  --z-fixed: 200;
  --z-dropdown: 300;
  --z-overlay: 400;
  --z-modal: 500;
  --z-toast: 1000;
}

**字体加载**：请在 `index.html` 中通过 Google Fonts 引入 `Playfair Display` 和 `Inter` 字体。

---

# 三、后端 API 接口模拟 (json-server)
项目根目录下需创建 `server/db.json` 和 `server/server.js`。

**`db.json` 数据结构**：
```json
{
  "users": [
    {
      "id": 1,
      "email": "traveler@test.com",
      "password": "$2a$10$...", 
      "username": "时光旅人",
      "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=1",
      "home_lat": 39.9042,
      "home_lng": 116.4074
    }
  ],
  "memories": [
    {
      "id": 1,
      "user_id": 1,
      "title": "冰岛极光下的独白",
      "story": "我在雷克雅未克郊外等待了三个小时...",
      "lat": 64.1466,
      "lng": -21.9426,
      "location_name": "冰岛·辛格韦德利国家公园",
      "happened_date": "2025-12-01",
      "weather_type": "snow", 
      "images": ["https://picsum.photos/seed/1/800/600", "https://picsum.photos/seed/2/800/600"],
      "privacy_level": 0,
      "created_at": "2025-12-05T10:00:00Z"
    }
  ],
  "wishlist": [
    {
      "id": 1,
      "user_id": 1,
      "location_name": "西藏·冈仁波齐",
      "lat": 31.0667,
      "lng": 81.3125,
      "note": "转山朝圣",
      "is_achieved": false,
      "achieved_memory_id": null,
      "priority": 1
    }
  ],
  "companions": [
    {
      "id": 1,
      "user_id": 1,
      "companion_id": 2,
      "memory_id": 1,
      "permission": "read"
    }
  ]
}