'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { isSubscriptionActive } from '@/lib/yookassa'

const PLANS = {
  monthly: {
    label: 'Ежемесячная',
    price: 1500,
    period: 'в месяц',
    description: 'Оплата каждый месяц',
    badge: null,
    features: [
      'Неограниченная генерация планов',
      'AI-контент для всех каналов',
      'До 100 коммуникаций в месяц',
      'Email, SMS, Push, Мессенджер',
    ],
  },
  annual: {
    label: 'Годовая',
    price: 900,
    period: 'в месяц',
    totalPrice: 10800,
    description: 'Списывается 10 800 ₽ раз в год',
    badge: 'Выгода 40%',
    features: [
      'Всё из ежемесячной подписки',
      'Экономия 7 200 ₽ в год',
      'Приоритетная поддержка',
      'Ранний доступ к новым функциям',
    ],
  },
}

export default function SubscribePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('annual')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const trialEndsAt = session?.user?.trialEndsAt ? new Date(session.user.trialEndsAt) : null
  const now = new Date()
  const trialDaysLeft = trialEndsAt
    ? Math.max(0, Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : 0
  const isInTrial = session?.user?.subscriptionStatus === 'trial' && trialDaysLeft > 0
  const isExpired = !isInTrial && session?.user?.subscriptionStatus !== 'active' && session?.user?.subscriptionStatus !== 'lifetime'

  const handleSubscribe = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: selectedPlan }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Ошибка')
      window.location.href = data.confirmationUrl
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-950 to-gray-900 flex items-center justify-center p-6">
      <div className="max-w-3xl w-full">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-500/30 rounded-full px-4 py-1.5 mb-6">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
            <span className="text-blue-300 text-sm font-medium">CRM Campaign Manager</span>
          </div>

          {isExpired ? (
            <>
              <h1 className="text-3xl font-bold text-white mb-3">
                Пробный период завершён
              </h1>
              <p className="text-gray-400">
                Оформите подписку, чтобы продолжить управлять коммуникациями
              </p>
            </>
          ) : isInTrial ? (
            <>
              <h1 className="text-3xl font-bold text-white mb-3">
                Оформите подписку
              </h1>
              <p className="text-gray-400">
                У вас осталось <span className="text-blue-400 font-semibold">{trialDaysLeft} дней</span> пробного периода
              </p>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-bold text-white mb-3">Продление подписки</h1>
              <p className="text-gray-400">Выберите тариф</p>
            </>
          )}
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
          {(Object.entries(PLANS) as [string, typeof PLANS.monthly | typeof PLANS.annual][]).map(([key, plan]) => {
            const isSelected = selectedPlan === key
            return (
              <button
                key={key}
                onClick={() => setSelectedPlan(key as 'monthly' | 'annual')}
                className={`relative text-left p-6 rounded-2xl border-2 transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-gray-700 bg-gray-800/50 hover:border-gray-500'
                }`}
              >
                {(plan as any).badge && (
                  <span className="absolute top-4 right-4 bg-green-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                    {(plan as any).badge}
                  </span>
                )}

                <div className="mb-4">
                  <div className="text-gray-400 text-sm font-medium mb-1">{plan.label}</div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-white">{plan.price.toLocaleString('ru')}</span>
                    <span className="text-gray-400"> ₽/{plan.period}</span>
                  </div>
                  {'totalPrice' in plan && (
                    <div className="text-gray-500 text-sm mt-1">
                      {(plan as any).totalPrice.toLocaleString('ru')} ₽/год
                    </div>
                  )}
                  <div className="text-gray-500 text-xs mt-1">{plan.description}</div>
                </div>

                <ul className="space-y-2">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                      <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>

                {isSelected && (
                  <div className="absolute top-4 left-4">
                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* CTA */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 mb-4 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleSubscribe}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-4 rounded-xl transition-colors flex items-center justify-center gap-3 text-lg"
        >
          {loading ? (
            <>
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Переход к оплате...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              Оплатить через ЮКасса
            </>
          )}
        </button>

        <div className="flex items-center justify-center gap-4 mt-6 text-gray-500 text-xs">
          <span>🔒 Безопасная оплата</span>
          <span>•</span>
          <span>Сохранение карты для автопродления</span>
          <span>•</span>
          <span>Отмена в любой момент</span>
        </div>

        {isInTrial && (
          <div className="mt-4 text-center">
            <button
              onClick={() => router.push('/')}
              className="text-gray-500 hover:text-gray-400 text-sm transition-colors"
            >
              Вернуться к пробному периоду
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
