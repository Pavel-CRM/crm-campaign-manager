import { randomUUID } from 'crypto'

const YOOKASSA_SHOP_ID = process.env.YOOKASSA_SHOP_ID!
const YOOKASSA_SECRET_KEY = process.env.YOOKASSA_SECRET_KEY!
const BASE_URL = 'https://api.yookassa.ru/v3'

export const PLANS = {
  monthly: {
    label: 'Ежемесячная',
    amount: 1500,
    description: 'Подписка на 1 месяц — 1 500 ₽',
    durationDays: 30,
  },
  annual: {
    label: 'Годовая',
    amount: 10800,
    description: 'Подписка на 12 месяцев — 10 800 ₽ (900 ₽/мес)',
    durationDays: 365,
  },
}

function getAuthHeader() {
  const credentials = Buffer.from(`${YOOKASSA_SHOP_ID}:${YOOKASSA_SECRET_KEY}`).toString('base64')
  return `Basic ${credentials}`
}

export async function createPayment({
  userId,
  plan,
  returnUrl,
}: {
  userId: string
  plan: 'monthly' | 'annual'
  returnUrl: string
}) {
  const planInfo = PLANS[plan]
  const idempotenceKey = randomUUID()

  const body = {
    amount: {
      value: planInfo.amount.toFixed(2),
      currency: 'RUB',
    },
    capture: true,
    confirmation: {
      type: 'redirect',
      return_url: returnUrl,
    },
    description: planInfo.description,
    save_payment_method: true,
    metadata: {
      userId,
      plan,
    },
  }

  const response = await fetch(`${BASE_URL}/payments`, {
    method: 'POST',
    headers: {
      'Authorization': getAuthHeader(),
      'Content-Type': 'application/json',
      'Idempotence-Key': idempotenceKey,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`YooKassa error: ${response.status} ${error}`)
  }

  return response.json()
}

export async function getPayment(paymentId: string) {
  const response = await fetch(`${BASE_URL}/payments/${paymentId}`, {
    headers: {
      'Authorization': getAuthHeader(),
    },
  })

  if (!response.ok) {
    throw new Error(`YooKassa error: ${response.status}`)
  }

  return response.json()
}

export function isSubscriptionActive(user: {
  subscriptionStatus: string
  trialEndsAt: Date | null
  subscriptionEndsAt: Date | null
}): boolean {
  const now = new Date()

  if (user.subscriptionStatus === 'lifetime') return true

  if (user.subscriptionStatus === 'trial') {
    return user.trialEndsAt ? user.trialEndsAt > now : false
  }

  if (user.subscriptionStatus === 'active') {
    return user.subscriptionEndsAt ? user.subscriptionEndsAt > now : false
  }

  return false
}

export function getSubscriptionInfo(user: {
  subscriptionStatus: string
  subscriptionPlan: string | null
  trialEndsAt: Date | null
  subscriptionEndsAt: Date | null
}) {
  const now = new Date()

  if (user.subscriptionStatus === 'lifetime') {
    return { label: 'Безлимитная', color: 'purple', expiresAt: null }
  }

  if (user.subscriptionStatus === 'trial') {
    const daysLeft = user.trialEndsAt
      ? Math.ceil((user.trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : 0
    return {
      label: `Пробный период (${daysLeft} дн.)`,
      color: daysLeft > 3 ? 'blue' : 'orange',
      expiresAt: user.trialEndsAt,
    }
  }

  if (user.subscriptionStatus === 'active') {
    const plan = user.subscriptionPlan === 'annual' ? 'Годовая' : 'Ежемесячная'
    return { label: plan, color: 'green', expiresAt: user.subscriptionEndsAt }
  }

  return { label: 'Истекла', color: 'red', expiresAt: null }
}
