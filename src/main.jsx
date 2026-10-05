import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import OpenEvent from './OpenEvent.jsx'

// 주소에 따라 보여 줄 페이지를 고릅니다. (/open-event → 오픈 이벤트 신청서)
// Vercel에서는 vercel.json의 rewrites가 모든 주소를 index.html로 보내 줍니다.
const path = window.location.pathname.replace(/\/+$/, '')
const isOpenEvent =
  path === '/open-event' || import.meta.env.VITE_PAGE === 'open-event'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isOpenEvent ? <OpenEvent /> : <App />}
  </StrictMode>,
)
