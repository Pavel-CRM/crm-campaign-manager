// Отправка письма со ссылкой на сброс пароля.
// Если задан RESEND_API_KEY — письмо уходит через Resend.
// Ссылка всегда пишется в серверный лог, чтобы владелец проекта мог
// восстановить доступ по логам Vercel, даже когда почта ещё не настроена.

type Result =
  | { delivered: true }
  | { delivered: false; reason: 'no_email_provider' | 'send_failed' }

export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string
): Promise<Result> {
  // Маркер для поиска в логах Vercel: Runtime Logs → фильтр "password-reset".
  console.log(`[password-reset] Ссылка для ${email}: ${resetUrl}`)

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return { delivered: false, reason: 'no_email_provider' }
  }

  const from = process.env.RESET_EMAIL_FROM || 'onboarding@resend.dev'
  const html = `
    <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 480px; margin: 0 auto; color: #111827;">
      <h2 style="font-size: 20px;">Восстановление пароля</h2>
      <p>Вы запросили сброс пароля в сервисе «CRM Коммуникации». Нажмите кнопку ниже, чтобы задать новый пароль:</p>
      <p style="margin: 24px 0;">
        <a href="${resetUrl}" style="background: #2563eb; color: #fff; text-decoration: none; padding: 12px 20px; border-radius: 10px; display: inline-block;">Сбросить пароль</a>
      </p>
      <p style="color: #6b7280; font-size: 14px;">Ссылка действует 1 час. Если вы не запрашивали сброс — просто проигнорируйте это письмо, ваш пароль останется прежним.</p>
    </div>`

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `CRM Коммуникации <${from}>`,
        to: [email],
        subject: 'Восстановление пароля',
        html,
      }),
    })
    if (!res.ok) {
      console.error('[password-reset] Resend вернул ошибку:', await res.text())
      return { delivered: false, reason: 'send_failed' }
    }
    return { delivered: true }
  } catch (e) {
    console.error('[password-reset] Ошибка отправки письма:', e)
    return { delivered: false, reason: 'send_failed' }
  }
}
