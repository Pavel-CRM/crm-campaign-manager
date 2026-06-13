'use client'

import Link from 'next/link'

interface Props {
  status: string
  plan: string | null
  trialDaysLeft: number | null
}

export function SubscriptionBadge({ status, plan, trialDaysLeft }: Props) {
  if (status === 'lifetime') {
    return (
      <div className="flex items-center gap-2 px-2 py-1.5 bg-purple-500/20 rounded-lg">
        <span className="text-purple-300 text-xs">♾️ Безлимитная</span>
      </div>
    )
  }

  if (status === 'active') {
    const planLabel = plan === 'annual' ? 'Годовая' : 'Ежемесячная'
    return (
      <div className="flex items-center gap-2 px-2 py-1.5 bg-green-500/20 rounded-lg">
        <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
        <span className="text-green-300 text-xs">{planLabel} подписка</span>
      </div>
    )
  }

  if (status === 'trial') {
    const color = (trialDaysLeft ?? 0) > 3 ? 'blue' : 'orange'
    return (
      <Link href="/subscribe" className="block">
        <div className={`flex items-center gap-2 px-2 py-1.5 ${
          color === 'blue' ? 'bg-blue-500/20' : 'bg-orange-500/20'
        } rounded-lg hover:opacity-80 transition-opacity`}>
          <div className={`w-1.5 h-1.5 rounded-full ${color === 'blue' ? 'bg-blue-400' : 'bg-orange-400'}`} />
          <span className={`text-xs ${color === 'blue' ? 'text-blue-300' : 'text-orange-300'}`}>
            Пробный · {trialDaysLeft} дн.
          </span>
        </div>
      </Link>
    )
  }

  return (
    <Link href="/subscribe" className="block">
      <div className="flex items-center gap-2 px-2 py-1.5 bg-red-500/20 rounded-lg hover:opacity-80">
        <span className="text-red-300 text-xs">Подписка истекла</span>
      </div>
    </Link>
  )
}
