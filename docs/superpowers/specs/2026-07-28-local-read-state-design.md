# 읽음 상태 로컬 저장 전환

## 배경

현재 읽음 표시는 Supabase `articles.is_read` 컬럼 하나로 전역 관리된다. 여러 기기/브라우저가 같은 데이터를 공유하므로, 한 기기에서 읽음 처리하면 다른 기기에서도 즉시 반영되어 서로 덮어쓴다. PRD상 "개인 단일 사용자 도구" 전제라 실사용에 큰 문제는 아니지만, 기기별로 독립된 읽음 상태를 원한다는 요청에 따라 브라우저에 저장하는 방식으로 전환한다.

`:visited` CSS 가상클래스는 프라이버시 제약으로 색상 외 스타일을 못 주고 JS로 읽을 수도 없어 후보에서 제외.

## 저장 위치: localStorage 대신 쿠키

처음엔 `localStorage`로 구현했으나, localStorage는 요청 시점에 서버가 알 수 없어 최초 SSR 응답은 항상 "안읽음"으로 나가고, 마운트 후 클라이언트에서 다시 읽어와 보정하는 구조가 됨. 이 보정이 눈에 보이는 깜빡임(flicker)으로 나타나 사용자가 체감함.

쿠키는 요청 헤더에 실려 서버로 전달되므로, Server Component(`page.tsx`)가 `next/headers`의 `cookies()`로 직접 읽어 최초 응답부터 정확한 `opacity-50` 클래스를 렌더링할 수 있음. 클라이언트 쪽 보정 단계 자체가 없어져 깜빡임이 원천적으로 사라짐. 다크모드 깜빡임 방지와 동일한 원리.

## 범위

- 읽음 상태 저장소를 Supabase에서 쿠키(`articlesift_read_ids`)로 완전 전환
- 서버 측 `is_read` 관련 코드(액션, 쿼리 업데이트) 제거
- DB `articles.is_read` 컬럼 자체는 삭제하지 않음 (마이그레이션은 범위 밖)

## 설계

### 저장 형식

쿠키 `articlesift_read_ids` = URL-encoded JSON 문자열 배열 (읽은 article id 목록), `path=/; max-age=1년`

### 컴포넌트 변경

- `src/lib/read-ids.ts`: 쿠키 이름 상수 + `parseReadIds(raw)` 안전 파싱 헬퍼 (JSON 깨졌을 때 빈 배열로 폴백)
- `page.tsx` (Server Component): `cookies()`로 쿠키 읽어 `initialReadIds: string[]`를 `HomeShell` → `ArticleGrid`로 전달
- `ArticleGrid`
  - `readIds: Set<string>` state, 초기값 `new Set(initialReadIds)` (SSR과 최초 렌더가 항상 일치, 별도 보정 불필요)
  - `handleRead(id)`: state에 id 추가 + `document.cookie`로 쿠키 갱신 (기존 서버 액션 `toggleRead` 호출 제거)
  - `ArticleCard`에 `article.is_read` 대신 `isRead={readIds.has(article.id)}` 전달
- `ArticleCard`
  - `is_read` 대신 `isRead: boolean` prop으로 opacity 처리, `transition-opacity`는 항상 적용 (더 이상 로드 시 보정이 없으므로 클릭 시 자연스럽게 페이드)

### 삭제 대상

- `src/app/actions.ts`의 `toggleRead`
- `src/lib/articles.ts`의 `setArticleRead`
- `is_read` 참조 (types는 유지, DB에서 여전히 내려오지만 클라이언트에서 무시)

## 알려진 한계

- 쿠키 크기 제한(~4KB)으로 읽은 글이 아주 많이 누적되면 한계에 부딪힐 수 있음. 개인용 도구 스케일에서는 문제되지 않을 것으로 판단, 필요해지면 오래된 id 트리밍 고려.

## 테스트

- 새 글 클릭 → 카드 흐려짐, 새로고침 후에도 유지 (쿠키 확인)
- 새로고침 시 `curl`로 받은 SSR 원본 HTML에 이미 `opacity-50`이 포함되어 있어 깜빡임 없음 확인
- 다른 브라우저 프로필/시크릿창에서는 읽음 표시 없음 (기기 독립성)
