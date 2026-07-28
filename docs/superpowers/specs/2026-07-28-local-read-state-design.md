# 읽음 상태 로컬 저장 전환

## 배경

현재 읽음 표시는 Supabase `articles.is_read` 컬럼 하나로 전역 관리된다. 여러 기기/브라우저가 같은 데이터를 공유하므로, 한 기기에서 읽음 처리하면 다른 기기에서도 즉시 반영되어 서로 덮어쓴다. PRD상 "개인 단일 사용자 도구" 전제라 실사용에 큰 문제는 아니지만, 기기별로 독립된 읽음 상태를 원한다는 요청에 따라 브라우저 `localStorage` 기반으로 전환한다.

`:visited` CSS 가상클래스는 프라이버시 제약으로 색상 외 스타일을 못 주고 JS로 읽을 수도 없어 후보에서 제외. 뉴스/RSS 리더류가 보편적으로 쓰는 방식인 "클라이언트에서 읽은 글 id를 직접 저장"하는 방식을 채택.

## 범위

- 읽음 상태 저장소를 Supabase에서 `localStorage`로 완전 전환
- 서버 측 `is_read` 관련 코드(액션, 쿼리 업데이트) 제거
- DB `articles.is_read` 컬럼 자체는 삭제하지 않음 (마이그레이션은 범위 밖)

## 설계

### 저장 형식

`localStorage["articlesift:read-ids"]` = JSON 문자열 배열 (읽은 article id 목록)

### 컴포넌트 변경

- `ArticleGrid`
  - `readIds: Set<string>` state 추가, 초기값 빈 Set
  - `useEffect`로 마운트 후 localStorage에서 읽어 state 갱신 (SSR과 최초 클라이언트 렌더가 항상 "빈 Set"으로 일치 → 하이드레이션 불일치 방지)
  - `handleRead(id)`: state에 id 추가 + localStorage 갱신 (기존 서버 액션 `toggleRead` 호출 제거)
  - `ArticleCard`에 `article.is_read` 대신 `isRead={readIds.has(article.id)}` 전달
- `ArticleCard`
  - `is_read` 대신 `isRead: boolean` prop으로 opacity 처리

### 삭제 대상

- `src/app/actions.ts`의 `toggleRead`
- `src/lib/articles.ts`의 `setArticleRead`
- `is_read` 참조 (types는 유지, DB에서 여전히 내려오지만 클라이언트에서 무시)

## 테스트

- 새 글 클릭 → 카드 흐려짐, 새로고침 후에도 유지 (localStorage 확인)
- 다른 브라우저 프로필/시크릿창에서는 읽음 표시 없음 (기기 독립성)
- 최초 로드 시 하이드레이션 경고 없음
