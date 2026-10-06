import { motion } from "motion/react";
import "./EventInvite.css";

// 메인 1페이지, 소개 글과 Contact 사이에 놓이는 오픈 이벤트 안내 링크.
// 마감 후 자동으로 숨기는 기준은 eventConfig.js에 있습니다.

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
        <span className="invite-kicker">
          <span className="invite-star" aria-hidden="true" />
          오픈 이벤트 · 10월 15일까지
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
