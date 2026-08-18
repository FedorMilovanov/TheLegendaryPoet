# Общие оценки и комментарии

Публичный сайт остаётся статическим на GitHub Pages. Общие оценки и комментарии обслуживаются отдельным бесплатным Cloudflare-контуром:

`браузер → Cloudflare Worker → D1`

Turnstile используется только для выпуска долговременной анонимной серверной сессии участника. После этого очередь браузера может безопасно повторять записи после временного офлайна, не сохраняя одноразовые Turnstile-токены.

## Почему не доверяем UUID браузера

Локальный `tlp-community-device-v1` остаётся только частью устойчивости текущего браузера и outbox. Он не является доказательством личности и никогда не передаётся Worker как серверная authority.

Worker сам:

- проверяет Turnstile через Siteverify;
- создаёт случайный actor ID и подписывает сессию HMAC-секретом;
- получает адрес соединения из `CF-Connecting-IP`, HMAC-хэширует его отдельным секретом и хранит только 64-символьный hash;
- проверяет, что target действительно существует в release-generated `community-targets.json`;
- применяет сетевые rate budgets;
- пишет в D1 через prepared statements.

Ни actor ID, ни network hash не доступны в публичных read endpoints.

## Бесплатный Cloudflare-контур

Нужны три ресурса в одном Cloudflare-аккаунте:

1. D1 database `the-legendary-poet-community`.
2. Worker `the-legendary-poet-community`.
3. Turnstile Managed widget для `thelegendarypoet.ru` и `www.thelegendarypoet.ru`.

Карта для создания этих Free-ресурсов не является частью нашей архитектурной процедуры. Не переходите на Paid/Upgrade ради этого контура.

## Настройка без секретов в GitHub

Полная инструкция и security invariants находятся в [`workers/community-api/README.md`](../workers/community-api/README.md).

В GitHub Actions нужны только публичные variables:

- `COMMUNITY_API_URL` — HTTPS URL развернутого Worker;
- `TURNSTILE_SITE_KEY` — публичный sitekey Turnstile.

Секреты `COMMUNITY_SESSION_SECRET`, `COMMUNITY_NETWORK_SECRET` и `TURNSTILE_SECRET` должны находиться только в Cloudflare Worker secret store. Они не должны попадать в `VITE_*`, git, GitHub Variables, JS bundle, логи или комментарии PR.

## Локальный режим и отказоустойчивость

Пока `COMMUNITY_API_URL` не настроен, community работает в честном локальном режиме: действия принадлежат текущему браузеру.

При подключённом Worker локальный v3 outbox остаётся атомарным. Если сеть, Worker, D1 или Turnstile временно недоступны, запись не объявляется синхронизированной: она остаётся в очереди и повторяется позже. Публичный корпус комментариев при этом не копируется целиком в localStorage.

## Модерация

Скрытие комментария — административная операция в D1:

```sql
UPDATE tlp_comments SET status = 'hidden' WHERE id = 'comment-id';
```

Возврат:

```sql
UPDATE tlp_comments SET status = 'published' WHERE id = 'comment-id';
```

Публичный endpoint выдаёт только `status = 'published'`.
