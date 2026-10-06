import { useId } from "react";
import "./SectionTitle.css";

// 2페이지 이후 각 섹션의 제목. 메인 이벤트 안내와 같은 크레용 줄이
// 섹션이 화면에 들어올 때(visible) 한 번 칠해집니다.
// 사용: <SectionTitle visible={inView}>Gallery</SectionTitle>
function SectionTitle({ visible, children, className = "" }) {
  const filterId = `crayon-${useId().replace(/:/g, "")}`;

  return (
    <h2 className={`section-title ${visible ? "is-in" : ""} ${className}`}>
      <svg
        className="section-title-crayon"
        viewBox="0 0 140 40"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <filter
            id={filterId}
            filterUnits="userSpaceOnUse"
            x="-10"
            y="-10"
            width="160"
            height="60"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.8"
              numOctaves="2"
              seed="11"
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="10"
              result="rough"
            />
            <feTurbulence
              type="fractalNoise"
              baseFrequency="1.4 0.5"
              numOctaves="1"
              seed="5"
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
          d="M 8 24 C 40 29, 92 17, 132 22"
          pathLength="1"
          filter={`url(#${filterId})`}
        />
      </svg>
      <span className="section-title-text">{children}</span>
    </h2>
  );
}

export default SectionTitle;
