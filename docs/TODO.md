# TODO

## 성능

- 카테고리 필터 응답 체감 속도 개선
  - 현재: 카테고리 클릭 시 매번 서버 액션(Next.js → Supabase) 왕복으로 새로 쿼리함
  - 개선 방향: 클라이언트에서 `Map<feedId, articles>` 형태로 이전에 불러온 카테고리 결과를 캐싱해서, 재선택 시 즉시 표시 (관련: [src/components/article-grid.tsx](../src/components/article-grid.tsx))

## 알려진 이슈

- 읽음 표시가 전역(모든 방문자/기기 공유) 상태임
  - 현재: `articles.is_read` 컬럼을 `id`로만 업데이트, 유저/세션 구분 없음 (관련: [src/lib/articles.ts](../src/lib/articles.ts) `setArticleRead`)
  - PRD상 "개인 단일 사용자 도구" 전제라 의도된 설계지만, 여러 기기/사람이 동시에 접근하면 읽음 상태가 서로 덮어써짐
  - 필요해지면: 기기별 로컬 저장(localStorage) 기반으로 분리하거나, 유저 인증 도입 검토
