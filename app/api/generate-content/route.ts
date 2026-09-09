import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateActivityContent } from '@/lib/anthropic'
import { format } from 'date-fns'

// Генерация через Claude занимает десятки секунд — поднимаем лимит
// выполнения функции, иначе Vercel обрывает соединение с браузером
// (по умолчанию 10-15 с) ещё до того, как план будет готов.
export const maxDuration = 60

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { activityId } = await req.json()

  const activity = await prisma.activity.findUnique({
    where: { id: activityId },
    include: { org: { include: { settings: true } } },
  })

  if (!activity || activity.org.userId !== session.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const settings = activity.org.settings
  const settingsData = {
    description: settings?.description ?? '',
    services: settings?.services ?? '',
    products: settings?.products ?? '',
    businessFocus: settings?.businessFocus ?? '',
    topProducts: settings?.topProducts ?? '',
  }

  const channels = JSON.parse(activity.channels) as string[]

  try {
    const content = await generateActivityContent(
      {
        title: activity.title,
        channels,
        category: activity.category,
        date: format(activity.date, 'yyyy-MM-dd'),
      },
      settingsData
    )

    const updated = await prisma.activity.update({
      where: { id: activityId },
      data: { content: JSON.stringify(content) },
    })

    return NextResponse.json({ success: true, content, activity: updated })
  } catch (error) {
    console.error('Generate content error:', error)
    return NextResponse.json(
      { error: 'Ошибка при генерации контента' },
      { status: 500 }
    )
  }
}
