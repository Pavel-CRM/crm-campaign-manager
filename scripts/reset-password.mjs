// Утилита восстановления доступа к аккаунту.
// Читает DATABASE_URL из окружения (ничего не хранит), работает только с вашей БД.
//
// Показать все учётные записи:
//   node scripts/reset-password.mjs --list
//
// Сбросить пароль (если пароль не указан — сгенерируется случайный и напечатается):
//   node scripts/reset-password.mjs --email you@example.com
//   node scripts/reset-password.mjs --email you@example.com --password "мойНовыйПароль"

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, cur, i, arr) => {
    if (cur.startsWith("--")) acc.push([cur.slice(2), arr[i + 1]?.startsWith("--") ? true : arr[i + 1]]);
    return acc;
  }, [])
);

if (!process.env.DATABASE_URL) {
  console.error("❌ Не задан DATABASE_URL. Запустите скрипт с переменной окружения DATABASE_URL.");
  process.exit(1);
}

const prisma = new PrismaClient();

function genPassword() {
  // 12 символов из безопасного алфавита, без похожих 0/O/1/l
  const alphabet = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(12);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

async function main() {
  if ("list" in args) {
    const users = await prisma.user.findMany({
      select: {
        email: true,
        name: true,
        isAdmin: true,
        subscriptionStatus: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });
    console.log(`\nВсего учётных записей: ${users.length}\n`);
    for (const u of users) {
      console.log(
        `• ${u.email}${u.name ? ` (${u.name})` : ""} — статус: ${u.subscriptionStatus}${u.isAdmin ? ", админ" : ""}, создан ${u.createdAt.toISOString().slice(0, 10)}`
      );
    }
    console.log("");
    return;
  }

  const email = typeof args.email === "string" ? args.email.trim().toLowerCase() : "";
  if (!email) {
    console.error("Укажите --email you@example.com  (или --list чтобы увидеть все учётки)");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`❌ Пользователь с email ${email} не найден. Запустите с --list, чтобы увидеть все учётки.`);
    process.exit(1);
  }

  const generated = typeof args.password !== "string";
  const newPassword = generated ? genPassword() : args.password;
  const hash = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({ where: { email }, data: { password: hash } });

  console.log(`\n✅ Пароль для ${email} обновлён.`);
  if (generated) {
    console.log(`\n   Временный пароль: ${newPassword}\n`);
    console.log("   Войдите с ним и при желании смените пароль позже.");
  } else {
    console.log("   Используйте пароль, который вы указали.\n");
  }
}

main()
  .catch((e) => {
    console.error("Ошибка:", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
