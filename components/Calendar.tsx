'use client'

import { useState, useCallback } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { useDroppable } from '@dnd-kit/core'
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addDays,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  isSameDay,
  isSameMonth,
  isToday,
} from 'date-fns'
import { ru } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ActivityCard } from './ActivityCard'

interface Activity {
  id: string
  title: string
  date: string
  channels: string
  category: string
  status: string
  content: string
}

interface CalendarProps {
  activities: Activity[]
  onActivityClick: (activity: Activity) => void
  onActivityMove: (activityId: string, newDate: Date) => void
}

function DroppableDay({
  date,
  activities,
  onActivityClick,
  isCurrentMonth = true,
}: {
  date: Date
  activities: Activity[]
  onActivityClick: (a: Activity) => void
  isCurrentMonth?: boolean
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: date.toISOString(),
    data: { date },
  })

  return (
    <div
      ref={setNodeRef}
      className={`
        min-h-[120px] p-1 border-r border-b border-gray-200 relative
        ${isOver ? 'bg-blue-50' : ''}
        ${!isCurrentMonth ? 'bg-gray-50' : 'bg-white'}
        ${isToday(date) ? 'ring-2 ring-inset ring-blue-400' : ''}
      `}
    >
      <div className={`text-xs font-medium mb-1 ${isToday(date) ? 'text-blue-600' : isCurrentMonth ? 'text-gray-700' : 'text-gray-400'}`}>
        {format(date, 'd')}
      </div>
      <div className="space-y-1">
        {activities.map((activity) => (
          <ActivityCard
            key={activity.id}
            activity={activity}
            onClick={() => onActivityClick(activity)}
            compact
          />
        ))}
      </div>
    </div>
  )
}

function DroppableWeekDay({
  date,
  activities,
  onActivityClick,
}: {
  date: Date
  activities: Activity[]
  onActivityClick: (a: Activity) => void
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: date.toISOString(),
    data: { date },
  })

  return (
    <div
      ref={setNodeRef}
      className={`
        flex-1 min-h-[500px] p-2 border-r border-gray-200
        ${isOver ? 'bg-blue-50' : 'bg-white'}
        ${isToday(date) ? 'bg-blue-50/30' : ''}
      `}
    >
      <div className={`text-xs font-medium mb-2 ${isToday(date) ? 'text-blue-600' : 'text-gray-500'}`}>
        {format(date, 'EEE', { locale: ru })}
        <span className={`ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full text-xs ${isToday(date) ? 'bg-blue-600 text-white' : ''}`}>
          {format(date, 'd')}
        </span>
      </div>
      <div className="space-y-1">
        {activities.map((activity) => (
          <ActivityCard
            key={activity.id}
            activity={activity}
            onClick={() => onActivityClick(activity)}
          />
        ))}
      </div>
    </div>
  )
}

export function Calendar({ activities, onActivityClick, onActivityMove }: CalendarProps) {
  const [view, setView] = useState<'week' | 'month'>('week')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [activeActivity, setActiveActivity] = useState<Activity | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  )

  const getActivitiesForDay = useCallback(
    (date: Date) => {
      return activities.filter((a) => isSameDay(new Date(a.date), date))
    },
    [activities]
  )

  const handleDragStart = (event: DragStartEvent) => {
    const { data } = event.active
    if (data.current?.activity) {
      setActiveActivity(data.current.activity)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveActivity(null)
    const { active, over } = event
    if (!over) return

    const activityId = active.id as string
    const targetDate = over.data.current?.date as Date

    if (!targetDate) return

    const activity = activities.find((a) => a.id === activityId)
    if (!activity) return

    if (!isSameDay(new Date(activity.date), targetDate)) {
      onActivityMove(activityId, targetDate)
    }
  }

  // Week view dates
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  // Month view dates
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const monthDays = eachDayOfInterval({ start: calStart, end: calEnd })

  const navigate = (direction: 'prev' | 'next') => {
    if (view === 'week') {
      setCurrentDate(direction === 'prev' ? subWeeks(currentDate, 1) : addWeeks(currentDate, 1))
    } else {
      setCurrentDate(direction === 'prev' ? subMonths(currentDate, 1) : addMonths(currentDate, 1))
    }
  }

  const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      {/* Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => navigate('prev')}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-lg font-semibold min-w-[200px] text-center">
            {view === 'week'
              ? `${format(weekStart, 'd MMM', { locale: ru })} – ${format(addDays(weekStart, 6), 'd MMM yyyy', { locale: ru })}`
              : format(currentDate, 'LLLL yyyy', { locale: ru })}
          </h2>
          <Button variant="outline" size="icon" onClick={() => navigate('next')}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
            Сегодня
          </Button>
        </div>

        <div className="flex gap-2">
          <Button
            variant={view === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('week')}
          >
            Неделя
          </Button>
          <Button
            variant={view === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('month')}
          >
            Месяц
          </Button>
        </div>
      </div>

      {/* Week View */}
      {view === 'week' && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="flex">
            {weekDays.map((day) => (
              <DroppableWeekDay
                key={day.toISOString()}
                date={day}
                activities={getActivitiesForDay(day)}
                onActivityClick={onActivityClick}
              />
            ))}
          </div>
        </div>
      )}

      {/* Month View */}
      {view === 'month' && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
            {dayNames.map((name) => (
              <div key={name} className="p-2 text-xs font-medium text-gray-500 text-center border-r border-gray-200 last:border-r-0">
                {name}
              </div>
            ))}
          </div>
          {/* Days */}
          <div className="grid grid-cols-7">
            {monthDays.map((day) => (
              <DroppableDay
                key={day.toISOString()}
                date={day}
                activities={getActivitiesForDay(day)}
                onActivityClick={onActivityClick}
                isCurrentMonth={isSameMonth(day, currentDate)}
              />
            ))}
          </div>
        </div>
      )}

      <DragOverlay>
        {activeActivity && (
          <div className="rotate-2 opacity-90">
            <ActivityCard
              activity={activeActivity}
              onClick={() => {}}
              compact
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
