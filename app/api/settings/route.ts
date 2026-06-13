import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function getOrg(userId: string) {
  return prisma.organization.findFirst({
    where: { userId },
    include: { settings: true, rules: true },
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

  return NextResponse.json({
    org: { id: org.id, name: org.name },
    settings: org.settings,
    rules: org.rules,
  })
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const org = await getOrg(session.user.id)
  if (!org) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
  }

  const body = await req.json()
  const { settings, rules, orgName } = body

  if (orgName) {
    await prisma.organization.update({
      where: { id: org.id },
      data: { name: orgName },
    })
  }

  if (settings) {
    if (org.settings) {
      await prisma.orgSettings.update({
        where: { orgId: org.id },
        data: {
          description: settings.description ?? '',
          services: settings.services ?? '',
          products: settings.products ?? '',
          newsletters: settings.newsletters ?? '',
          categories: settings.categories ?? '',
          channels: JSON.stringify(settings.channels ?? []),
          businessFocus: settings.businessFocus ?? '',
          topProducts: settings.topProducts ?? '',
        },
      })
    } else {
      await prisma.orgSettings.create({
        data: {
          orgId: org.id,
          description: settings.description ?? '',
          services: settings.services ?? '',
          products: settings.products ?? '',
          newsletters: settings.newsletters ?? '',
          categories: settings.categories ?? '',
          channels: JSON.stringify(settings.channels ?? []),
          businessFocus: settings.businessFocus ?? '',
          topProducts: settings.topProducts ?? '',
        },
      })
    }
  }

  if (rules !== undefined) {
    // Delete all existing rules and recreate
    await prisma.communicationRule.deleteMany({
      where: { orgId: org.id },
    })

    if (rules.length > 0) {
      await prisma.communicationRule.createMany({
        data: rules.map((r: {
          category: string
          channel: string
          frequency: number
          days?: string[]
          notes?: string
        }) => ({
          orgId: org.id,
          category: r.category,
          channel: r.channel,
          frequency: r.frequency,
          days: JSON.stringify(r.days ?? []),
          notes: r.notes ?? '',
        })),
      })
    }
  }

  return NextResponse.json({ success: true })
}
