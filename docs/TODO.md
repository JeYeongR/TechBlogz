# TODO

## 성능

- 카테고리 필터 응답 체감 속도 개선
  - 현재: 카테고리 클릭 시 매번 서버 액션(Next.js → Supabase) 왕복으로 새로 쿼리함
  - 개선 방향: 클라이언트에서 `Map<feedId, articles>` 형태로 이전에 불러온 카테고리 결과를 캐싱해서, 재선택 시 즉시 표시 (관련: [src/components/article-grid.tsx](../src/components/article-grid.tsx))
