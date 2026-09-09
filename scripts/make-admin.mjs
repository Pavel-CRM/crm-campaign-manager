// Выдаёт пользователю права администратора и статус «Безлимит».
//   node scripts/make-admin.mjs --email you@example.com

import { PrismaClient } from '@prisma/client'

const idx = process.argv.indexOf('--email')
const email = idx !== -1 ? String(process.argv[idx + 1] || '').trim().toLowerCase() : ''

if (!process.env.DATABASE_URL) {
  console.error('❌ Не задан DATABASE_URL.')
  process.exit(1)
}
if (!email) {
  console.error('Укажите --email you@example.com')
  process.exit(1)
}

const prisma = new PrismaClient()

const user = await prisma.user.findFirst({
  where: { email: { equals: email, mode: 'insensitive' } },
})

if (!user) {
  console.error(`❌ Пользователь ${email} не найден. Сначала зарегистрируйтесь на сайте.`)
  process.exit(1)
}

await prisma.user.update({
  where: { id: user.id },
  data: {
    isAdmin: true,
    subscriptionStatus: 'lifetime',
    subscriptionPlan: 'lifetime',
    trialEndsAt: null,
    subscriptionEndsAt: null,
  },
})

console.log(`\n✅ ${user.email}: выданы права администратора и статус «Безлимит».`)
console.log('   Перезайдите в аккаунт, чтобы изменения подхватились.\n')

await prisma.$disconnect()
