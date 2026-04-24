import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'

export const dynamic = 'force-dynamic'

function isAuthorized(request: NextRequest): boolean {
  const adminToken = process.env.ADMIN_TOKEN
  if (!adminToken) return false
  const authHeader = request.headers.get('Authorization')
  const token = authHeader?.replace('Bearer ', '')
  return token === adminToken
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) {
    return NextResponse.json({ error: '未收到文件' }, { status: 400 })
  }

  const ext = file.name.split('.').pop()?.toLowerCase()
  if (!ext) {
    return NextResponse.json({ error: '无法识别文件扩展名' }, { status: 400 })
  }
  const allowedExts = ['jpg', 'jpeg', 'png', 'webp', 'gif']
  if (!allowedExts.includes(ext)) {
    return NextResponse.json({ error: '不支持的文件类型' }, { status: 400 })
  }

  const filename = `${randomUUID()}.${ext}`
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'ads')
  await mkdir(uploadDir, { recursive: true })

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  await writeFile(path.join(uploadDir, filename), buffer)

  return NextResponse.json({ url: `/uploads/ads/${filename}` }, { status: 201 })
}
