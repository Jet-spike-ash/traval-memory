/* AI 辅助生成：DeepSeek V4 + Claude */
/**
 * json-server JWT 鉴权中间件 (CommonJS)
 *
 * 功能：
 *   POST /register — 注册新用户，返回 JWT
 *   POST /login    — 登录验证，返回 JWT
 *   其他请求        — 验证 Authorization: Bearer <token>
 *
 * 运行方式：
 *   json-server server/db.json --middlewares ./server/auth.cjs --port 3000
 */

const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const { readFileSync, writeFileSync } = require('fs')
const { join } = require('path')

const DB_PATH = join(__dirname, 'db.json')
const JWT_SECRET = 'memento-traces-secret-key-2025'
const JWT_EXPIRES_IN = '7d'

// ---------- 工具函数 ----------

/** 读取数据库 */
function readDB() {
  const raw = readFileSync(DB_PATH, 'utf-8')
  return JSON.parse(raw)
}

/** 写回数据库 */
function writeDB(data) {
  writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8')
}

/** 生成 JWT */
function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

/** 提取并校验 Token，返回用户信息或 null */
function verifyRequest(req) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null
  const token = authHeader.split(' ')[1]
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch {
    return null
  }
}

// ---------- 中间件入口 ----------

module.exports = function authMiddleware(req, res, next) {
  try {
  // ---- 注册 ----
  if (req.method === 'POST' && req.path === '/register') {
    const { email, password, username } = req.body || {}
    if (!email || !password || !username) {
      return res.status(400).json({ message: '邮箱、密码和用户名不能为空' })
    }

    const db = readDB()
    const exists = db.users.find((u) => u.email === email)
    if (exists) {
      return res.status(409).json({ message: '该邮箱已被注册' })
    }

    const hashedPassword = bcrypt.hashSync(password, 10)
    const newUser = {
      id: db.users.length > 0 ? Math.max(...db.users.map((u) => u.id)) + 1 : 1,
      email,
      password: hashedPassword,
      username,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(username)}`,
      home_lat: 39.9042,
      home_lng: 116.4074,
    }

    db.users.push(newUser)
    writeDB(db)

    const { password: _, ...userWithoutPassword } = newUser
    const token = signToken({ id: newUser.id, email: newUser.email })
    return res.status(201).json({ access_token: token, user: userWithoutPassword })
  }

  // ---- 登录 ----
  if (req.method === 'POST' && req.path === '/login') {
    const { email, password } = req.body || {}
    if (!email || !password) {
      return res.status(400).json({ message: '邮箱和密码不能为空' })
    }

    const db = readDB()
    const user = db.users.find((u) => u.email === email)
    if (!user) {
      return res.status(401).json({ message: '邮箱或密码错误' })
    }

    // 兼容明文密码（种子数据）和 bcrypt 哈希
    let passwordValid = false
    if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
      passwordValid = bcrypt.compareSync(password, user.password)
    } else {
      // 明文比对（开发阶段种子数据）
      passwordValid = password === user.password
    }

    if (!passwordValid) {
      return res.status(401).json({ message: '邮箱或密码错误' })
    }

    const { password: _, ...userWithoutPassword } = user
    const token = signToken({ id: user.id, email: user.email })
    return res.status(200).json({ access_token: token, user: userWithoutPassword })
  }

  // ---- 其他请求：JWT 鉴权 ----
  // 跳过 json-server 自身的 GET 请求（公开读取）
  if (req.method === 'GET') {
    return next()
  }

  // 写操作需要鉴权
  const decoded = verifyRequest(req)
  if (!decoded) {
    return res.status(401).json({ message: '未登录或 Token 已过期，请重新登录' })
  }

  // 将用户信息挂载到请求上，供后续使用
  req.user = decoded
  next()
  } catch (err) {
    console.error('[auth middleware] 内部错误:', err.message)
    return res.status(500).json({ message: '服务器内部错误，请稍后重试' })
  }
}
