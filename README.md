## ArticleSift — MVP1

필터링 기능이 있는 개인용 RSS 리더. 스펙은 [rss-reader-prd.md](./rss-reader-prd.md) 참고.

MVP1은 DB로 로컬 SQLite(`data/articlesift.db`, better-sqlite3)를 씀 — 별도 서비스 가입 없이 바로 실행. MVP2에서 Supabase 등 호스팅 DB로 옮길 예정 (Vercel 서버리스는 디스크가 영구적이지 않아 SQLite 파일이 배포 환경에서 유지되지 않음).

### 설정

1. `.env.local` 생성 (`.env.example` 참고):
   - `CRON_SECRET`: 임의 문자열, GitHub Actions 시크릿(`CRON_SECRET`)과 동일하게 설정
   - `SQLITE_PATH`: 선택. 기본값은 `data/articlesift.db`
2. `npm install` → `npm run dev` (첫 실행 시 `data/` 디렉터리와 sqlite 파일 자동 생성)
3. `feeds.json`에 피드 추가/삭제 (URL이 유효한지는 `npm run validate:feeds`로 확인, 빌드 시 `prebuild`로 자동 실행됨)

### 배포

- SQLite 파일 기반이라 로컬/단일 서버 환경(예: VM, 상시 실행 컨테이너)에 그대로 배포 가능
- Vercel 등 서버리스에 배포하려면 DB를 호스팅형(Supabase 등)으로 교체 필요 — MVP2 작업
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
