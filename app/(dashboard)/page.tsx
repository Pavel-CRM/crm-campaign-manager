'use client'

import { useState, useEffect, useCallback } from 'react'
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns'
import { Calendar } from '@/components/Calendar'
import { ActivityModal } from '@/components/ActivityModal'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, Sparkles, RefreshCw } from 'lucide-react'

interface Activity {
  id: string
  title: string
  date: string
  channels: string
  category: string
  status: string
  content: string
}

export default function HomePage() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const { toast } = useToast()

  const fetchActivities = useCallback(async () => {
    setIsLoading(true)
    try {
      // Fetch a 3-month window
      const now = new Date()
      const start = startOfMonth(subMonths(now, 1))
      const end = endOfMonth(addMonths(now, 2))

      const res = await fetch(
        `/api/activities?start=${start.toISOString()}&end=${end.toISOString()}`
      )
      if (!res.ok) throw new Error()
      const data = await res.json()
      setActivities(data)
    } catch {
      toast({ title: 'Ошибка загрузки', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchActivities()
  }, [fetchActivities])

  const handleGenerate = async (keepApproved = false) => {
    setIsGenerating(true)
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keepApproved,
          startDate: new Date().toISOString(),
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error)
      }
      const data = await res.json()
      toast({
        title: 'План сгенерирован',
        description: `Создано ${data.created} активностей`,
      })
      await fetchActivities()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ошибка генерации'
      toast({ title: 'Ошибка', description: message, variant: 'destructive' })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleActivityMove = async (activityId: string, newDate: Date) => {
    const activity = activities.find((a) => a.id === activityId)
    if (!activity) return

    // Optimistic update
    setActivities((prev) =>
      prev.map((a) =>
        a.id === activityId ? { ...a, date: newDate.toISOString() } : a
      )
    )

    try {
      const res = await fetch(`/api/activities/${activityId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: newDate.toISOString() }),
      })
      if (!res.ok) throw new Error()
    } catch {
      // Revert on error
      setActivities((prev) =>
        prev.map((a) => (a.id === activityId ? activity : a))
      )
      toast({ title: 'Ошибка перемещения', variant: 'destructive' })
    }
  }

  const handleActivityUpdate = (updated: Activity) => {
    setActivities((prev) =>
      prev.map((a) => (a.id === updated.id ? updated : a))
    )
    if (selectedActivity?.id === updated.id) {
      setSelectedActivity(updated)
    }
  }

  const approvedCount = activities.filter((a) => a.status === 'approved').length
  const draftCount = activities.filter((a) => a.status === 'draft').length
  const rejectedCount = activities.filter((a) => a.status === 'rejected').length

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Календарь коммуникаций</h1>
            <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full inline-block"></span>
                Черновики: {draftCount}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full inline-block"></span>
                Одобрено: {approvedCount}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-red-500 rounded-full inline-block"></span>
                Отклонено: {rejectedCount}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => handleGenerate(true)}
              disabled={isGenerating}
              className="flex items-center gap-2"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Перегенерировать
            </Button>
            <Button
              onClick={() => handleGenerate(false)}
              disabled={isGenerating}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              Сгенерировать план
            </Button>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <Calendar
            activities={activities}
            onActivityClick={setSelectedActivity}
            onActivityMove={handleActivityMove}
          />
        )}
      </div>

      {/* Activity Modal */}
      <ActivityModal
        activity={selectedActivity}
        onClose={() => setSelectedActivity(null)}
        onUpdate={handleActivityUpdate}
      />
    </div>
  )
}
