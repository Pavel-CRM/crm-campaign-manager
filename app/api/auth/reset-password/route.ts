import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { parseUserId, verifyResetToken } from '@/lib/reset-token'

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json()

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Ссылка недействительна' }, { status: 400 })
    }
    if (!password || String(password).length < 6) {
      return NextResponse.json(
        { error: 'Пароль должен быть не короче 6 символов' },
        { status: 400 }
      )
    }

    const uid = parseUserId(token)
    if (!uid) {
      return NextResponse.json({ error: 'Ссылка недействительна' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id: uid } })
    if (!user || !verifyResetToken(token, user.password)) {
      return NextResponse.json(
        { error: 'Ссылка недействительна или устарела. Запросите сброс заново.' },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(String(password), 10)
    await prisma.user.update({
      where: { id: uid },
      data: { password: hashedPassword },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('reset-password error:', error)
    return NextResponse.json({ error: 'Ошибка при сбросе пароля' }, { status: 500 })
  }
}
