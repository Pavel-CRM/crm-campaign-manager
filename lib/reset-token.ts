import { createHmac, randomBytes, timingSafeEqual } from 'crypto'

// Самоподписанный токен сброса пароля без отдельной таблицы в БД.
// Ключ подписи = NEXTAUTH_SECRET + текущий хэш пароля пользователя.
// Как только пароль меняется, хэш меняется — и старый токен становится
// недействительным (одноразовость). Срок жизни — 1 час.

const TTL_MS = 60 * 60 * 1000

function signingKey(passwordHash: string): string {
  const secret = process.env.NEXTAUTH_SECRET || 'dev-secret-change-me'
  return `${secret}:${passwordHash}`
}

interface Payload {
  uid: string
  exp: number
  n: string
}

export function createResetToken(userId: string, passwordHash: string): string {
  const payload: Payload = {
    uid: userId,
    exp: Date.now() + TTL_MS,
    n: randomBytes(8).toString('hex'),
  }
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = createHmac('sha256', signingKey(passwordHash)).update(body).digest('base64url')
  return `${body}.${sig}`
}

/** Достаёт userId из токена БЕЗ проверки подписи — чтобы найти пользователя и его хэш. */
export function parseUserId(token: string): string | null {
  try {
    const body = token.split('.')[0]
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString()) as Payload
    return typeof payload.uid === 'string' ? payload.uid : null
  } catch {
    return null
  }
}

/** Проверяет подпись (по текущему хэшу пароля) и срок действия. */
export function verifyResetToken(token: string, passwordHash: string): boolean {
  try {
    const [body, sig] = token.split('.')
    if (!body || !sig) return false
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString()) as Payload
    if (!payload.uid || !payload.exp || Date.now() > payload.exp) return false
    const expected = createHmac('sha256', signingKey(passwordHash)).update(body).digest('base64url')
    const a = Buffer.from(sig)
    const b = Buffer.from(expected)
    if (a.length !== b.length) return false
    return timingSafeEqual(a, b)
  } catch {
    return false
  }
}
