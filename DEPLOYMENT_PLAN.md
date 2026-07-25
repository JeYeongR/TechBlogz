# ArticleSift 배포 계획 (MVP1 → 배포)

## 현재 상태

- DB: 로컬 SQLite(`data/techblogz.db`, better-sqlite3) — Vercel 서버리스는 디스크가 영구적이지 않아 **그대로는 배포 불가**
- 수집: `/api/cron/collect` 라우트, `CRON_SECRET` 헤더로 보호
- GitHub Actions 워크플로우([.github/workflows/collect.yml](.github/workflows/collect.yml))는 이미 있음 — `APP_URL`, `CRON_SECRET` 시크릿만 등록하면 됨

## 블로킹 이슈: DB 교체 (SQLite → Supabase)

이게 배포 전에 반드시 끝나야 하는 작업. PRD 5장 기술 스택에도 Supabase로 명시돼 있음.

### 1. Supabase 프로젝트 생성

1. [supabase.com](https://supabase.com)에서 새 프로젝트 생성 (무료 티어)
2. 프로젝트 설정 → API에서 확인:
   - `Project URL` → `SUPABASE_URL`
   - `service_role` 키 → `SUPABASE_SERVICE_ROLE_KEY` (anon key 아님 — 서버에서만 씀, 절대 클라이언트에 노출 금지)

### 2. 스키마 마이그레이션 SQL 작성 (현재 SQLite 스키마 기준)

`supabase/migrations/0001_init.sql` 새로 작성 (이전에 있던 파일은 SQLite 전환하면서 지움):

```sql
create extension if not exists "pgcrypto";

create table if not exists articles (
  id uuid primary key default gen_random_uuid(),
  feed_id text not null,
  feed_name text not null,
  title text not null,
  link text not null unique,
  guid text,
  summary text,
  thumbnail_url text,
  published_at timestamptz not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists articles_published_at_idx on articles (published_at desc);

create table if not exists feed_state (
  feed_id text primary key,
  last_fetched_at timestamptz not null
);
```

Supabase 대시보드 SQL Editor에서 실행.

### 3. DB 레이어 코드 교체

`better-sqlite3` → `@supabase/supabase-js`. 바뀌는 파일:

- `package.json`: `better-sqlite3`, `@types/better-sqlite3` 제거, `@supabase/supabase-js` 추가
- `src/lib/db.ts` 삭제, `src/lib/supabase.ts` 새로 작성 (서버 전용 클라이언트, `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` 사용)
- `src/lib/articles.ts`: better-sqlite3 `prepare().all()` 쿼리 → supabase-js `.from("articles").select()...` 체인으로 재작성
  - `is_read`가 SQLite에선 integer(0/1), Postgres에선 boolean — 타입 변환 로직 제거 가능
- `src/lib/collect.ts`: `insert or ignore` → supabase-js `.upsert(rows, { onConflict: "link", ignoreDuplicates: true })`
- `.env.example`: `SQLITE_PATH` 제거, `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` 추가

이 작업은 MVP1 때 이미 한 번 해봤던 방향이라(Supabase → SQLite로 되돌렸던 이력) 뒤집는 작업 자체는 크지 않음. 로컬에서 실제 Supabase 프로젝트 붙여서 수집→읽음 토글까지 e2e로 확인 후 다음 단계로.

## Vercel 배포

1. Vercel에 GitHub 레포(`JeYeongR/ArticleSift`) 연결, 새 프로젝트로 import
2. 환경변수 등록 (Vercel 프로젝트 설정 → Environment Variables):
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `CRON_SECRET` (임의 문자열, GitHub Actions 시크릿과 동일한 값)
3. 배포 트리거, 빌드 로그에서 `prebuild`(`validate:feeds`)가 실제 네트워크로 14개 피드 다 통과하는지 확인
4. 배포된 URL에서 홈페이지 로딩 확인 (이 시점엔 DB 비어있는 게 정상 — 아직 수집 안 함)

## GitHub Actions 크론 연결

1. GitHub 레포 → Settings → Secrets and variables → Actions
2. 시크릿 등록:
   - `APP_URL`: Vercel 배포 URL (예: `https://articlesift.vercel.app`)
   - `CRON_SECRET`: Vercel에 등록한 것과 동일한 값
3. Actions 탭에서 `Collect feeds` 워크플로우 `workflow_dispatch`로 수동 실행 → 200 응답 + 글 수집 확인
4. 15분 뒤 스케줄 실행 자동으로 도는지 확인 (Actions 탭 히스토리)

## 배포 후 체크리스트

- [ ] Supabase 프로젝트 생성 + 마이그레이션 SQL 실행
- [ ] DB 레이어 코드를 supabase-js로 교체, 로컬에서 실제 Supabase 붙여 수집/목록/읽음 토글 e2e 확인
- [ ] Vercel 프로젝트 연결 + 환경변수 3개 등록
- [ ] Vercel 배포 성공, `prebuild` 피드 검증 통과
- [ ] GitHub Actions 시크릿(`APP_URL`, `CRON_SECRET`) 등록
- [ ] 수동 `workflow_dispatch`로 수집 1회 트리거 확인
- [ ] 15분 자동 스케줄 정상 작동 확인
- [ ] 배포 URL에서 리스트/그리드/다크모드 실제 브라우저 확인

## 트러블슈팅 메모

- `validate:feeds`가 빌드 중 실패하면 배포 자체가 막힘 — 피드 URL이 죽었으면 `feeds.json`에서 빼거나 고치고 재배포
- GitHub Actions 무료 티어 스케줄 크론은 지연이 있을 수 있음(PRD 7장 언급) — 15분 설정해도 실제로는 더 늦게 돌 수 있음, 정상
- Supabase 무료 티어는 7일 비활성 시 자동 일시정지되는데, Actions 크론이 15분마다 호출하므로 이 이슈는 안 걸림 (PRD 5장)
