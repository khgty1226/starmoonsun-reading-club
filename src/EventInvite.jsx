import { motion } from "motion/react";
import "./EventInvite.css";

// 메인 1페이지, 소개 글과 Contact 사이에 놓이는 오픈 이벤트 안내 링크.
// 마감 후 자동으로 숨기는 기준은 eventConfig.js에 있습니다.

/* 끈으로 묶고 '?' 꼬리표를 단 블라인드 북. 로고처럼 손으로 그린 느낌 */
function BlindBook() {
  return (
    <svg className="invite-book" viewBox="0 0 120 104" aria-hidden="true">
      <defs>
        {/* 선이 살짝 흔들리는 손그림 효과 */}
        <filter id="book-hand" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.05"
            numOctaves="2"
            seed="4"
            result="wobble"
          />
          <feDisplacementMap in="SourceGraphic" in2="wobble" scale="3" />
        </filter>
        {/* 로고의 해처럼 사선으로 칠한 포장지 */}
        <pattern
          id="book-hatch"
          width="6"
          height="6"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(-35)"
        >
          <line x1="0" y1="0" x2="0" y2="6" />
        </pattern>
      </defs>

      <g filter="url(#book-hand)">
        <g className="invite-book-body">
          {/* 책 아래쪽 종이 단면 */}
          <path className="book-pages" d="M20 82 L96 86 L94 92 L18 88 Z" />
          {/* 포장된 책 */}
          <path className="book-wrap" d="M22 34 L100 38 L96 86 L20 82 Z" />
          <path className="book-hatch" d="M22 34 L100 38 L96 86 L20 82 Z" />
          <path className="book-line" d="M22 34 L100 38 L96 86 L20 82 Z" />
          <path className="book-line" d="M20 82 L18 88 L94 92 L96 86" />
          {/* 끈 */}
          <path className="book-string" d="M61 36 L58 84" />
          <path className="book-string" d="M21 58 L98 62" />
          {/* 리본 */}
          <path
            className="book-line"
            d="M60 36 C 50 22, 38 26, 44 34 C 48 38, 56 37, 60 36 C 66 24, 80 24, 76 33 C 73 38, 64 37, 60 36"
          />
          <path className="book-string" d="M60 36 L54 46 M60 36 L67 45" />
        </g>

        {/* '?' 꼬리표 */}
        <g className="invite-book-tag">
          <path className="book-string" d="M67 33 C 76 24, 84 20, 92 16" />
          <path className="book-tag" d="M90 8 L108 12 L104 30 L86 26 Z" />
          <circle className="book-hole" cx="91.5" cy="14" r="1.6" />
          <text className="book-q" x="97" y="25" textAnchor="middle">
            ?
          </text>
        </g>
      </g>
    </svg>
  );
}

function EventInvite() {
  return (
    <div className="invite-wrap">
      <motion.a
        href="/open-event"
        className="invite"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.5, ease: "easeOut" }}
      >
        <BlindBook />

        <span className="invite-kicker">
          <span className="invite-star" aria-hidden="true" />
          오픈 이벤트
        </span>

        <span className="invite-title">
          {/* 크레용으로 한 번 쓱 칠한 듯한 노란 밑줄 */}
          <svg
            className="invite-crayon"
            viewBox="0 0 300 40"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <defs>
              <filter
                id="crayon-edge"
                x="-5%"
                y="-60%"
                width="110%"
                height="220%"
              >
                {/* 가장자리를 거칠게 */}
                <feTurbulence
                  type="fractalNoise"
                  baseFrequency="0.8"
                  numOctaves="2"
                  seed="7"
                  result="noise"
                />
                <feDisplacementMap
                  in="SourceGraphic"
                  in2="noise"
                  scale="7"
                  result="rough"
                />
                {/* 크레용 특유의 듬성듬성한 결 */}
                <feTurbulence
                  type="fractalNoise"
                  baseFrequency="1.4 0.5"
                  numOctaves="1"
                  seed="3"
                  result="grain"
                />
                <feColorMatrix
                  in="grain"
                  type="matrix"
                  values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.2 1.75"
                  result="grainAlpha"
                />
                <feComposite in="rough" in2="grainAlpha" operator="in" />
              </filter>
            </defs>
            <path
              d="M 8 25 C 80 19, 170 29, 292 18"
              pathLength="1"
              filter="url(#crayon-edge)"
            />
          </svg>
          <span className="invite-text">나에게 꼭 필요한 책은?</span>
        </span>

        <span className="invite-cta">
          블라인드 북 신청하기
          <svg viewBox="0 0 12 12" aria-hidden="true">
            <path d="M4 2.5 7.5 6 4 9.5" />
          </svg>
        </span>
      </motion.a>
    </div>
  );
}

export default EventInvite;
