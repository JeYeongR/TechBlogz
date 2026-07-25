// Fixed to Asia/Seoul so server (host TZ) and client (browser TZ) always render identical text — avoids hydration mismatch.
const TIME_ZONE = "Asia/Seoul";

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ko-KR", { timeZone: TIME_ZONE });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("ko-KR", { timeZone: TIME_ZONE, hour12: false });
}
