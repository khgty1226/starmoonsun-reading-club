// 오픈 이벤트 설정
// 마감(10/15) 다음 날 0시(한국 시간)부터 메인 페이지의 이벤트 안내가 자동으로 사라집니다.
export const EVENT_CLOSES_AT = new Date("2026-10-16T00:00:00+09:00");
export const isEventOpen = () => Date.now() < EVENT_CLOSES_AT.getTime();
