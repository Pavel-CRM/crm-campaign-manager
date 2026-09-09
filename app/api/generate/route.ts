import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateCommunicationPlan } from '@/lib/anthropic'

// Генерация через Claude занимает десятки секунд — поднимаем лимит
// выполнения функции, иначе Vercel обрывает соединение с браузером
// (по умолчанию 10-15 с) ещё до того, как план будет готов.
export const maxDuration = 60

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const org = await prisma.organization.findFirst({
    where: { userId: session.user.id },
    include: { settings: true, rules: true },
  })

  if (!org) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
  }

  const body = await req.json()
  const { keepApproved = false, startDate } = body

  const start = startDate ? new Date(startDate) : new Date()
  start.setHours(0, 0, 0, 0)

  // Get approved activity IDs to keep
  const approvedActivities = keepApproved
    ? await prisma.activity.findMany({
        where: { orgId: org.id, status: 'approved' },
        select: { id: true },
      })
    : []

  const approvedIds = approvedActivities.map((a) => a.id)

  // Delete non-approved activities in the date range
  const endDate = new Date(start)
  endDate.setDate(endDate.getDate() + 13)

  await prisma.activity.deleteMany({
    where: {
      orgId: org.id,
      date: { gte: start, lte: endDate },
      ...(keepApproved && approvedIds.length > 0
        ? { id: { notIn: approvedIds } }
        : {}),
    },
  })

  const settings = org.settings
  const settingsData = {
    description: settings?.description ?? '',
    services: settings?.services ?? '',
    products: settings?.products ?? '',
    newsletters: settings?.newsletters ?? '',
    categories: settings?.categories ?? '',
    channels: settings?.channels ?? '[]',
    businessFocus: settings?.businessFocus ?? '',
    topProducts: settings?.topProducts ?? '',
  }

  const rulesData = org.rules.map((r) => ({
    category: r.category,
    channel: r.channel,
    frequency: r.frequency,
    days: r.days,
    notes: r.notes,
  }))

  try {
    const generatedActivities = await generateCommunicationPlan(
      settingsData,
      rulesData,
      start,
      approvedIds
    )

    const created = await prisma.activity.createMany({
      data: generatedActivities.map((activity) => ({
        orgId: org.id,
        title: activity.title,
        date: new Date(activity.date),
        channels: JSON.stringify(activity.channels),
        category: activity.category,
        content: JSON.stringify(activity.content || {}),
        status: 'draft',
        isGenerated: true,
      })),
    })

    return NextResponse.json({
      success: true,
      created: created.count,
    })
  } catch (error) {
    console.error('Generate error:', error)
    return NextResponse.json(
      { error: 'Ошибка при генерации плана' },
      { status: 500 }
    )
  }
}
