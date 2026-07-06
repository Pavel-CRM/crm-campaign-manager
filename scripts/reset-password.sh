#!/usr/bin/env bash
# Безопасный сброс пароля: тянет DATABASE_URL из Vercel во временный файл,
# сбрасывает пароль и сразу удаляет файл. Ни пароль, ни секреты не остаются на диске.
#
# Использование:
#   bash scripts/reset-password.sh --list                       # показать все учётки
#   bash scripts/reset-password.sh you@example.com              # сброс на случайный пароль
#   bash scripts/reset-password.sh you@example.com "новыйПароль" # сброс на свой пароль
set -euo pipefail

export PATH="$HOME/.local/node22/bin:$PATH"
cd "$(dirname "$0")/.."

TMP_ENV="$(mktemp)"
trap 'rm -f "$TMP_ENV"' EXIT

echo "→ Получаю строку подключения к БД из Vercel…"
npx --yes vercel env pull "$TMP_ENV" --environment production --yes >/dev/null 2>&1

DATABASE_URL="$(grep '^DATABASE_URL=' "$TMP_ENV" | head -1 | cut -d= -f2- | tr -d '"')"
rm -f "$TMP_ENV"
trap - EXIT

if [ -z "$DATABASE_URL" ]; then
  echo "❌ Не удалось получить DATABASE_URL. Проверьте, что вы залогинены в Vercel (npx vercel login)."
  exit 1
fi

if [ "${1:-}" = "--list" ]; then
  DATABASE_URL="$DATABASE_URL" node scripts/reset-password.mjs --list
  exit 0
fi

EMAIL="${1:-}"
if [ -z "$EMAIL" ]; then
  echo "Укажите email:  bash scripts/reset-password.sh you@example.com"
  exit 1
fi

if [ -n "${2:-}" ]; then
  DATABASE_URL="$DATABASE_URL" node scripts/reset-password.mjs --email "$EMAIL" --password "$2"
else
  DATABASE_URL="$DATABASE_URL" node scripts/reset-password.mjs --email "$EMAIL"
fi
