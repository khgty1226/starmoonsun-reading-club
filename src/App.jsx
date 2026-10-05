import { useRef, useState } from "react";
import { animate, motion } from "motion/react";
import "./App.css";
import starmoonsun from "./assets/starmoonsun.png";
import starmoonsun_full from "./assets/starmoonsun_full.png";
import Gallery from "./Gallery";
import { galleryImages } from "./galleryImages";

// 아래 값들은 서로 독립적인 값으로, 각각 다른 것을 조절합니다.
// PC와 모바일(1024px 이하)에서 로고·소개 글 위치를 따로 조정할 수 있습니다.
const LOGO_CENTER_VH = 17; // 로고가 최종적으로 자리 잡을 세로 중심 위치 (PC)
const LOGO_CENTER_VH_MOBILE = 12; // 로고가 최종적으로 자리 잡을 세로 중심 위치 (모바일)
const CONTENT_TOP_VH = 4; // 소개 글이 시작되는 위치, 로고 바로 아래 (PC)
const CONTENT_TOP_VH_MOBILE = 4; // 소개 글이 시작되는 위치, 로고 바로 아래 (모바일)
const CONTACT_VH = 30; // Contact 영역이 차지하는 높이(화면 하단 기준)

const MOBILE_LIFT_VH_INTRODUCE = 5; // 모바일에서 소개 영역을 위로 올리는 값
const MOBILE_LIFT_VH_CONTACT = 10; // 모바일에서 Contact 영역을 위로 올리는 값
const MOBILE_LIFT_VH_HINT = 18; // 모바일에서 스크롤 화살표를 위로 올리는 값 (20 초과 시 Contact와 겹침)
const SCROLL_DURATION = 1.2; // 화살표 클릭 시 2페이지까지 이동하는 시간(초)

function App() {
  const [showContact, setShowContact] = useState(false);
  const [showIntroduce, setShowIntroduce] = useState(false);

  const isMobile = window.matchMedia("(max-width: 1024px)").matches;
  const lift_contact = isMobile ? MOBILE_LIFT_VH_CONTACT : 0;
  const logoCenterVh = isMobile ? LOGO_CENTER_VH_MOBILE : LOGO_CENTER_VH;
  const contentTopVh = isMobile ? CONTENT_TOP_VH_MOBILE : CONTENT_TOP_VH;

  const scrollAnim = useRef(null);

  // 2페이지(Gallery)로 지정한 시간 동안 부드럽게 스크롤
  const scrollToGallery = () => {
    const target = document.getElementById("gallery");
    if (!target) return;

    scrollAnim.current?.stop(); // 이미 이동 중이면 중단

    const from = window.scrollY;
    const to = target.getBoundingClientRect().top + window.scrollY;
    const events = ["wheel", "touchstart", "keydown"];

    let controls;
    const cleanup = () =>
      events.forEach((e) => window.removeEventListener(e, cancel));
    // 이동 중 사용자가 직접 스크롤하면 자동 이동을 멈춤
    const cancel = () => {
      controls.stop();
      cleanup();
    };

    controls = animate(from, to, {
      duration: SCROLL_DURATION,
      ease: "easeInOut",
      onUpdate: (y) => window.scrollTo(0, y),
      onComplete: cleanup,
    });
    scrollAnim.current = controls;

    events.forEach((e) =>
      window.addEventListener(e, cancel, { passive: true }),
    );
  };

  return (
    <>
      {/* ───────── 1페이지 ───────── */}
      <div
        className="page"
        style={{
          "--content-top": `${contentTopVh}vh`,
          "--contact-h": `${CONTACT_VH}vh`,
          "--mobile-lift-introduce": `${MOBILE_LIFT_VH_INTRODUCE}vh`,
          "--mobile-lift-contact": `${MOBILE_LIFT_VH_CONTACT}vh`,
          "--mobile-lift-hint": `${MOBILE_LIFT_VH_HINT}vh`,
        }}
      >
        {/* 1. 로고: 화면 중앙(50vh)에서 그려진 뒤, 같은 자리에서 최종 위치까지 끊김 없이 이동 */}
        <motion.div
          className="logo-anchor"
          initial={{ top: "50vh" }}
          animate={{ top: showContact ? `${logoCenterVh}vh` : "50vh" }}
          transition={{ duration: 0.9, ease: "easeInOut" }}
          onAnimationComplete={() => {
            // 최종 위치로 이동을 마쳤을 때만 소개 영역 표시
            if (showContact) setShowIntroduce(true);
          }}
        >
          <div className={`logo-stack ${showContact ? "swapped" : ""}`}>
            {/* 1번 로고: 붓으로 그려지는 별·달·해 */}
            <svg className="logo" viewBox="0 0 517 185">
              <defs>
                <mask
                  id="reveal"
                  maskUnits="userSpaceOnUse"
                  x="0"
                  y="0"
                  width="517"
                  height="185"
                >
                  <path
                    className="pen"
                    d="M -20 160
                       L 40 25   L 100 160
                       L 160 25  L 220 160
                       L 280 25  L 340 160
                       L 400 25  L 460 160
                       L 520 25  L 580 160"
                    pathLength="1"
                    fill="none"
                    stroke="white"
                    strokeWidth="140"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    onAnimationEnd={() => setShowContact(true)}
                  />
                </mask>
              </defs>

            <image
              href={starmoonsun}
              x="0"
              y="0"
              width="517"
              height="185"
              mask="url(#reveal)"
            />
          </svg>

          {/* 2번 로고: Reading Club 글씨가 포함된 로고 */}
          <img
            className="logo-full"
            src={starmoonsun_full}
            alt="Reading Club"
          />
        </div>
      </motion.div>

        {/* 2. 소개 영역: 로고 아래 ~ Contact 위 사이, 위치 고정 + 서서히 나타남 */}
        {showIntroduce && (
          <motion.div
            className="introduce"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.9, ease: "easeInOut" }}
          >
            <p>
              "별달해 독서클럽"은 대전에서 운영을 시작하는 독서모임입니다.
            </p>
            <p>
              경청과 존중을 바탕으로, 각자가 가진 사유와 이야기를 나눔으로,
              서로의 내면을 더욱 깊어지게 하는 모임이 되고자 합니다.
            </p>
          </motion.div>
        )}

      {/* 3. Contact 영역: 화면 가운데에서 생성되어 아래쪽 영역으로 이동 */}
      {showContact && (
        <motion.div
          className="contact"
          initial={{ y: `${-(50 - CONTACT_VH / 2 - lift_contact)}vh`, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.9, ease: "easeInOut" }}
        >
          <h1>Contact</h1>
          <a href="https://www.instagram.com/starmoonsun.reading.club/">
            @starmoonsun.reading.club
          </a>
        </motion.div>
      )}
    </div>
  );
}

export default App;