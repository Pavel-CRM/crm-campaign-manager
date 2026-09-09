// Показывает ТОЛЬКО количество записей в базе — без email, имён и любых
// персональных данных. Нужен, чтобы понять, что будет затронуто перед сбросом.
//
//   node scripts/db-stats.mjs

import { PrismaClient } from '@prisma/client'

if (!process.env.DATABASE_URL) {
  console.error('❌ Не задан DATABASE_URL.')
  process.exit(1)
}

const prisma = new PrismaClient()

const [users, admins, orgs, settings, rules, activities, payments] = await Promise.all([
  prisma.user.count(),
  prisma.user.count({ where: { isAdmin: true } }),
  prisma.organization.count(),
  prisma.orgSettings.count(),
  prisma.communicationRule.count(),
  prisma.activity.count(),
  prisma.payment.count(),
])

console.log('\nСодержимое базы (только количества):\n')
console.log(`  Пользователи:            ${users}  (из них админов: ${admins})`)
console.log(`  Организации:             ${orgs}`)
console.log(`  Настройки организаций:   ${settings}`)
console.log(`  Правила коммуникаций:    ${rules}`)
console.log(`  Активности в календаре:  ${activities}`)
console.log(`  Записи о платежах:       ${payments}`)
console.log('')

if (payments > 0) {
  console.log('⚠️  Есть записи о платежах — сброс удалит и их (история оплат ЮKassa).\n')
}

await prisma.$disconnect()
