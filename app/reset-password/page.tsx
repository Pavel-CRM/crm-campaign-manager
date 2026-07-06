'use client'

import { Suspense, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token') || ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('Пароль должен быть не короче 6 символов')
      return
    }
    if (password !== confirm) {
      setError('Пароли не совпадают')
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Не удалось сбросить пароль')
        return
      }
      setDone(true)
      setTimeout(() => router.push('/login'), 2500)
    } catch {
      setError('Произошла ошибка. Попробуйте ещё раз.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="space-y-4">
        <div className="bg-red-50 text-red-600 text-sm rounded-lg p-4">
          Ссылка неполная или недействительная. Запросите сброс пароля заново.
        </div>
        <p className="text-center text-sm text-gray-500">
          <Link href="/forgot-password" className="text-blue-600 hover:underline font-medium">
            Запросить ссылку заново
          </Link>
        </p>
      </div>
    )
  }

  if (done) {
    return (
      <div className="space-y-4">
        <div className="bg-green-50 text-green-700 text-sm rounded-lg p-4">
          Пароль изменён. Сейчас переведём вас на страницу входа…
        </div>
        <p className="text-center text-sm text-gray-500">
          <Link href="/login" className="text-blue-600 hover:underline font-medium">
            Перейти ко входу
          </Link>
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="password">Новый пароль</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="confirm">Повторите пароль</Label>
        <Input
          id="confirm"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="••••••••"
          required
          className="mt-1"
        />
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm rounded-lg p-3">{error}</div>
      )}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
        Сохранить новый пароль
      </Button>
    </form>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 rounded-xl mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Новый пароль</h1>
            <p className="text-gray-500 mt-1">Задайте новый пароль для входа</p>
          </div>

          <Suspense fallback={<div className="text-center text-gray-400 text-sm">Загрузка…</div>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
