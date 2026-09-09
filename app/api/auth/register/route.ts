import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { email: rawEmail, password, name } = await req.json()

    if (!rawEmail || !password) {
      return NextResponse.json(
        { error: 'Email и пароль обязательны' },
        { status: 400 }
      )
    }

    // Храним email в нижнем регистре — иначе вход и восстановление пароля
    // ломаются из-за регистрозависимого сравнения в Postgres.
    const email = String(rawEmail).trim().toLowerCase()

    const existingUser = await prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
    })
    if (existingUser) {
      return NextResponse.json(
        { error: 'Пользователь с таким email уже существует' },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    // Trial: 10 days from now
    const trialEndsAt = new Date()
    trialEndsAt.setDate(trialEndsAt.getDate() + 10)

    // Admin + lifetime for ADMIN_EMAIL
    const adminEmail = process.env.ADMIN_EMAIL
    const isAdminUser = adminEmail && email === adminEmail.trim().toLowerCase()

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        trialEndsAt: isAdminUser ? null : trialEndsAt,
        subscriptionStatus: isAdminUser ? 'lifetime' : 'trial',
        subscriptionPlan: isAdminUser ? 'lifetime' : null,
        isAdmin: !!isAdminUser,
      },
    })

    const org = await prisma.organization.create({
      data: {
        name: name ? `Компания ${name}` : 'Моя компания',
        userId: user.id,
      },
    })

    await prisma.orgSettings.create({
      data: {
        orgId: org.id,
        channels: JSON.stringify(['email', 'sms', 'push', 'messenger']),
      },
    })

    return NextResponse.json({ success: true, userId: user.id })
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json({ error: 'Ошибка при регистрации' }, { status: 500 })
  }
}
