import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 })
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      trialEndsAt: true,
      subscriptionStatus: true,
      subscriptionPlan: true,
      subscriptionEndsAt: true,
      isAdmin: true,
      payments: {
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          plan: true,
          amount: true,
          status: true,
          periodStart: true,
          periodEnd: true,
          createdAt: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(users)
}
