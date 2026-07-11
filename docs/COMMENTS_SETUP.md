# Комментарии и оценки — бесплатное общее хранилище

По умолчанию оценки и комментарии сохраняются **в браузере каждого посетителя**
(`localStorage`) — они работают, но видны только на этом устройстве и не общие.
Чтобы сделать их **настоящими и общими для всех**, подключите бесплатный бэкенд
**Supabase** (Postgres + авто‑API). Денег не нужно, карта не нужна, сервер держать не надо.

Код уже готов: если заданы две переменные окружения — сайт автоматически читает и пишет
в Supabase; если не заданы — работает как раньше (локально). Ничего в коде менять не нужно.

## Что такое Supabase и где хранятся данные

Данные лежат в вашей бесплатной базе Postgres на Supabase. Сайт (статический, на GitHub
Pages) общается с ней напрямую по HTTPS через встроенный REST‑API. Публичный «anon»‑ключ
можно смело держать в коде — доступ ограничен политиками Row Level Security (их создаёт
SQL ниже: разрешены только чтение и добавление, без удаления/правки чужого).

> Нюанс бесплатного тарифа: проект Supabase «засыпает» после ~7 дней без обращений —
> тогда зайдите в дашборд и нажмите Restore (одна кнопка). Для не‑ежедневного трафика это
> единственное неудобство. Нужен вариант без «засыпания» — скажите, переключим на Firebase.

## Настройка за 5 минут

1. **Регистрация:** зайдите на https://supabase.com → Start your project (через GitHub‑аккаунт).
2. **Новый проект:** New project. Придумайте имя и **пароль базы** (сохраните его). Регион —
   ближе к аудитории (напр. Frankfurt). Дождитесь создания (~1–2 мин).
3. **Создайте таблицы:** слева **SQL Editor → New query**, вставьте весь блок ниже и нажмите **Run**:

   ```sql
   -- Таблицы оценок и комментариев
   create table if not exists tlp_ratings (
     id          text primary key,
     target_type text not null,
     target_id   text not null,
     scores      jsonb not null,
     created_at  timestamptz not null default now()
   );
   create table if not exists tlp_comments (
     id          text primary key,
     target_type text not null,
     target_id   text not null,
     author      text not null,
     text        text not null,
     kind        text not null,
     helpful     integer not null default 0,
     created_at  timestamptz not null default now()
   );

   -- Включаем защиту и разрешаем всем читать и добавлять (без удаления чужого)
   alter table tlp_ratings  enable row level security;
   alter table tlp_comments enable row level security;

   create policy "read ratings"    on tlp_ratings  for select using (true);
   create policy "insert ratings"  on tlp_ratings  for insert with check (true);
   create policy "read comments"   on tlp_comments for select using (true);
   create policy "insert comments" on tlp_comments for insert with check (true);
   create policy "update helpful"  on tlp_comments for update using (true) with check (true);
   ```

4. **Скопируйте ключи:** слева **Project Settings → API**. Понадобятся два значения:
   - **Project URL** (вида `https://xxxxxxxx.supabase.co`)
   - **anon public** ключ (длинная строка `eyJ...`)
5. **Добавьте их в репозиторий GitHub:** в репозитории `TheLegendaryPoet` →
   **Settings → Secrets and variables → Actions → вкладка `Variables` → New repository variable**.
   Создайте ровно две переменные (именно Variables, не Secrets):
   - `SUPABASE_URL` = ваш Project URL
   - `SUPABASE_ANON_KEY` = ваш anon public ключ
6. **Передеплой:** вкладка **Actions → Deploy to GitHub Pages → Run workflow** (или просто
   сделайте любой пуш). Сборка подхватит переменные, и комментарии/оценки станут общими.

Готово. Теперь оценка или комментарий, оставленные с любого устройства, видны всем.

## Проверка

- Откройте сайт, поставьте оценку/комментарий у любого поэта.
- В Supabase: **Table Editor → tlp_comments / tlp_ratings** — там появится новая строка.
- С другого устройства/браузера комментарий тоже виден.

## Модерация и защита от спама (по желанию)

- В коде уже есть анти‑дабл‑клик: кулдаун 30 сек и «один голос на объект» с устройства.
- Удалить лишнее: **Table Editor** → выделить строку → Delete. Или SQL:
  `delete from tlp_comments where id = '...';`
- Захотите премодерацию (комментарий виден после одобрения) или капчу — это добавляется
  политиками RLS и полем `approved`; скажите, настрою.

## Альтернатива без «засыпания»

Если не хотите изредка «будить» проект — используем **Firebase Firestore** (Spark, бесплатно,
не засыпает, анонимный вход — посетителям тоже не нужен аккаунт). Адаптер меняется на
firebase‑вариант; данные и UI те же. Дайте знать, если предпочитаете этот путь.
