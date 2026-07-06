'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      setSent(true)
    } catch {
      // Показываем тот же экран — не раскрываем детали.
      setSent(true)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 rounded-xl mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Восстановление пароля</h1>
            <p className="text-gray-500 mt-1">
              {sent ? 'Проверьте почту' : 'Укажите email от вашего аккаунта'}
            </p>
          </div>

          {sent ? (
            <div className="space-y-4">
              <div className="bg-green-50 text-green-700 text-sm rounded-lg p-4">
                Если аккаунт с таким email существует, мы отправили на него ссылку
                для сброса пароля. Ссылка действует 1 час.
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  setSent(false)
                  setEmail('')
                }}
              >
                Отправить ещё раз
              </Button>
              <p className="text-center text-sm text-gray-500">
                <Link href="/login" className="text-blue-600 hover:underline font-medium">
                  Вернуться ко входу
                </Link>
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="mt-1"
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Отправить ссылку
              </Button>

              <p className="text-center text-sm text-gray-500">
                Вспомнили пароль?{' '}
                <Link href="/login" className="text-blue-600 hover:underline font-medium">
                  Войти
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
