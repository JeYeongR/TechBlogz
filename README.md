## TechBlogz — MVP1

필터링 기능이 있는 개인용 RSS 리더. 스펙은 [rss-reader-prd.md](./rss-reader-prd.md) 참고.

DB는 Supabase(Postgres)를 씀 — Vercel 서버리스 배포를 전제로 함.

### 설정

1. Supabase 프로젝트 생성 후 `supabase/migrations/0001_init.sql`을 SQL Editor에서 실행
2. `.env.local` 생성 (`.env.example` 참고):
   - `CRON_SECRET`: 임의 문자열, GitHub Actions 시크릿(`CRON_SECRET`)과 동일하게 설정
   - `SUPABASE_URL`: Supabase 프로젝트 설정 → API → Project URL
   - `SUPABASE_SERVICE_ROLE_KEY`: Supabase 프로젝트 설정 → API → service_role 키 (서버 전용, 클라이언트 노출 금지)
3. `npm install` → `npm run dev`
4. `feeds.json`에 피드 추가/삭제 (URL이 유효한지는 `npm run validate:feeds`로 확인, 빌드 시 `prebuild`로 자동 실행됨)

### 배포

- Vercel에 연결, 환경변수(`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`) 등록 후 배포
- GitHub Actions(`.github/workflows/collect.yml`)가 15분 간격으로 `/api/cron/collect`를 호출해 신규 글 수집
  - 리포지토리 시크릿에 `APP_URL`(배포 URL), `CRON_SECRET` 등록 필요

### 수동 수집 트리거

```
curl "$APP_URL/api/cron/collect" -H "x-cron-secret: $CRON_SECRET"
```

### MVP1 범위

- 피드 등록(`feeds.json`) + 수집 + 리스트/그리드 목록
- 읽음/안읽음 상태 (카드 클릭 시 자동 읽음 처리, 버튼으로 토글)

키워드 규칙 필터링은 제거함 — MVP2에서 LLM 기반 태그 분류로 대체 예정 (아래 MVP2 참고).
