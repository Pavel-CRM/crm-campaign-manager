'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface OrgSettings {
  description: string
  services: string
  products: string
  newsletters: string
  categories: string
  channels: string[]
  businessFocus: string
  topProducts: string
}

interface Rule {
  id?: string
  category: string
  channel: string
  frequency: number
  days: string[]
  notes: string
}

const availableChannels = [
  { value: 'email', label: 'Email' },
  { value: 'sms', label: 'SMS' },
  { value: 'push', label: 'Push-уведомления' },
  { value: 'messenger', label: 'Мессенджер' },
]

const dayOptions = [
  { value: 'mon', label: 'Пн' },
  { value: 'tue', label: 'Вт' },
  { value: 'wed', label: 'Ср' },
  { value: 'thu', label: 'Чт' },
  { value: 'fri', label: 'Пт' },
  { value: 'sat', label: 'Сб' },
  { value: 'sun', label: 'Вс' },
]

export default function SettingsPage() {
  const [orgName, setOrgName] = useState('')
  const [settings, setSettings] = useState<OrgSettings>({
    description: '',
    services: '',
    products: '',
    newsletters: '',
    categories: '',
    channels: [],
    businessFocus: '',
    topProducts: '',
  })
  const [rules, setRules] = useState<Rule[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings')
        if (!res.ok) throw new Error()
        const data = await res.json()
        setOrgName(data.org?.name || '')
        if (data.settings) {
          setSettings({
            description: data.settings.description || '',
            services: data.settings.services || '',
            products: data.settings.products || '',
            newsletters: data.settings.newsletters || '',
            categories: data.settings.categories || '',
            channels: JSON.parse(data.settings.channels || '[]'),
            businessFocus: data.settings.businessFocus || '',
            topProducts: data.settings.topProducts || '',
          })
        }
        if (data.rules) {
          setRules(
            data.rules.map((r: Rule & { days: string }) => ({
              ...r,
              days: JSON.parse(r.days || '[]'),
            }))
          )
        }
      } catch {
        toast({ title: 'Ошибка загрузки настроек', variant: 'destructive' })
      } finally {
        setIsLoading(false)
      }
    }
    fetchSettings()
  }, [toast])

  const handleSaveSettings = async () => {
    setIsSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings, orgName }),
      })
      if (!res.ok) throw new Error()
      toast({ title: 'Настройки сохранены' })
    } catch {
      toast({ title: 'Ошибка сохранения', variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveRules = async () => {
    setIsSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rules }),
      })
      if (!res.ok) throw new Error()
      toast({ title: 'Правила сохранены' })
    } catch {
      toast({ title: 'Ошибка сохранения', variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  const addRule = () => {
    setRules(prev => [
      ...prev,
      { category: '', channel: 'email', frequency: 1, days: [], notes: '' },
    ])
  }

  const updateRule = (index: number, field: keyof Rule, value: string | number | string[]) => {
    setRules(prev => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)))
  }

  const removeRule = (index: number) => {
    setRules(prev => prev.filter((_, i) => i !== index))
  }

  const toggleChannel = (ch: string) => {
    setSettings(prev => ({
      ...prev,
      channels: prev.channels.includes(ch)
        ? prev.channels.filter(c => c !== ch)
        : [...prev.channels, ch],
    }))
  }

  const toggleRuleDay = (index: number, day: string) => {
    const rule = rules[index]
    const days = rule.days.includes(day)
      ? rule.days.filter(d => d !== day)
      : [...rule.days, day]
    updateRule(index, 'days', days)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Настройки</h1>

      <Tabs defaultValue="company">
        <TabsList className="mb-6">
          <TabsTrigger value="company">Информация о компании</TabsTrigger>
          <TabsTrigger value="rules">Правила коммуникаций</TabsTrigger>
        </TabsList>

        {/* Company Info Tab */}
        <TabsContent value="company">
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
            <div>
              <Label>Название компании</Label>
              <Input
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="ООО Ромашка"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Описание компании</Label>
              <Textarea
                value={settings.description}
                onChange={(e) => setSettings(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Опишите вашу компанию, её миссию и ценности..."
                className="mt-1 min-h-[80px]"
              />
            </div>

            <div>
              <Label>Услуги</Label>
              <Textarea
                value={settings.services}
                onChange={(e) => setSettings(prev => ({ ...prev, services: e.target.value }))}
                placeholder="Перечислите основные услуги компании..."
                className="mt-1"
              />
            </div>

            <div>
              <Label>Продукты</Label>
              <Textarea
                value={settings.products}
                onChange={(e) => setSettings(prev => ({ ...prev, products: e.target.value }))}
                placeholder="Перечислите основные продукты..."
                className="mt-1"
              />
            </div>

            <div>
              <Label>Типы рассылок</Label>
              <Textarea
                value={settings.newsletters}
                onChange={(e) => setSettings(prev => ({ ...prev, newsletters: e.target.value }))}
                placeholder="Например: промо-рассылки, дайджесты, транзакционные письма..."
                className="mt-1"
              />
            </div>

            <div>
              <Label>Категории коммуникаций</Label>
              <Textarea
                value={settings.categories}
                onChange={(e) => setSettings(prev => ({ ...prev, categories: e.target.value }))}
                placeholder="Например: промо, информационные, сервисные, реактивация..."
                className="mt-1"
              />
            </div>

            <div>
              <Label>Доступные каналы</Label>
              <div className="flex gap-3 mt-2 flex-wrap">
                {availableChannels.map((ch) => (
                  <button
                    key={ch.value}
                    type="button"
                    onClick={() => toggleChannel(ch.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-colors ${
                      settings.channels.includes(ch.value)
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {ch.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label>Бизнес-фокус</Label>
              <Textarea
                value={settings.businessFocus}
                onChange={(e) => setSettings(prev => ({ ...prev, businessFocus: e.target.value }))}
                placeholder="Опишите текущий бизнес-фокус и приоритеты..."
                className="mt-1"
              />
            </div>

            <div>
              <Label>Наиболее прибыльные продукты</Label>
              <Textarea
                value={settings.topProducts}
                onChange={(e) => setSettings(prev => ({ ...prev, topProducts: e.target.value }))}
                placeholder="Перечислите топ продукты по прибыльности..."
                className="mt-1"
              />
            </div>

            <Button
              onClick={handleSaveSettings}
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Сохранить настройки
            </Button>
          </div>
        </TabsContent>

        {/* Rules Tab */}
        <TabsContent value="rules">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-semibold">Правила коммуникаций</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Задайте частоту и предпочтения для каждого канала и категории
                </p>
              </div>
              <Button variant="outline" onClick={addRule} className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Добавить правило
              </Button>
            </div>

            {rules.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p className="text-lg mb-2">Нет правил</p>
                <p className="text-sm">Добавьте правила для управления частотой коммуникаций</p>
              </div>
            ) : (
              <div className="space-y-4">
                {rules.map((rule, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <h3 className="text-sm font-medium text-gray-700">Правило {index + 1}</h3>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeRule(index)}
                        className="text-red-400 hover:text-red-600 hover:bg-red-50 -mt-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label className="text-xs">Канал</Label>
                        <Select
                          value={rule.channel}
                          onValueChange={(v) => updateRule(index, 'channel', v)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {availableChannels.map((ch) => (
                              <SelectItem key={ch.value} value={ch.value}>
                                {ch.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Категория</Label>
                        <Input
                          value={rule.category}
                          onChange={(e) => updateRule(index, 'category', e.target.value)}
                          placeholder="промо, сервис..."
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Частота (раз в неделю)</Label>
                        <Input
                          type="number"
                          min={1}
                          max={7}
                          value={rule.frequency}
                          onChange={(e) => updateRule(index, 'frequency', parseInt(e.target.value) || 1)}
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs">Предпочтительные дни</Label>
                      <div className="flex gap-2 mt-1 flex-wrap">
                        {dayOptions.map((day) => (
                          <button
                            key={day.value}
                            type="button"
                            onClick={() => toggleRuleDay(index, day.value)}
                            className={`px-3 py-1 rounded text-xs font-medium border transition-colors ${
                              rule.days.includes(day.value)
                                ? 'border-blue-600 bg-blue-50 text-blue-700'
                                : 'border-gray-200 text-gray-600 hover:border-gray-300'
                            }`}
                          >
                            {day.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs">Заметки</Label>
                      <Input
                        value={rule.notes}
                        onChange={(e) => updateRule(index, 'notes', e.target.value)}
                        placeholder="Дополнительные правила или пояснения..."
                        className="mt-1"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-5 pt-5 border-t border-gray-100">
              <Button
                onClick={handleSaveRules}
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Сохранить правила
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
