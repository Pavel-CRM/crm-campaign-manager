import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { PLANS } from '@/lib/yookassa'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { event, object } = body

    if (!object?.metadata?.userId || !object?.metadata?.plan) {
      return NextResponse.json({ ok: true })
    }

    const { userId, plan } = object.metadata
    const ykPaymentId = object.id

    if (event === 'payment.succeeded') {
      const planInfo = PLANS[plan as 'monthly' | 'annual']
      const now = new Date()
      const periodEnd = new Date(now)
      periodEnd.setDate(periodEnd.getDate() + planInfo.durationDays)

      // Save payment method for recurring
      const paymentMethodId = object.payment_method?.saved
        ? object.payment_method?.id
        : null

      // Update user subscription
      await prisma.user.update({
        where: { id: userId },
        data: {
          subscriptionStatus: 'active',
          subscriptionPlan: plan,
          subscriptionEndsAt: periodEnd,
          ykPaymentMethodId: paymentMethodId ?? undefined,
        },
      })

      // Update payment record
      await prisma.payment.upsert({
        where: { ykPaymentId },
        create: {
          userId,
          ykPaymentId,
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
    }

    if (event === 'payment.canceled') {
      await prisma.payment.updateMany({
        where: { ykPaymentId },
        data: { status: 'cancelled' },
      })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 })
  }
}
