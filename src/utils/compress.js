/* AI 辅助生成：DeepSeek V4 + Claude */
/**
 * 图片压缩工具
 * 使用 Canvas 将图片压缩至指定大小以内
 *
 * @param {File} file - 原始图片文件
 * @param {number} maxSizeKB - 最大文件大小 (KB)，默认 200KB
 * @param {number} maxWidth - 最大宽度 (px)，默认 1920
 * @returns {Promise<File>} 压缩后的图片文件
 */
export async function compressImage(file, maxSizeKB = 200, maxWidth = 1920) {
  return new Promise((resolve, reject) => {
    // 如果文件已经很小，直接返回
    if (file.size <= maxSizeKB * 1024) {
      return resolve(file)
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        // 计算缩放比例
        let width = img.width
        let height = img.height
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width)
          width = maxWidth
        }

        // 创建 Canvas
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)

        // 递归降低质量直到满足大小要求
        const compress = (quality) => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                return reject(new Error('图片压缩失败'))
              }
              if (blob.size <= maxSizeKB * 1024 || quality <= 0.1) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                })
                return resolve(compressedFile)
              }
              compress(quality - 0.1)
            },
            'image/jpeg',
            quality
          )
        }

        compress(0.8)
      }
      img.onerror = () => reject(new Error('图片加载失败'))
      img.src = e.target.result
    }
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsDataURL(file)
  })
}

/**
 * 将 File 转为 base64 Data URL（用于预览）
 */
export function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsDataURL(file)
  })
}
