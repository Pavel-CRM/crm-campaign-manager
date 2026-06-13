import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const activity = await prisma.activity.findUnique({
    where: { id: params.id },
    include: { org: true },
  })

  if (!activity || activity.org.userId !== session.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(activity)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const activity = await prisma.activity.findUnique({
    where: { id: params.id },
    include: { org: true },
  })

  if (!activity || activity.org.userId !== session.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const body = await req.json()
  const { title, date, channels, category, status, content } = body

  const updated = await prisma.activity.update({
    where: { id: params.id },
    data: {
      ...(title !== undefined && { title }),
      ...(date !== undefined && { date: new Date(date) }),
      ...(channels !== undefined && { channels: JSON.stringify(channels) }),
      ...(category !== undefined && { category }),
      ...(status !== undefined && { status }),
      ...(content !== undefined && { content: JSON.stringify(content) }),
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const activity = await prisma.activity.findUnique({
    where: { id: params.id },
    include: { org: true },
  })

  if (!activity || activity.org.userId !== session.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await prisma.activity.delete({ where: { id: params.id } })

  return NextResponse.json({ success: true })
}
