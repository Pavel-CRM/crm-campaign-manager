'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'

export default function SubscribeSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const paymentId = searchParams.get('payment_id')
  const plan = searchParams.get('plan') as 'monthly' | 'annual'
  const [status, setStatus] = useState<'loading' | 'success' | 'pending' | 'error'>('loading')

  useEffect(() => {
    if (!paymentId) {
      router.push('/subscribe')
      return
    }

    const verify = async () => {
      try {
        const res = await fetch('/api/payments/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentId, plan }),
        })
        const data = await res.json()

        if (data.status === 'succeeded') {
          setStatus('success')
          // Refresh session
          await signIn('credentials', { redirect: false })
          setTimeout(() => router.push('/'), 3000)
        } else if (data.status === 'pending') {
          setStatus('pending')
        } else {
          setStatus('error')
        }
      } catch {
        setStatus('error')
      }
    }

    verify()
  }, [paymentId, plan, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-950 to-gray-900 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        {status === 'loading' && (
          <div>
            <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white mb-2">Проверяем оплату...</h2>
            <p className="text-gray-400">Пожалуйста, подождите</p>
          </div>
        )}

        {status === 'success' && (
          <div>
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Подписка активирована!</h2>
            <p className="text-gray-400 mb-6">
              {plan === 'annual' ? 'Годовая подписка' : 'Ежемесячная подписка'} успешно оформлена
            </p>
            <p className="text-gray-500 text-sm">Переходим в приложение...</p>
          </div>
        )}

        {status === 'pending' && (
          <div>
            <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Платёж обрабатывается</h2>
            <p className="text-gray-400 mb-6">Обычно это занимает до 5 минут. Мы уведомим вас по email.</p>
            <button
              onClick={() => router.push('/')}
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
            >
              Вернуться в приложение
            </button>
          </div>
        )}

        {status === 'error' && (
          <div>
            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Что-то пошло не так</h2>
            <p className="text-gray-400 mb-6">Платёж не удался или был отменён</p>
            <button
              onClick={() => router.push('/subscribe')}
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
            >
              Попробовать снова
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
