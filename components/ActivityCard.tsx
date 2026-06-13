'use client'

import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Mail, MessageSquare, Bell, MessagesSquare } from 'lucide-react'

interface Activity {
  id: string
  title: string
  date: string
  channels: string
  category: string
  status: string
  content: string
}

interface ActivityCardProps {
  activity: Activity
  onClick: () => void
  compact?: boolean
}

const channelColors: Record<string, string> = {
  email: 'bg-blue-100 text-blue-800',
  sms: 'bg-green-100 text-green-800',
  push: 'bg-orange-100 text-orange-800',
  messenger: 'bg-purple-100 text-purple-800',
}

const channelIcons: Record<string, React.ReactNode> = {
  email: <Mail className="w-3 h-3" />,
  sms: <MessageSquare className="w-3 h-3" />,
  push: <Bell className="w-3 h-3" />,
  messenger: <MessagesSquare className="w-3 h-3" />,
}

const statusBorders: Record<string, string> = {
  draft: 'border-gray-300',
  approved: 'border-green-500',
  rejected: 'border-red-500',
}

export function ActivityCard({ activity, onClick, compact = false }: ActivityCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: activity.id,
    data: { activity },
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 'auto',
  }

  const channels = JSON.parse(activity.channels) as string[]
  const primaryChannel = channels[0] || 'email'
  const colorClass = channelColors[primaryChannel] || 'bg-gray-100 text-gray-800'
  const borderClass = statusBorders[activity.status] || 'border-gray-300'

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className={`
        cursor-pointer rounded-md border-2 ${borderClass} bg-white shadow-sm
        hover:shadow-md transition-shadow p-2 mb-1 select-none
        ${activity.status === 'rejected' ? 'opacity-60' : ''}
        ${compact ? 'text-xs' : 'text-sm'}
      `}
    >
      <div className="flex items-start gap-1 mb-1">
        <div className="flex gap-1 flex-wrap">
          {channels.map((ch) => (
            <span
              key={ch}
              className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium ${channelColors[ch] || 'bg-gray-100'}`}
            >
              {channelIcons[ch]}
              {ch.toUpperCase()}
            </span>
          ))}
        </div>
      </div>
      <p className={`font-medium leading-tight ${activity.status === 'rejected' ? 'line-through' : ''} ${compact ? 'text-xs' : 'text-sm'}`}>
        {activity.title}
      </p>
      {!compact && (
        <p className="text-xs text-gray-500 mt-1">{activity.category}</p>
      )}
    </div>
  )
}
