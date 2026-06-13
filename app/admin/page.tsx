'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

interface UserData {
  id: string
  email: string
  name: string | null
  createdAt: string
  trialEndsAt: string | null
  subscriptionStatus: string
  subscriptionPlan: string | null
  subscriptionEndsAt: string | null
  isAdmin: boolean
  payments: {
    id: string
    plan: string
    amount: number
    status: string
    periodStart: string | null
    periodEnd: string | null
    createdAt: string
  }[]
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  trial: { label: 'Пробный', color: 'bg-blue-500/20 text-blue-300' },
  active: { label: 'Активна', color: 'bg-green-500/20 text-green-300' },
  expired: { label: 'Истекла', color: 'bg-red-500/20 text-red-300' },
  lifetime: { label: 'Безлимит', color: 'bg-purple-500/20 text-purple-300' },
}

const PLAN_LABELS: Record<string, string> = {
  monthly: 'Ежемесячная',
  annual: 'Годовая',
  lifetime: 'Безлимит',
}

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [editUser, setEditUser] = useState<UserData | null>(null)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [editForm, setEditForm] = useState({
    subscriptionStatus: '',
    subscriptionPlan: '',
    subscriptionEndsAt: '',
    isAdmin: false,
  })

  useEffect(() => {
    if (status === 'loading') return
    if (!session?.user?.isAdmin) {
      router.push('/')
      return
    }
    fetchUsers()
  }, [session, status, router])

  const fetchUsers = async () => {
    setLoading(true)
    const res = await fetch('/api/admin/users')
    const data = await res.json()
    setUsers(data)
    setLoading(false)
  }

  const openEdit = (user: UserData) => {
    setEditUser(user)
    setEditForm({
      subscriptionStatus: user.subscriptionStatus,
      subscriptionPlan: user.subscriptionPlan || '',
      subscriptionEndsAt: user.subscriptionEndsAt
        ? new Date(user.subscriptionEndsAt).toISOString().slice(0, 10)
        : '',
      isAdmin: user.isAdmin,
    })
  }

  const saveEdit = async () => {
    if (!editUser) return
    setSaving(true)
    try {
      const body: Record<string, unknown> = {
        subscriptionStatus: editForm.subscriptionStatus,
        isAdmin: editForm.isAdmin,
      }

      if (editForm.subscriptionStatus !== 'lifetime') {
        body.subscriptionPlan = editForm.subscriptionPlan || null
        body.subscriptionEndsAt = editForm.subscriptionEndsAt || null
      }

      const res = await fetch(`/api/admin/users/${editUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error()
      await fetchUsers()
      setEditUser(null)
    } catch {
      alert('Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  const setLifetime = async (userId: string) => {
    await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscriptionStatus: 'lifetime' }),
    })
    fetchUsers()
  }

  const filtered = users.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.name || '').toLowerCase().includes(search.toLowerCase())
  )

  const stats = {
    total: users.length,
    trial: users.filter(u => u.subscriptionStatus === 'trial').length,
    active: users.filter(u => u.subscriptionStatus === 'active').length,
    lifetime: users.filter(u => u.subscriptionStatus === 'lifetime').length,
    expired: users.filter(u => u.subscriptionStatus === 'expired').length,
    revenue: users.flatMap(u => u.payments).filter(p => p.status === 'succeeded').reduce((s, p) => s + p.amount, 0),
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/')} className="text-gray-400 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h1 className="text-lg font-semibold">Панель администратора</h1>
          </div>
          <span className="text-xs text-gray-500">{session?.user?.email}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          {[
            { label: 'Всего', value: stats.total, color: 'text-white' },
            { label: 'Пробный', value: stats.trial, color: 'text-blue-400' },
            { label: 'Активных', value: stats.active, color: 'text-green-400' },
            { label: 'Безлимит', value: stats.lifetime, color: 'text-purple-400' },
            { label: 'Истекло', value: stats.expired, color: 'text-red-400' },
            { label: 'Выручка', value: `${stats.revenue.toLocaleString('ru')} ₽`, color: 'text-yellow-400' },
          ].map(s => (
            <div key={s.label} className="bg-gray-900 rounded-xl p-4 border border-gray-800">
              <div className="text-xs text-gray-500 mb-1">{s.label}</div>
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Поиск по email или имени..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 w-full max-w-sm text-sm focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Table */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-3 text-left">Пользователь</th>
                <th className="px-4 py-3 text-left">Статус</th>
                <th className="px-4 py-3 text-left">Тариф</th>
                <th className="px-4 py-3 text-left">Действует до</th>
                <th className="px-4 py-3 text-left">Платежи</th>
                <th className="px-4 py-3 text-left">Зарегистрирован</th>
                <th className="px-4 py-3 text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filtered.map(user => {
                const statusInfo = STATUS_LABELS[user.subscriptionStatus] || STATUS_LABELS.expired
                const successPayments = user.payments.filter(p => p.status === 'succeeded')
                const totalPaid = successPayments.reduce((s, p) => s + p.amount, 0)

                return (
                  <tr key={user.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-white">{user.name || '—'}</div>
                      <div className="text-gray-500 text-xs">{user.email}</div>
                      {user.isAdmin && (
                        <span className="text-xs text-purple-400 font-medium">admin</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-300">
                      {user.subscriptionPlan ? PLAN_LABELS[user.subscriptionPlan] || user.subscriptionPlan : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-300">
                      {user.subscriptionStatus === 'lifetime' ? (
                        <span className="text-purple-400">∞</span>
                      ) : user.subscriptionStatus === 'trial' ? (
                        user.trialEndsAt
                          ? format(new Date(user.trialEndsAt), 'd MMM yyyy', { locale: ru })
                          : '—'
                      ) : user.subscriptionEndsAt ? (
                        format(new Date(user.subscriptionEndsAt), 'd MMM yyyy', { locale: ru })
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-white">{successPayments.length} оплат</div>
                      {totalPaid > 0 && (
                        <div className="text-xs text-gray-500">{totalPaid.toLocaleString('ru')} ₽</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {format(new Date(user.createdAt), 'd MMM yyyy', { locale: ru })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {user.subscriptionStatus !== 'lifetime' && (
                          <button
                            onClick={() => setLifetime(user.id)}
                            title="Безлимитная подписка"
                            className="p-1.5 text-purple-400 hover:bg-purple-500/20 rounded-lg transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                            </svg>
                          </button>
                        )}
                        <button
                          onClick={() => openEdit(user)}
                          className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-500">Пользователи не найдены</div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editUser && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-white mb-1">Редактировать подписку</h3>
            <p className="text-gray-400 text-sm mb-6">{editUser.email}</p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Статус подписки</label>
                <select
                  value={editForm.subscriptionStatus}
                  onChange={e => setEditForm({ ...editForm, subscriptionStatus: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="trial">Пробный период</option>
                  <option value="active">Активная</option>
                  <option value="expired">Истекла</option>
                  <option value="lifetime">Безлимитная ♾️</option>
                </select>
              </div>

              {editForm.subscriptionStatus !== 'lifetime' && (
                <>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Тариф</label>
                    <select
                      value={editForm.subscriptionPlan}
                      onChange={e => setEditForm({ ...editForm, subscriptionPlan: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                    >
                      <option value="">— не задан —</option>
                      <option value="monthly">Ежемесячная (1 500 ₽)</option>
                      <option value="annual">Годовая (10 800 ₽)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Действует до</label>
                    <input
                      type="date"
                      value={editForm.subscriptionEndsAt}
                      onChange={e => setEditForm({ ...editForm, subscriptionEndsAt: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </>
              )}

              <div className="flex items-center gap-3 bg-gray-800 rounded-lg px-3 py-2.5">
                <input
                  type="checkbox"
                  id="isAdmin"
                  checked={editForm.isAdmin}
                  onChange={e => setEditForm({ ...editForm, isAdmin: e.target.checked })}
                  className="w-4 h-4 accent-purple-500"
                />
                <label htmlFor="isAdmin" className="text-sm text-gray-300">Права администратора</label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditUser(null)}
                className="flex-1 py-2.5 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 transition-colors text-sm"
              >
                Отмена
              </button>
              <button
                onClick={saveEdit}
                disabled={saving}
                className="flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium transition-colors text-sm"
              >
                {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
