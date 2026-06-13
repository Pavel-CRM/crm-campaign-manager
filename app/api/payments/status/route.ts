import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getPayment, PLANS } from '@/lib/yookassa'

// Called from success page to confirm payment
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const { paymentId, plan } = await req.json()
    if (!paymentId) {
      return NextResponse.json({ error: 'paymentId required' }, { status: 400 })
    }

    const payment = await getPayment(paymentId)

    if (payment.status === 'succeeded') {
      const planInfo = PLANS[plan as 'monthly' | 'annual']
      const now = new Date()
      const periodEnd = new Date(now)
      periodEnd.setDate(periodEnd.getDate() + planInfo.durationDays)

      const paymentMethodId = payment.payment_method?.saved
        ? payment.payment_method?.id
        : null

      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          subscriptionStatus: 'active',
          subscriptionPlan: plan,
          subscriptionEndsAt: periodEnd,
          ykPaymentMethodId: paymentMethodId ?? undefined,
        },
      })

      await prisma.payment.upsert({
        where: { ykPaymentId: paymentId },
        create: {
          userId: session.user.id,
          ykPaymentId: paymentId,
          amount: planInfo.amount,
          plan,
          status: 'succeeded',
          periodStart: now,
          periodEnd,
        },
        update: {
          status: 'succeeded',
          periodStart: now,
          periodEnd,
        },
      })

      return NextResponse.json({ status: 'succeeded', periodEnd })
    }

    return NextResponse.json({ status: payment.status })
  } catch (error) {
    console.error('Payment status error:', error)
    return NextResponse.json({ error: 'Ошибка проверки платежа' }, { status: 500 })
  }
}
