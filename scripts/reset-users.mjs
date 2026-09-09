// ОПАСНО: удаляет ВСЕХ пользователей и все связанные с ними данные —
// организации, настройки, правила коммуникаций, активности календаря
// и записи о платежах ЮKassa. Отменить нельзя.
//
// Сначала посмотрите, что будет удалено:
//   node scripts/db-stats.mjs
//
// Затем запустите с явным подтверждением:
//   node scripts/reset-users.mjs --yes-delete-everything

import { PrismaClient } from '@prisma/client'

if (!process.env.DATABASE_URL) {
  console.error('❌ Не задан DATABASE_URL.')
  process.exit(1)
}

if (!process.argv.includes('--yes-delete-everything')) {
  console.error(
    '\n⚠️  Это удалит ВСЕХ пользователей и все их данные (кампании, настройки, платежи).\n' +
      '   Если вы уверены, запустите:\n\n' +
      '   node scripts/reset-users.mjs --yes-delete-everything\n'
  )
  process.exit(1)
}

const prisma = new PrismaClient()

const before = {
  users: await prisma.user.count(),
  orgs: await prisma.organization.count(),
  activities: await prisma.activity.count(),
  payments: await prisma.payment.count(),
}

console.log('\nБудет удалено:')
console.log(`  пользователей: ${before.users}, организаций: ${before.orgs},`)
console.log(`  активностей: ${before.activities}, платежей: ${before.payments}\n`)

// Порядок важен: сначала записи, ссылающиеся на другие таблицы.
const activities = await prisma.activity.deleteMany({})
const rules = await prisma.communicationRule.deleteMany({})
const settings = await prisma.orgSettings.deleteMany({})
const orgs = await prisma.organization.deleteMany({})
const payments = await prisma.payment.deleteMany({})
const users = await prisma.user.deleteMany({})

console.log('✅ Удалено:')
console.log(`   активности: ${activities.count}`)
console.log(`   правила: ${rules.count}`)
console.log(`   настройки организаций: ${settings.count}`)
console.log(`   организации: ${orgs.count}`)
console.log(`   платежи: ${payments.count}`)
console.log(`   пользователи: ${users.count}`)
console.log('\nТеперь зарегистрируйтесь заново на https://crm-campaign-manager.vercel.app/register\n')

await prisma.$disconnect()
