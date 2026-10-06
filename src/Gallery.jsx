import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  AnimatePresence,
  animate,
  motion,
  useInView,
  useMotionValue,
} from "motion/react";
import PageLogo from "./PageLogo";
import SectionTitle from "./SectionTitle";
import "./Gallery.css";

const PAGE_SIZE = 9; // 3 x 3
const PLACEHOLDER_COUNT = 18; // 이미지가 없을 때 보여줄 자리표시자 개수
const SPRING = { type: "spring", stiffness: 300, damping: 35 };
const EDGE_BUMP = 22; // 더 넘길 페이지가 없을 때 살짝 당겨지는 거리(px)

const chunk = (arr, size) =>
  Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size),
  );

/* ───────── 사진 확대 모달 ───────── */
function Lightbox({ image, onClose }) {
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);

    // 모달이 열려 있는 동안 뒤쪽 페이지 스크롤 잠금
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <motion.div
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label="사진 크게 보기"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      onClick={onClose}
    >
      <motion.img
        className="lightbox-img"
        src={image.src}
        alt={image.alt}
        initial={{ scale: 0.55, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.85, opacity: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
      />
      <button
        type="button"
        className="lightbox-close"
        onClick={onClose}
        aria-label="닫기"
      >
        ×
      </button>
    </motion.div>
  );
}

/* ───────── 넘기기 화살표 ───────── */
function GalleryArrow({ direction, onClick, disabled }) {
  return (
    <button
      type="button"
      className={`gallery-arrow gallery-arrow-${direction}`}
      onClick={onClick}
      aria-label={direction === "prev" ? "이전 페이지" : "다음 페이지"}
      aria-disabled={disabled}
    >
      <svg
        viewBox="0 0 24 24"
        width="50"
        height="50"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {direction === "prev" ? (
          <path d="M15 5l-7 7 7 7" />
        ) : (
          <path d="M9 5l7 7-7 7" />
        )}
      </svg>
    </button>
  );
}

/* ───────── 갤러리 ───────── */
function Gallery({ images = [] }) {
  const sectionRef = useRef(null);
  const viewportRef = useRef(null);
  const dragged = useRef(false); // 드래그 직후의 클릭을 무시하기 위한 표시
  const [page, setPage] = useState(0);
  const [width, setWidth] = useState(0);
  const [selected, setSelected] = useState(null);
  const x = useMotionValue(0);

  // 2페이지가 화면의 60% 이상 보이면 true. 상단 로고와 본문이 이 값을 함께 씀
  const inView = useInView(sectionRef, { amount: 0.6 });

  const items =
    images.length > 0
      ? images
      : Array.from({ length: PLACEHOLDER_COUNT }, () => null);
  const pages = chunk(items, PAGE_SIZE);

  // 갤러리 폭 측정 (반응형 대응)
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(entry.contentRect.width),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // 페이지가 바뀌면 해당 위치로 부드럽게 이동
  useEffect(() => {
    const controls = animate(x, -page * width, SPRING);
    return () => controls.stop();
  }, [page, width, x]);

  const handleDragEnd = (_, info) => {
    // 드래그가 끝난 직후 발생하는 클릭은 모달을 열지 않도록 잠깐 표시 유지
    setTimeout(() => {
      dragged.current = false;
    }, 60);

    const isSwipe =
      Math.abs(info.offset.x) > width * 0.2 || Math.abs(info.velocity.x) > 500;

    let next = page;
    if (isSwipe) {
      next =
        info.offset.x < 0
          ? Math.min(page + 1, pages.length - 1)
          : Math.max(page - 1, 0);
    }

    if (next !== page) setPage(next);
    else animate(x, -page * width, SPRING); // 페이지 유지: 제자리로 복귀
  };

  // 화살표로 페이지 이동. 더 넘길 페이지가 없으면 살짝 당겨졌다가 되돌아옴
  const goPage = (dir) => {
    const next = page + dir;
    if (next < 0 || next > pages.length - 1) {
      const base = -page * width;
      animate(x, [base, base - dir * EDGE_BUMP, base], {
        duration: 0.35,
        ease: "easeOut",
      });
      return;
    }
    setPage(next);
  };

  const openImage = (image) => {
    if (dragged.current) return;
    setSelected(image);
  };
  const closeImage = useCallback(() => setSelected(null), []);

  return (
    <section id="gallery" ref={sectionRef} className="gallery-page">
      {/* 페이지 상단 로고: 본문과 같은 속도로 함께 나타남 */}
      <PageLogo visible={inView} />

      <motion.div
        className="gallery-content"
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: inView ? 1 : 0, y: inView ? 0 : 28 }}
        transition={{ duration: inView ? 1.4 : 0.5, ease: "easeOut" }}
      >
        <div className="gallery-stage">
          {/* 섹션 제목: 갤러리 위 빈 공간에 놓여 사진 위치는 그대로 */}
          <div className="gallery-heading">
            <SectionTitle visible={inView}>Gallery</SectionTitle>
          </div>

          <GalleryArrow
            direction="prev"
            onClick={() => goPage(-1)}
            disabled={page === 0}
          />

          <div className="gallery-viewport" ref={viewportRef}>
            <motion.div
              className="gallery-track"
              style={{ x }}
              drag="x"
              dragConstraints={{
                left: -(pages.length - 1) * width,
                right: 0,
              }}
              dragElastic={0.2}
              dragMomentum={false}
              onDragStart={() => {
                dragged.current = true;
              }}
              onDragEnd={handleDragEnd}
            >
              {pages.map((pageItems, pageIndex) => (
                <div className="gallery-slide" key={pageIndex}>
                  {pageItems.map((item, i) => {
                    const number = pageIndex * PAGE_SIZE + i + 1;

                    if (item === null) {
                      return (
                        <div
                          key={number}
                          className="gallery-cell placeholder"
                        >
                          {number}
                        </div>
                      );
                    }

                    const isString = typeof item === "string";
                    const src = isString ? item : item.src;
                    const alt = isString
                      ? `Gallery ${number}`
                      : (item.alt ?? `Gallery ${number}`);

                    return (
                      <button
                        key={number}
                        type="button"
                        className="gallery-cell"
                        onClick={() => openImage({ src, alt })}
                        aria-label={`${alt} 크게 보기`}
                      >
                        <img
                          src={src}
                          alt={alt}
                          draggable={false}
                          loading="lazy"
                        />
                      </button>
                    );
                  })}
                </div>
              ))}
            </motion.div>
          </div>

          <GalleryArrow
            direction="next"
            onClick={() => goPage(1)}
            disabled={page === pages.length - 1}
          />
        </div>

        {pages.length > 1 && (
          <div className="gallery-dots">
            {pages.map((_, i) => (
              <button
                key={i}
                type="button"
                className={`gallery-dot ${i === page ? "active" : ""}`}
                onClick={() => setPage(i)}
                aria-label={`${i + 1}페이지`}
              />
            ))}
          </div>
        )}
      </motion.div>

      {/* 모달은 transform이 걸린 갤러리 밖(body)에 그려야 화면 전체를 덮을 수 있음 */}
      {createPortal(
        <AnimatePresence>
          {selected && <Lightbox image={selected} onClose={closeImage} />}
        </AnimatePresence>,
        document.body,
      )}
    </section>
  );
}

export default Gallery;