import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useInView } from "motion/react";
import PageLogo from "./PageLogo";
import SectionTitle from "./SectionTitle";
import "./Members.css";

// 3페이지 '우리의 서가' — 가입 인사 게시판.
// 한 사람의 가입 인사 = 그 사람이 좋아하는 책 한 권. 서가에 책등으로 꽂히고,
// 책등을 누르면 책을 뽑아 든 것처럼 그 사람의 인사 카드가 열립니다.
//
// VITE_FORM_MOCK=true 로 빌드하거나 주소 끝에 ?demo 를 붙이면
// 서버 없이 예시 책들로 보여 줍니다(디자인 확인용, 실제로 저장되지 않음).
const MOCK =
  import.meta.env.VITE_FORM_MOCK === "true" ||
  new URLSearchParams(window.location.search).has("demo");

const IN_VIEW_AMOUNT = window.matchMedia("(max-width: 1024px)").matches
  ? 0.2
  : 0.3;

const GENDER_LABEL = { female: "여성", male: "남성" };

/* ───────── 책등 모양: seed 하나로 색·폭·높이·기호가 정해짐 ───────── */
// 차분한 종이·잉크 색 위주, 가끔 흐린 초록·청회색·흙색
const SPINE_COLORS = [
  ["#EDEBE6", "#4a4640"],
  ["#E4E0D8", "#4a4640"],
  ["#D9D4CA", "#3f3b35"],
  ["#CDC8BD", "#3a3631"],
  ["#BCB6AA", "#2f2c28"],
  ["#918B81", "#f3f1ec"],
  ["#5F5B55", "#efede8"],
  ["#2F2D2A", "#e9e7e2"],
  ["#A9B09E", "#2c3028"],
  ["#9DA5AD", "#262b30"],
  ["#C49F8C", "#3a2a22"],
  ["#E9E4D3", "#4a4640"],
];
// 별·달·해 — 인스타 '한 구절'과 같은 규칙(노랑=별, 주황=달, 빨강=해)
const MARKS = ["star", "moon", "sun"];
const MARK_COLOR = { star: "#E8C81E", moon: "#EE9A3A", sun: "#E8636B" };

const mix = (n) => {
  let x = n >>> 0;
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b) >>> 0;
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b) >>> 0;
  return (x ^ (x >>> 16)) >>> 0;
};

function spineLook(seed) {
  const h = mix(seed);
  const [bg, ink] = SPINE_COLORS[h % SPINE_COLORS.length];
  return {
    bg,
    ink,
    w: 27 + ((h >>> 4) % 11), // 27~37
    h: 0.79 + ((h >>> 9) % 22) / 100, // 서가 높이 대비 79~100%
    band: (h >>> 15) % 3, // 0 없음, 1 위아래 가는 선, 2 위쪽 띠
    mark: MARKS[(h >>> 19) % 3],
  };
}

const randomSeed = () => Math.floor(Math.random() * 2147483647);

function Mark({ type, color, size = 9 }) {
  return (
    <svg
      className="mark"
      viewBox="0 0 12 12"
      width={size}
      height={size}
      aria-hidden="true"
      style={{ color }}
    >
      {type === "star" && (
        <path d="M6 0.4 7.15 4.85 11.6 6 7.15 7.15 6 11.6 4.85 7.15 0.4 6 4.85 4.85Z" />
      )}
      {type === "moon" && (
        <path d="M8.4 1A5.2 5.2 0 1 0 11 8.9 4.3 4.3 0 0 1 8.4 1Z" />
      )}
      {type === "sun" && <circle cx="6" cy="6" r="3.4" />}
    </svg>
  );
}

/* ───────── 책등 하나 ───────── */
function Spine({ member, onOpen, isNew, isOut = false, preview = false }) {
  const look = spineLook(member.seed ?? 0);
  const style = {
    "--spine-bg": look.bg,
    "--spine-ink": look.ink,
    "--spine-w": `${look.w}px`,
    "--spine-h": look.h,
  };
  const title = member.book || "좋아하는 책";

  const body = (
    <>
      {look.band === 2 && <span className="spine-band" />}
      {look.band === 1 && <span className="spine-lines" />}
      <span className="spine-title">{title}</span>
      <Mark type={look.mark} color={MARK_COLOR[look.mark]} />
    </>
  );

  if (preview) {
    return (
      <span className={`spine is-preview ${member.book ? "" : "is-empty"}`} style={style}>
        {body}
      </span>
    );
  }

  return (
    <motion.li
      className="shelf-slot"
      layout
      initial={isNew ? { y: -120, opacity: 0 } : false}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
    >
      <button
        type="button"
        className={`spine ${isNew ? "is-new" : ""} ${isOut ? "is-out" : ""}`}
        style={style}
        onClick={() => onOpen(member)}
        aria-label={`${member.nickname}님이 좋아하는 책, ${member.book}`}
      >
        {body}
        <span className="spine-owner">{member.nickname}</span>
      </button>
    </motion.li>
  );
}

/* ───────── 모달 공통: ESC 닫기 + 뒤 페이지 스크롤 잠금 ───────── */
function useModal(onClose) {
  useEffect(() => {
    const onKeyDown = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKeyDown);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prev;
    };
  }, [onClose]);
}

const formatDate = (iso) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.`;
};

/* ───────── 책을 뽑으면 열리는 인사 카드 ───────── */
function MemberCard({ member, onClose }) {
  useModal(onClose);
  const look = spineLook(member.seed ?? 0);

  return (
    <motion.div
      className="mb-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      onClick={onClose}
    >
      <motion.article
        className="mb-card"
        role="dialog"
        aria-modal="true"
        aria-label={`${member.nickname}님의 가입 인사`}
        style={{ "--card-edge": look.bg }}
        initial={{ y: 40, opacity: 0, rotate: -2 }}
        animate={{ y: 0, opacity: 1, rotate: 0 }}
        exit={{ y: 24, opacity: 0 }}
        transition={{ type: "spring", stiffness: 240, damping: 24 }}
        onClick={(e) => e.stopPropagation()}
      >
        <Mark type={look.mark} color={MARK_COLOR[look.mark]} size={12} />
        <p className="mb-card-kicker">좋아하는 책</p>
        <h3 className="mb-card-book">『{member.book}』</h3>
        {member.author && <p className="mb-card-author">{member.author}</p>}

        <div className="mb-card-rule" />

        <p className="mb-card-name">{member.nickname}</p>
        <p className="mb-card-meta">
          {member.age}세 · {GENDER_LABEL[member.gender] ?? ""}
        </p>
        <p className="mb-card-hello">반가워요, 별달해 독서클럽에 오신 걸 환영해요.</p>
        {member.createdAt && (
          <p className="mb-card-date">{formatDate(member.createdAt)} 꽂음</p>
        )}

        <button type="button" className="mb-close" onClick={onClose} aria-label="닫기">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </motion.article>
    </motion.div>
  );
}

/* ───────── 가입 인사 쓰기: 쓰는 동안 책등이 함께 만들어짐 ───────── */
const EMPTY = { nickname: "", age: "", gender: "", book: "", author: "", website: "" };

function JoinSheet({ onClose, onDone }) {
  useModal(onClose);
  const [form, setForm] = useState(EMPTY);
  const [seed, setSeed] = useState(randomSeed);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  const set = (key) => (e) => {
    let v = e.target.value;
    if (key === "age") v = v.replace(/\D/g, "").slice(0, 2);
    setForm((f) => ({ ...f, [key]: v }));
    setError("");
  };

  const submit = async (e) => {
    e.preventDefault();
    if (sending) return;
    const age = Number(form.age);
    if (!form.nickname.trim()) return setError("닉네임을 적어 주세요.");
    if (!age || age < 1 || age > 99) return setError("나이를 확인해 주세요.");
    if (!form.gender) return setError("성별을 골라 주세요.");
    if (!form.book.trim()) return setError("좋아하는 책을 적어 주세요.");

    setSending(true);
    try {
      let member;
      if (MOCK) {
        await new Promise((r) => setTimeout(r, 500));
        member = {
          id: `mock-${Date.now()}`,
          ...form,
          age,
          seed,
          createdAt: new Date().toISOString(),
        };
      } else {
        const res = await fetch("/api/members", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, age, seed }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message || "잠시 후 다시 시도해 주세요.");
        member = data.member;
      }
      onDone(member);
    } catch (err) {
      setError(err.message);
      setSending(false);
    }
  };

  return (
    <motion.div
      className="mb-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      onClick={onClose}
    >
      <motion.form
        className="mb-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="가입 인사 남기기"
        initial={{ y: 48, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 32, opacity: 0 }}
        transition={{ type: "spring", stiffness: 240, damping: 26 }}
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        noValidate
      >
        {/* 왼쪽(모바일은 위): 지금 쓰고 있는 책등 미리보기 */}
        <div className="mb-preview">
          <div className="mb-preview-shelf">
            <Spine member={{ ...form, seed }} preview />
          </div>
          <button
            type="button"
            className="mb-shuffle"
            onClick={() => setSeed(randomSeed())}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M20 12a8 8 0 1 1-2.34-5.66M20 4v4.5h-4.5" />
            </svg>
            다른 책등
          </button>
        </div>

        <div className="mb-fields">
          <h3 className="mb-sheet-title">서가에 한 권 꽂기</h3>
          <p className="mb-sheet-lead">
            좋아하는 책 한 권으로 가입 인사를 건네 주세요.
          </p>

          <label className="mb-field">
            <span className="mb-label">닉네임</span>
            <input
              className="mb-input"
              value={form.nickname}
              onChange={set("nickname")}
              maxLength={12}
              autoComplete="nickname"
              placeholder="모임에서 불릴 이름"
            />
          </label>

          <div className="mb-row">
            <label className="mb-field mb-age">
              <span className="mb-label">나이</span>
              <span className="mb-affix">
                <input
                  className="mb-input"
                  value={form.age}
                  onChange={set("age")}
                  inputMode="numeric"
                  placeholder="27"
                />
                <span>세</span>
              </span>
            </label>

            <div className="mb-field mb-gender" role="radiogroup" aria-label="성별">
              <span className="mb-label">성별</span>
              <div className="mb-chips">
                {Object.entries(GENDER_LABEL).map(([value, label]) => (
                  <label key={value} className="mb-chip">
                    <input
                      type="radio"
                      name="gender"
                      value={value}
                      checked={form.gender === value}
                      onChange={set("gender")}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <label className="mb-field">
            <span className="mb-label">좋아하는 책</span>
            <input
              className="mb-input"
              value={form.book}
              onChange={set("book")}
              maxLength={40}
              placeholder="데미안"
            />
          </label>

          <label className="mb-field">
            <span className="mb-label">
              지은이 <em>선택</em>
            </span>
            <input
              className="mb-input"
              value={form.author}
              onChange={set("author")}
              maxLength={30}
              placeholder="헤르만 헤세"
            />
          </label>

          {/* 봇 막기용 숨김 칸 */}
          <input
            className="mb-hp"
            tabIndex={-1}
            autoComplete="off"
            value={form.website}
            onChange={set("website")}
            aria-hidden="true"
          />

          <p className="mb-note">
            적어 주신 내용은 홈페이지에 그대로 보여요. 지우고 싶을 땐 인스타그램
            DM으로 알려 주세요.
          </p>

          <p className="mb-error" role="alert">
            {error}
          </p>

          <button type="submit" className="mb-submit" disabled={sending}>
            {sending ? "꽂는 중…" : "서가에 꽂기"}
          </button>
        </div>

        <button type="button" className="mb-close" onClick={onClose} aria-label="닫기">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </motion.form>
    </motion.div>
  );
}

/* ───────── 디자인 확인용 예시 ───────── */
const SAMPLE = [
  ["달빛", 27, "female", "데미안", "헤르만 헤세"],
  ["오후세시", 31, "male", "예브게니 오네긴", "알렉산드르 푸시킨"],
  ["책갈피", 24, "female", "아몬드", "손원평"],
  ["느린걸음", 29, "male", "싯다르타", "헤르만 헤세"],
  ["모래", 26, "female", "작별하지 않는다", "한강"],
  ["윤슬", 33, "female", "어린 왕자", "생텍쥐페리"],
  ["밤산책", 28, "male", "노르웨이의 숲", "무라카미 하루키"],
  ["초록", 25, "female", "월든", "헨리 데이비드 소로"],
  ["가을", 35, "male", "죄와 벌", "도스토옙스키"],
  ["연필", 23, "female", "불편한 편의점", "김호연"],
  ["해질녘", 30, "male", "수레바퀴 아래서", "헤르만 헤세"],
  ["물결", 27, "female", "자기만의 방", "버지니아 울프"],
].map(([nickname, age, gender, book, author], i) => ({
  id: `sample-${i}`,
  nickname,
  age,
  gender,
  book,
  author,
  seed: 7919 * (i + 3),
  createdAt: "2026-11-12T09:00:00Z",
}));

/* ───────── 3페이지 ───────── */
function Members() {
  const sectionRef = useRef(null);
  const inView = useInView(sectionRef, { amount: IN_VIEW_AMOUNT });
  const [members, setMembers] = useState(MOCK ? SAMPLE : []);
  const [status, setStatus] = useState(MOCK ? "ready" : "loading");
  const [selected, setSelected] = useState(null);
  const [writing, setWriting] = useState(false);
  const [newId, setNewId] = useState(null);
  const [toast, setToast] = useState(false);

  useEffect(() => {
    if (MOCK) return;
    let alive = true;
    fetch("/api/members")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        if (!alive) return;
        setMembers(data.members ?? []);
        setStatus("ready");
      })
      .catch(() => alive && setStatus("error"));
    return () => {
      alive = false;
    };
  }, []);

  const closeCard = useCallback(() => setSelected(null), []);
  const closeSheet = useCallback(() => setWriting(false), []);

  const handleDone = (member) => {
    setWriting(false);
    // 시트가 닫히고 나서 책이 위에서 떨어져 꽂히도록 살짝 늦게 추가
    setTimeout(() => {
      setNewId(member.id);
      setMembers((list) => [member, ...list]);
      setToast(true);
      setTimeout(() => setToast(false), 2600);
    }, 380);
  };

  return (
    <section id="members" ref={sectionRef} className="members-page">
      <PageLogo visible={inView} />

      <motion.div
        className="members-content"
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: inView ? 1 : 0, y: inView ? 0 : 28 }}
        transition={{ duration: inView ? 1.4 : 0.5, ease: "easeOut" }}
      >
        <SectionTitle visible={inView}>Members</SectionTitle>
        <p className="members-lead">
          좋아하는 책 한 권으로 건네는 가입 인사
          {members.length > 0 && (
            <span className="members-count"> · {members.length}권</span>
          )}
        </p>

        <ul className="shelf" aria-label="우리의 서가">
          {members.map((m) => (
            <Spine
              key={m.id}
              member={m}
              onOpen={setSelected}
              isNew={m.id === newId}
              isOut={m.id === selected?.id}
            />
          ))}

          {/* 빈 자리: 여기에 내 책을 꽂을 수 있음 */}
          <motion.li className="shelf-slot" layout>
            <button
              type="button"
              className="spine spine-empty"
              onClick={() => setWriting(true)}
              aria-label="가입 인사 남기기"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 6v12M6 12h12" />
              </svg>
            </button>
          </motion.li>
        </ul>

        {status === "ready" && members.length === 0 && (
          <p className="members-empty">아직 꽂힌 책이 없어요. 첫 번째 책을 꽂아 주세요.</p>
        )}
        {status === "error" && (
          <p className="members-empty">서가를 불러오지 못했어요. 잠시 후 다시 들러 주세요.</p>
        )}

        <button type="button" className="members-cta" onClick={() => setWriting(true)}>
          <span>내 책 꽂기</span>
          <svg viewBox="0 0 12 12" aria-hidden="true">
            <path d="M4.5 2.5 8 6l-3.5 3.5" />
          </svg>
        </button>

        <AnimatePresence>
          {toast && (
            <motion.p
              className="members-toast"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              서가에 꽂혔어요. 반가워요!
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>

      {createPortal(
        <AnimatePresence>
          {selected && <MemberCard key="card" member={selected} onClose={closeCard} />}
          {writing && <JoinSheet key="sheet" onClose={closeSheet} onDone={handleDone} />}
        </AnimatePresence>,
        document.body,
      )}
    </section>
  );
}

export default Members;
