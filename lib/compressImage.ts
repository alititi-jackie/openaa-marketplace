export interface CompressImageOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  outputType?: string
}

export class CompressImageError extends Error {
  code: 'UNSUPPORTED_FORMAT' | 'DECODE_FAILED' | 'COMPRESS_FAILED'

  constructor(code: 'UNSUPPORTED_FORMAT' | 'DECODE_FAILED' | 'COMPRESS_FAILED', message: string) {
    super(message)
    this.name = 'CompressImageError'
    this.code = code
  }
}

const SUPPORTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

const DEFAULT_OPTIONS: Required<CompressImageOptions> = {
  maxWidth: 1200,
  maxHeight: 1200,
  quality: 0.8,
  outputType: 'image/jpeg',
}

function toJpgFileName(fileName: string) {
  const index = fileName.lastIndexOf('.')
  const baseName = index > 0 ? fileName.slice(0, index) : fileName
  return `${baseName || 'image'}.jpg`
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new CompressImageError('DECODE_FAILED', '图片解码失败'))
    }
    image.src = objectUrl
  })
}

export async function compressImageFile(file: File, options: CompressImageOptions = {}): Promise<File> {
  const merged = { ...DEFAULT_OPTIONS, ...options }
  if (!SUPPORTED_IMAGE_TYPES.has((file.type || '').toLowerCase())) {
    throw new CompressImageError('UNSUPPORTED_FORMAT', '不支持的图片格式')
  }

  const image = await loadImageFromFile(file)
  const ratio = Math.min(merged.maxWidth / image.width, merged.maxHeight / image.height, 1)
  const width = Math.max(1, Math.round(image.width * ratio))
  const height = Math.max(1, Math.round(image.height * ratio))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new CompressImageError('COMPRESS_FAILED', '图片处理失败')
  }
  ctx.drawImage(image, 0, 0, width, height)

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) resolve(result)
        else reject(new CompressImageError('COMPRESS_FAILED', '图片压缩失败'))
      },
      merged.outputType,
      merged.quality
    )
  })

  return new File([blob], toJpgFileName(file.name), {
    type: merged.outputType,
    lastModified: Date.now(),
  })
}

export function getCompressImageErrorMessage(error: unknown) {
  if (error instanceof CompressImageError) {
    if (error.code === 'UNSUPPORTED_FORMAT' || error.code === 'DECODE_FAILED') {
      return '此图片格式暂不支持，请换成 JPG/PNG 图片或截图后再上传。'
    }
  }
  return '图片处理失败，请换一张图片或截图后再上传。'
}
