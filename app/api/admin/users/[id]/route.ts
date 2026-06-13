import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 })
  }

  const body = await req.json()
  const {
    subscriptionStatus,
    subscriptionPlan,
    subscriptionEndsAt,
    trialEndsAt,
    isAdmin,
  } = body

  const data: Record<string, unknown> = {}

  if (subscriptionStatus !== undefined) data.subscriptionStatus = subscriptionStatus
  if (subscriptionPlan !== undefined) data.subscriptionPlan = subscriptionPlan
  if (subscriptionEndsAt !== undefined)
    data.subscriptionEndsAt = subscriptionEndsAt ? new Date(subscriptionEndsAt) : null
  if (trialEndsAt !== undefined)
    data.trialEndsAt = trialEndsAt ? new Date(trialEndsAt) : null
  if (isAdmin !== undefined) data.isAdmin = isAdmin

  // Lifetime — clear end dates
  if (subscriptionStatus === 'lifetime') {
    data.subscriptionEndsAt = null
    data.subscriptionPlan = 'lifetime'
  }

  const user = await prisma.user.update({
    where: { id: params.id },
    data,
    select: {
      id: true,
      email: true,
      name: true,
      subscriptionStatus: true,
      subscriptionPlan: true,
      subscriptionEndsAt: true,
      trialEndsAt: true,
      isAdmin: true,
    },
  })

  return NextResponse.json(user)
}
