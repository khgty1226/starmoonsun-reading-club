import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useScroll,
  useTransform,
} from "motion/react";
import "./Gallery.css";

const PAGE_SIZE = 9; // 3 x 3
const PLACEHOLDER_COUNT = 18; // 이미지가 없을 때 보여줄 자리표시자 개수
const SPRING = { type: "spring", stiffness: 300, damping: 35 };

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

/* ───────── 갤러리 ───────── */
function Gallery({ images = [] }) {
  const sectionRef = useRef(null);
  const viewportRef = useRef(null);
  const dragged = useRef(false); // 드래그 직후의 클릭을 무시하기 위한 표시
  const [page, setPage] = useState(0);
  const [width, setWidth] = useState(0);
  const [selected, setSelected] = useState(null);
  const x = useMotionValue(0);

  // 2페이지로 스크롤되는 동안 0 → 1로 변하는 진행도
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "start start"],
  });
  const opacity = useTransform(scrollYProgress, [0.3, 0.9], [0, 1]);

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

  const openImage = (image) => {
    if (dragged.current) return;
    setSelected(image);
  };
  const closeImage = useCallback(() => setSelected(null), []);

  return (
    <section id="gallery" ref={sectionRef} className="gallery-page">
      <motion.div className="gallery-content" style={{ opacity }}>
        <h1>Gallery</h1>

        <div className="gallery-viewport" ref={viewportRef}>
          <motion.div
            className="gallery-track"
            style={{ x }}
            drag="x"
            dragConstraints={{ left: -(pages.length - 1) * width, right: 0 }}
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
                      <div key={number} className="gallery-cell placeholder">
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
                      <img src={src} alt={alt} draggable={false} loading="lazy" />
                    </button>
                  );
                })}
              </div>
            ))}
          </motion.div>
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