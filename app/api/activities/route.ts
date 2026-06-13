import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function getOrg(userId: string) {
  return prisma.organization.findFirst({
    where: { userId },
  })
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const org = await getOrg(session.user.id)
  if (!org) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
  }

  const { searchParams } = new URL(req.url)
  const startDate = searchParams.get('start')
  const endDate = searchParams.get('end')

  const where: Record<string, unknown> = { orgId: org.id }
  if (startDate && endDate) {
    where.date = {
      gte: new Date(startDate),
      lte: new Date(endDate),
    }
  }

  const activities = await prisma.activity.findMany({
    where,
    orderBy: { date: 'asc' },
  })

  return NextResponse.json(activities)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const org = await getOrg(session.user.id)
  if (!org) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
  }

  const body = await req.json()
  const { title, date, channels, category, content } = body

  const activity = await prisma.activity.create({
    data: {
      orgId: org.id,
      title,
      date: new Date(date),
      channels: JSON.stringify(channels),
      category,
      content: JSON.stringify(content || {}),
      isGenerated: false,
    },
  })

  return NextResponse.json(activity)
}
