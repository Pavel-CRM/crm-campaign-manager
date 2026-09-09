#!/usr/bin/env bash
# Запускает скрипты работы с базой, временно подставляя DATABASE_URL из Vercel.
# Строка подключения нигде не сохраняется — временный файл удаляется сразу.
#
#   bash scripts/db.sh stats     # показать количество записей (без личных данных)
#   bash scripts/db.sh reset     # удалить всех пользователей и их данные
#   bash scripts/db.sh admin you@mail.ru  # выдать права админа
set -euo pipefail

export PATH="$HOME/.local/node22/bin:$PATH"
cd "$(dirname "$0")/.."

TMP_ENV="$(mktemp)"
trap 'rm -f "$TMP_ENV"' EXIT

echo "→ Получаю строку подключения из Vercel…"
npx --yes vercel env pull "$TMP_ENV" --environment production --yes >/dev/null 2>&1

DB="$(grep '^DATABASE_URL=' "$TMP_ENV" | head -1 | cut -d= -f2- | tr -d '"')"
rm -f "$TMP_ENV"
trap - EXIT

if [ -z "$DB" ]; then
  echo "❌ Не удалось получить DATABASE_URL. Проверьте вход: npx vercel login"
  exit 1
fi

case "${1:-stats}" in
  stats)
    DATABASE_URL="$DB" node scripts/db-stats.mjs
    ;;
  reset)
    DATABASE_URL="$DB" node scripts/reset-users.mjs --yes-delete-everything
    ;;
  admin)
    DATABASE_URL="$DB" node scripts/make-admin.mjs --email "${2:-}"
    ;;
  *)
    echo "Использование: bash scripts/db.sh [stats|reset|admin <email>]"
    exit 1
    ;;
esac
