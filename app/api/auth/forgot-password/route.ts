import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createResetToken } from '@/lib/reset-token'
import { sendPasswordResetEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    const typed = String(email || '').trim()
    const normalized = typed.toLowerCase()

    // Всегда отвечаем одинаково, чтобы нельзя было узнать, какие email
    // зарегистрированы в системе.
    if (typed) {
      const user =
        (await prisma.user.findUnique({ where: { email: typed } })) ||
        (normalized !== typed
          ? await prisma.user.findUnique({ where: { email: normalized } })
          : null)

      if (user) {
        const token = createResetToken(user.id, user.password)
        const base =
          process.env.NEXTAUTH_URL?.replace(/\/$/, '') || new URL(req.url).origin
        const resetUrl = `${base}/reset-password?token=${encodeURIComponent(token)}`
        await sendPasswordResetEmail(user.email, resetUrl)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('forgot-password error:', error)
    // Тоже общий ответ — не раскрываем детали.
    return NextResponse.json({ ok: true })
  }
}
