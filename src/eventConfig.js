// 오픈 이벤트 설정
// 메인 페이지 이벤트 안내 표시 여부. 날짜에 따른 자동 숨김은 끄고, 직접 켜고 끄도록 함.
// 이벤트 안내를 내리고 싶을 때 SHOW_EVENT_INVITE를 false로 바꾸면 됩니다.
export const SHOW_EVENT_INVITE = true;
export const isEventOpen = () => SHOW_EVENT_INVITE;
