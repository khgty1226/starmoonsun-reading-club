import { useState } from "react";
import { motion } from "motion/react";
import "./App.css";
import starmoonsun from "./assets/starmoonsun.png";
import starmoonsun_full from "./assets/starmoonsun_full.png";
import Gallery from "./Gallery";
import { galleryImages } from "./galleryImages";

// 영역 비율 (vh). 소개 영역은 100 - LOGO_VH - CONTACT_VH 만큼 차지함
const LOGO_VH = 40;
const CONTACT_VH = 40;
const MOBILE_LIFT_VH_INTRODUCE = 5; // 모바일에서 소개 영역을 위로 올리는 값
const MOBILE_LIFT_VH_CONTACT = 10; // 모바일에서 Contact 영역을 위로 올리는 값
const MOBILE_LIFT_VH_HINT = 18; // 모바일에서 스크롤 화살표를 위로 올리는 값 (20 초과 시 Contact와 겹침)

function App() {
  const [showContact, setShowContact] = useState(false);
  const [showIntroduce, setShowIntroduce] = useState(false);

  const isMobile = window.matchMedia("(max-width: 1024px)").matches;
  const lift_contact = isMobile ? MOBILE_LIFT_VH_CONTACT : 0;

  // 2페이지(Gallery)로 부드럽게 스크롤
  const scrollToGallery = () => {
    document
      .getElementById("gallery")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      {/* ───────── 1페이지 ───────── */}
      <div
        className="page"
        style={{
          "--logo-h": `${LOGO_VH}vh`,
          "--contact-h": `${CONTACT_VH}vh`,
          "--mobile-lift-introduce": `${MOBILE_LIFT_VH_INTRODUCE}vh`,
          "--mobile-lift-contact": `${MOBILE_LIFT_VH_CONTACT}vh`,
          "--mobile-lift-hint": `${MOBILE_LIFT_VH_HINT}vh`,
        }}
      >
        {/* 1. 로고 영역: 처음엔 화면 전체, 이동 후 위쪽 영역으로 */}
        <motion.div
          className="logo-area"
          initial={{ height: "100vh" }}
          animate={{ height: showContact ? `${LOGO_VH}vh` : "100vh" }}
          transition={{ duration: 0.9, ease: "easeInOut" }}
          onAnimationComplete={(definition) => {
            // 위쪽 영역으로 이동을 마쳤을 때만 소개 영역 표시
            if (definition?.height === `${LOGO_VH}vh`) setShowIntroduce(true);
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

        {/* 2. 소개 영역: 두 영역 사이 가운데, 위치 고정 + 서서히 나타남 */}
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
              서로의 내면을 더욱 깊어지게 하고, 그러한 서로가 인연이 되는
              모임을 만들고자 합니다.
            </p>
          </motion.div>
        )}

        {/* 3. Contact 영역: 화면 가운데에서 생성되어 아래쪽 영역으로 이동 */}
        {showContact && (
          <motion.div
            className="contact"
            initial={{
              y: `${-(50 - CONTACT_VH / 2 - lift_contact)}vh`,
              opacity: 0,
            }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.9, ease: "easeInOut" }}
          >
            <h1>Contact</h1>
            <a href="https://www.instagram.com/starmoonsun.reading.club/">
              @starmoonsun.reading.club
            </a>
          </motion.div>
        )}

        {/* 4. 스크롤 유도 아이콘: 모든 연출이 끝난 뒤 표시 */}
        {showIntroduce && (
          <button
            type="button"
            className="scroll-hint"
            onClick={scrollToGallery}
            aria-label="Gallery로 이동"
          >
            <svg
              viewBox="0 0 24 24"
              width="28"
              height="28"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M6 5l6 6 6-6" />
              <path d="M6 12l6 6 6-6" opacity="0.5" />
            </svg>
          </button>
        )}
      </div>

      {/* ───────── 2페이지 ───────── */}
      <Gallery images={galleryImages} />
    </>
  );
}

export default App;