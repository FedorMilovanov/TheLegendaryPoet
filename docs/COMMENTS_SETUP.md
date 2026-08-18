# Общие оценки и комментарии

Интерфейс работает и без backend: тогда данные остаются локально в текущем браузере. Общая база использует Supabase, но **браузер больше не имеет права вызывать mutation-RPC напрямую**.

Публичные чтения идут через ограниченные views. Любая запись проходит по цепочке:

`браузер → анонимная сессия Supabase Auth → community-write Edge Function → service-only RPC → Postgres`.

Для создания анонимной сессии Supabase Auth регистрация, email, пароль и профиль читателю не нужны. Анонимная сессия Supabase Auth выдаёт серверный user id/JWT; именно этот проверенный id, а не случайный UUID из localStorage, является actor authority для общей базы.

## Первичное подключение

1. Создайте проект Supabase.
2. В **Authentication → Providers / Anonymous Sign-Ins** включите anonymous sign-ins.
3. В **SQL Editor** выполните [`docs/community-schema.sql`](./community-schema.sql). Для уже существующего проекта примените миграцию `supabase/migrations/20260819010000_community_authority.sql`.
4. Разверните Edge Function `community-write` из `supabase/functions/community-write/index.ts` с конфигурацией из `supabase/config.toml`.
5. Создайте секрет функции `COMMUNITY_ABUSE_SECRET`: криптографически случайное значение не короче 32 символов. Он используется только на сервере для HMAC сетевого anti-abuse ключа и никогда не попадает в клиент.
6. В GitHub Actions Variables задайте:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY` (или публичный ключ проекта, совместимый с текущим frontend contract)
7. Запустите production build/deploy. `prebuild` генерирует `/community-targets.json` из канонических данных Product; Edge Function принимает запись только для target, присутствующего в этом manifest.

## Защитная модель

- Браузер не передаёт `voter_id`, `actor_id`, IP hash или иной идентификатор, который мог бы объявить собственной серверной личностью.
- Edge Function проверяет bearer JWT через Supabase Auth и сам получает server-issued actor id.
- Edge Function берёт client IP из gateway `x-forwarded-for`, преобразует его HMAC-SHA256 с серверным `COMMUNITY_ABUSE_SECRET` и передаёт в БД только keyed pseudonymous hash, а не сырой IP.
- Postgres атомарно ограничивает частоту rating/comment/helpful операций по сетевому ключу. Поэтому простая очистка localStorage или создание новой анонимной Auth-сессии не обнуляет сетевой budget.
- Один actor имеет одну активную оценку на target и одну helpful-отметку на комментарий.
- Target authority берётся не из тела запроса: Edge Function сверяет `target_type + target_id` с release-derived `/community-targets.json`. Неизвестные target fail closed.
- Старые публичные mutation-RPC удаляются. Новые `*_server` функции доступны только `service_role`.
- Таблицы ratings/comments/votes/abuse-buckets не дают `anon`/`authenticated` прямых `insert/update/delete`.
- Публичные views не раскрывают actor id, legacy device UUID или network hash.

Случайный `tlp-community-device-v1` остаётся только как совместимость локального v3 outbox до установления доверенной Auth-сессии. Hardened transport его **не отправляет**; после успешного сохранения Auth-сессии ключ удаляется.

## Дополнительное усиление

Если позже понадобится CAPTCHA/Turnstile, её нужно вводить как отдельную end-to-end транзакцию: frontend challenge token → Supabase Auth anonymous signup verification → browser QA. Просто включить CAPTCHA в Dashboard без передачи challenge token текущим клиентом нельзя. Текущая базовая защита не зависит от этого optional слоя: Auth actor, platform anonymous-signup limits, Edge authority и Postgres network budgets работают самостоятельно.

## Модерация

Скрыть комментарий:

```sql
update public.tlp_comments set status='hidden' where id='comment-id';
```

Вернуть:

```sql
update public.tlp_comments set status='published' where id='comment-id';
```

Рутинная operator/moderation панель остаётся отдельной product-quality задачей; для security boundary прямой доступ читателя к таблицам не требуется.
