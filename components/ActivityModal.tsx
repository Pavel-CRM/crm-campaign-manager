'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, Mail, MessageSquare, Bell, MessagesSquare, Check, X, Sparkles } from 'lucide-react'

interface Activity {
  id: string
  title: string
  date: string
  channels: string
  category: string
  status: string
  content: string
}

interface ActivityContent {
  email?: {
    subject: string
    preheader: string
    bannerText: string
    headline: string
    bodyText: string
    ctaButtons: { text: string; url: string }[]
  }
  sms?: { text: string }
  push?: { title: string; body: string }
  messenger?: { text: string; buttons: { text: string }[] }
}

interface ActivityModalProps {
  activity: Activity | null
  onClose: () => void
  onUpdate: (updated: Activity) => void
}

const statusLabels: Record<string, string> = {
  draft: 'Черновик',
  approved: 'Одобрено',
  rejected: 'Отклонено',
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
}

const channelNames: Record<string, string> = {
  email: 'Email',
  sms: 'SMS',
  push: 'Push-уведомление',
  messenger: 'Мессенджер',
}

const channelIcons: Record<string, React.ReactNode> = {
  email: <Mail className="w-4 h-4" />,
  sms: <MessageSquare className="w-4 h-4" />,
  push: <Bell className="w-4 h-4" />,
  messenger: <MessagesSquare className="w-4 h-4" />,
}

export function ActivityModal({ activity, onClose, onUpdate }: ActivityModalProps) {
  const [editData, setEditData] = useState<Activity | null>(null)
  const [content, setContent] = useState<ActivityContent>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (activity) {
      setEditData({ ...activity })
      try {
        setContent(JSON.parse(activity.content) || {})
      } catch {
        setContent({})
      }
    }
  }, [activity])

  if (!activity || !editData) return null

  const channels = JSON.parse(activity.channels) as string[]

  const handleSave = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/activities/${activity.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editData.title,
          category: editData.category,
          content,
        }),
      })
      if (!res.ok) throw new Error()
      const updated = await res.json()
      onUpdate({ ...updated, content: JSON.stringify(content) })
      toast({ title: 'Сохранено', description: 'Активность обновлена' })
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось сохранить', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatus = async (status: string) => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/activities/${activity.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error()
      const updated = await res.json()
      onUpdate(updated)
      toast({ title: status === 'approved' ? 'Одобрено' : 'Отклонено' })
      onClose()
    } catch {
      toast({ title: 'Ошибка', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerateContent = async () => {
    setIsGenerating(true)
    try {
      const res = await fetch('/api/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activityId: activity.id }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setContent(data.content)
      onUpdate({ ...activity, content: JSON.stringify(data.content) })
      toast({ title: 'Контент сгенерирован', description: 'AI создал контент для всех каналов' })
    } catch {
      toast({ title: 'Ошибка генерации', variant: 'destructive' })
    } finally {
      setIsGenerating(false)
    }
  }

  const updateEmailContent = (field: string, value: string | { text: string; url: string }[]) => {
    setContent(prev => ({
      ...prev,
      email: { ...prev.email!, [field]: value },
    }))
  }

  return (
    <Dialog open={!!activity} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <DialogTitle className="flex-1">{editData.title}</DialogTitle>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[activity.status]}`}>
              {statusLabels[activity.status]}
            </span>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Meta info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Название</Label>
              <Input
                value={editData.title}
                onChange={(e) => setEditData(prev => ({ ...prev!, title: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Категория</Label>
              <Input
                value={editData.category}
                onChange={(e) => setEditData(prev => ({ ...prev!, category: e.target.value }))}
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Дата:</span>
            <span className="text-sm font-medium">
              {format(new Date(activity.date), 'd MMMM yyyy', { locale: ru })}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Каналы:</span>
            <div className="flex gap-2">
              {channels.map((ch) => (
                <span key={ch} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs font-medium">
                  {channelIcons[ch]}
                  {channelNames[ch]}
                </span>
              ))}
            </div>
          </div>

          {/* Channel content */}
          <div className="space-y-4">
            {channels.includes('email') && (
              <div className="border rounded-lg p-4 space-y-3">
                <h3 className="font-medium flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-600" />
                  Email контент
                </h3>
                <div>
                  <Label className="text-xs">Тема письма</Label>
                  <Input
                    value={content.email?.subject || ''}
                    onChange={(e) => updateEmailContent('subject', e.target.value)}
                    placeholder="Тема письма..."
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Прехедер</Label>
                  <Input
                    value={content.email?.preheader || ''}
                    onChange={(e) => updateEmailContent('preheader', e.target.value)}
                    placeholder="Прехедер..."
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Текст баннера</Label>
                  <Input
                    value={content.email?.bannerText || ''}
                    onChange={(e) => updateEmailContent('bannerText', e.target.value)}
                    placeholder="Текст баннера..."
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Заголовок</Label>
                  <Input
                    value={content.email?.headline || ''}
                    onChange={(e) => updateEmailContent('headline', e.target.value)}
                    placeholder="Заголовок..."
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Текст письма</Label>
                  <Textarea
                    value={content.email?.bodyText || ''}
                    onChange={(e) => updateEmailContent('bodyText', e.target.value)}
                    placeholder="Основной текст..."
                    className="mt-1 min-h-[100px]"
                  />
                </div>
                <div>
                  <Label className="text-xs">CTA кнопки</Label>
                  {(content.email?.ctaButtons || []).map((btn, i) => (
                    <div key={i} className="flex gap-2 mt-1">
                      <Input
                        value={btn.text}
                        onChange={(e) => {
                          const buttons = [...(content.email?.ctaButtons || [])]
                          buttons[i] = { ...buttons[i], text: e.target.value }
                          updateEmailContent('ctaButtons', buttons)
                        }}
                        placeholder="Текст кнопки"
                        className="flex-1"
                      />
                      <Input
                        value={btn.url}
                        onChange={(e) => {
                          const buttons = [...(content.email?.ctaButtons || [])]
                          buttons[i] = { ...buttons[i], url: e.target.value }
                          updateEmailContent('ctaButtons', buttons)
                        }}
                        placeholder="URL"
                        className="flex-1"
                      />
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => updateEmailContent('ctaButtons', [...(content.email?.ctaButtons || []), { text: '', url: '#' }])}
                  >
                    + Добавить кнопку
                  </Button>
                </div>
              </div>
            )}

            {channels.includes('sms') && (
              <div className="border rounded-lg p-4 space-y-3">
                <h3 className="font-medium flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-green-600" />
                  SMS контент
                </h3>
                <div>
                  <Label className="text-xs">Текст SMS (до 160 символов)</Label>
                  <Textarea
                    value={content.sms?.text || ''}
                    onChange={(e) => setContent(prev => ({ ...prev, sms: { text: e.target.value } }))}
                    placeholder="Текст SMS..."
                    className="mt-1"
                    maxLength={160}
                  />
                  <p className="text-xs text-gray-400 mt-1">{(content.sms?.text || '').length}/160</p>
                </div>
              </div>
            )}

            {channels.includes('push') && (
              <div className="border rounded-lg p-4 space-y-3">
                <h3 className="font-medium flex items-center gap-2">
                  <Bell className="w-4 h-4 text-orange-600" />
                  Push-уведомление
                </h3>
                <div>
                  <Label className="text-xs">Заголовок (до 50 символов)</Label>
                  <Input
                    value={content.push?.title || ''}
                    onChange={(e) => setContent(prev => ({ ...prev, push: { ...prev.push!, title: e.target.value } }))}
                    placeholder="Заголовок..."
                    className="mt-1"
                    maxLength={50}
                  />
                </div>
                <div>
                  <Label className="text-xs">Текст (до 100 символов)</Label>
                  <Textarea
                    value={content.push?.body || ''}
                    onChange={(e) => setContent(prev => ({ ...prev, push: { ...prev.push!, body: e.target.value } }))}
                    placeholder="Текст уведомления..."
                    className="mt-1"
                    maxLength={100}
                  />
                </div>
              </div>
            )}

            {channels.includes('messenger') && (
              <div className="border rounded-lg p-4 space-y-3">
                <h3 className="font-medium flex items-center gap-2">
                  <MessagesSquare className="w-4 h-4 text-purple-600" />
                  Мессенджер
                </h3>
                <div>
                  <Label className="text-xs">Текст сообщения</Label>
                  <Textarea
                    value={content.messenger?.text || ''}
                    onChange={(e) => setContent(prev => ({ ...prev, messenger: { ...prev.messenger!, text: e.target.value } }))}
                    placeholder="Текст..."
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Кнопки</Label>
                  {(content.messenger?.buttons || []).map((btn, i) => (
                    <div key={i} className="flex gap-2 mt-1">
                      <Input
                        value={btn.text}
                        onChange={(e) => {
                          const buttons = [...(content.messenger?.buttons || [])]
                          buttons[i] = { text: e.target.value }
                          setContent(prev => ({ ...prev, messenger: { ...prev.messenger!, buttons } }))
                        }}
                        placeholder="Текст кнопки"
                      />
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => setContent(prev => ({
                      ...prev,
                      messenger: {
                        ...prev.messenger!,
                        buttons: [...(prev.messenger?.buttons || []), { text: '' }]
                      }
                    }))}
                  >
                    + Добавить кнопку
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex-wrap gap-2">
          {activity.status === 'approved' && (
            <Button
              variant="outline"
              onClick={handleGenerateContent}
              disabled={isGenerating}
              className="flex items-center gap-2 text-purple-600 border-purple-300 hover:bg-purple-50"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Сгенерировать контент
            </Button>
          )}

          <Button variant="outline" onClick={handleSave} disabled={isLoading}>
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Сохранить'}
          </Button>

          {activity.status !== 'approved' && (
            <Button
              onClick={() => handleStatus('approved')}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              Одобрить
            </Button>
          )}

          {activity.status !== 'rejected' && (
            <Button
              variant="destructive"
              onClick={() => handleStatus('rejected')}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Отклонить
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
