import Anthropic from '@anthropic-ai/sdk'

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export interface ActivityContent {
  email?: {
    subject: string
    preheader: string
    bannerText: string
    headline: string
    bodyText: string
    ctaButtons: { text: string; url: string }[]
  }
  sms?: {
    text: string
  }
  push?: {
    title: string
    body: string
  }
  messenger?: {
    text: string
    buttons: { text: string }[]
  }
}

export interface GeneratedActivity {
  title: string
  date: string
  channels: string[]
  category: string
  content: ActivityContent
}

export async function generateCommunicationPlan(
  settings: {
    description: string
    services: string
    products: string
    newsletters: string
    categories: string
    channels: string
    businessFocus: string
    topProducts: string
  },
  rules: {
    category: string
    channel: string
    frequency: number
    days: string
    notes: string
  }[],
  startDate: Date,
  approvedActivityIds: string[]
): Promise<GeneratedActivity[]> {
  const endDate = new Date(startDate)
  endDate.setDate(endDate.getDate() + 13)

  const russianHolidays2026 = [
    '2026-01-01', '2026-01-02', '2026-01-03', '2026-01-04', '2026-01-05',
    '2026-01-06', '2026-01-07', '2026-01-08', '2026-02-23', '2026-03-09',
    '2026-05-01', '2026-05-04', '2026-05-11', '2026-06-12', '2026-11-04',
    '2026-12-31',
  ]

  const prompt = `Ты — эксперт по CRM и контент-маркетингу. Создай план коммуникаций на 2 недели для компании.

## Информация о компании:
- Описание: ${settings.description}
- Услуги: ${settings.services}
- Продукты: ${settings.products}
- Рассылки: ${settings.newsletters}
- Категории: ${settings.categories}
- Каналы: ${settings.channels}
- Бизнес-фокус: ${settings.businessFocus}
- Топ продукты: ${settings.topProducts}

## Правила коммуникаций:
${rules.map(r => `- Канал: ${r.channel}, Категория: ${r.category}, Частота: ${r.frequency} раз в неделю${r.notes ? ', Заметки: ' + r.notes : ''}`).join('\n')}

## Период планирования:
С ${startDate.toISOString().split('T')[0]} по ${endDate.toISOString().split('T')[0]}

## Российские праздники в этот период (если есть):
${russianHolidays2026.join(', ')}

## Правила составления расписания:
1. Максимум 2-3 коммуникации в день
2. Равномерное распределение по всей 2-недельной период
3. Для email предпочтительно вторник, среда, четверг
4. Избегай понедельник утром для важных рассылок
5. В выходные (суббота, воскресенье) — более лёгкие коммуникации (push, messenger)
6. В праздники — избегай email рассылок, только push если необходимо
7. Соблюдай частоту из правил коммуникаций
8. Создавай мультиканальные кампании (одна тема через несколько каналов в течение 1-2 дней)
9. Разнообразь категории коммуникаций

## ВАЖНО: Верни ТОЛЬКО валидный JSON массив без каких-либо пояснений, комментариев или markdown. Начни сразу с [ и заканчивай на ].

Формат каждого элемента:
{
  "title": "Название активности",
  "date": "YYYY-MM-DD",
  "channels": ["email"],
  "category": "промо",
  "content": {
    "email": {
      "subject": "Тема письма",
      "preheader": "Прехедер",
      "bannerText": "Текст баннера",
      "headline": "Заголовок",
      "bodyText": "Текст письма",
      "ctaButtons": [{"text": "Кнопка", "url": "#"}]
    }
  }
}

Для SMS используй: {"sms": {"text": "..."}}
Для push: {"push": {"title": "...", "body": "..."}}
Для messenger: {"messenger": {"text": "...", "buttons": [{"text": "..."}]}}

Создай 14-20 активностей на период.`

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8000,
    messages: [{ role: 'user', content: prompt }],
  })

  const content = message.content[0]
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude')
  }

  let jsonText = content.text.trim()
  // Extract JSON if wrapped in markdown
  const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (jsonMatch) {
    jsonText = jsonMatch[1].trim()
  }

  try {
    const activities = JSON.parse(jsonText)
    return activities
  } catch {
    // Try to find JSON array in the text
    const arrayMatch = jsonText.match(/\[[\s\S]*\]/)
    if (arrayMatch) {
      return JSON.parse(arrayMatch[0])
    }
    throw new Error('Failed to parse activities from Claude response')
  }
}

export async function generateActivityContent(
  activity: {
    title: string
    channels: string[]
    category: string
    date: string
  },
  settings: {
    description: string
    services: string
    products: string
    businessFocus: string
    topProducts: string
  }
): Promise<ActivityContent> {
  const channelInstructions: Record<string, string> = {
    email: `"email": {
      "subject": "цепляющая тема письма",
      "preheader": "короткий прехедер 50-90 символов",
      "bannerText": "текст для баннера/шапки письма",
      "headline": "главный заголовок в письме",
      "bodyText": "основной текст письма 150-300 слов",
      "ctaButtons": [{"text": "текст кнопки", "url": "#"}]
    }`,
    sms: `"sms": {
      "text": "SMS текст до 160 символов"
    }`,
    push: `"push": {
      "title": "заголовок push до 50 символов",
      "body": "текст push до 100 символов"
    }`,
    messenger: `"messenger": {
      "text": "текст сообщения в мессенджере 50-200 символов",
      "buttons": [{"text": "текст кнопки"}]
    }`,
  }

  const channelFormats = activity.channels
    .map(ch => channelInstructions[ch] || '')
    .filter(Boolean)
    .join(',\n')

  const prompt = `Создай детальный контент для маркетинговой коммуникации.

## О компании:
- Описание: ${settings.description}
- Услуги: ${settings.services}
- Продукты: ${settings.products}
- Бизнес-фокус: ${settings.businessFocus}
- Топ продукты: ${settings.topProducts}

## Активность:
- Название: ${activity.title}
- Категория: ${activity.category}
- Дата: ${activity.date}
- Каналы: ${activity.channels.join(', ')}

Создай профессиональный маркетинговый контент на русском языке.

Верни ТОЛЬКО валидный JSON объект в формате:
{
  ${channelFormats}
}`

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  })

  const content = message.content[0]
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude')
  }

  let jsonText = content.text.trim()
  const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (jsonMatch) {
    jsonText = jsonMatch[1].trim()
  }

  try {
    return JSON.parse(jsonText)
  } catch {
    const objMatch = jsonText.match(/\{[\s\S]*\}/)
    if (objMatch) {
      return JSON.parse(objMatch[0])
    }
    throw new Error('Failed to parse content from Claude response')
  }
}
