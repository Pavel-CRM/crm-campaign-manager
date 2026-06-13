import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createPayment, PLANS } from '@/lib/yookassa'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const { plan } = await req.json()
    if (!plan || !['monthly', 'annual'].includes(plan)) {
      return NextResponse.json({ error: 'Неверный тариф' }, { status: 400 })
    }

    const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const returnUrl = `${appUrl}/subscribe/success?plan=${plan}`

    const payment = await createPayment({
      userId: session.user.id,
      plan: plan as 'monthly' | 'annual',
      returnUrl,
    })

    // Save pending payment
    await prisma.payment.create({
      data: {
        userId: session.user.id,
        ykPaymentId: payment.id,
        amount: PLANS[plan as 'monthly' | 'annual'].amount,
        plan,
        status: 'pending',
      },
    })

    return NextResponse.json({
      paymentId: payment.id,
      confirmationUrl: payment.confirmation.confirmation_url,
    })
  } catch (error) {
    console.error('Payment create error:', error)
    return NextResponse.json({ error: 'Ошибка создания платежа' }, { status: 500 })
  }
}
