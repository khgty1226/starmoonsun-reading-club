import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import starmoonsun from "./assets/starmoonsun_deep.png";
import "./OpenEvent.css";

// 오픈 이벤트 '나에게 꼭 필요한 책은?' 참여 신청서 (/open-event)
// 신청 내용은 /api/apply(Vercel 함수)가 운영진 이메일로 보냅니다.
// VITE_FORM_MOCK=true 로 빌드하면 실제 전송 없이 완료 화면만 보여 줍니다(디자인 확인용).

const EVENT_END = "10월 15일";
const MOCK = import.meta.env.VITE_FORM_MOCK === "true";

const EMPTY = {
  name: "",
  gender: "",
  age: "",
  instagram: "",
  phone: "",
  area: "",
  agree: false,
  website: "", // 스팸 봇 걸러내기용 숨김 칸(사람은 비워 둠)
};

// 010-1234-5678 형태로 자동 하이픈
const formatPhone = (value) => {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length < 4) return d;
  if (d.length < 8) return `${d.slice(0, 3)}-${d.slice(3)}`;
  if (d.length === 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
};

const validate = (f) => {
  const e = {};
  if (f.name.trim().length < 2) e.name = "이름을 2자 이상 입력해 주세요.";
  if (!f.gender) e.gender = "성별을 선택해 주세요.";
  const age = Number(f.age);
  if (!f.age) e.age = "나이를 입력해 주세요.";
  else if (!Number.isInteger(age) || age < 1)
    e.age = "나이를 숫자로 입력해 주세요.";
  if (!f.instagram.replace(/^@/, ""))
    e.instagram = "인스타그램 아이디를 입력해 주세요.";
  else if (!/^[A-Za-z0-9._]{1,30}$/.test(f.instagram.replace(/^@/, "")))
    e.instagram = "영문, 숫자, 마침표(.), 밑줄(_)로 된 아이디를 입력해 주세요.";
  if (!/^01[016789]-\d{3,4}-\d{4}$/.test(f.phone))
    e.phone = "휴대폰 번호를 끝까지 입력해 주세요.";
  if (f.area.trim().length < 2)
    e.area = "인터뷰가 가능한 동네를 입력해 주세요.";
  if (!f.agree) e.agree = "개인정보 수집·이용에 동의해야 신청할 수 있어요.";
  return e;
};

function Field({ id, label, error, hint, children }) {
  return (
    <div className={`oe-field ${error ? "has-error" : ""}`}>
      <label className="oe-label" htmlFor={id}>
        {label}
      </label>
      {children}
      {hint && <p className="oe-hint">{hint}</p>}
      {error && (
        <p className="oe-error" id={`${id}-error`} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/* 1페이지와 같은 방식으로 별·달·해가 그려지듯 나타나는 로고 */
function DrawnLogo({ id, className = "" }) {
  return (
    <svg
      className={`oe-logo ${className}`}
      viewBox="0 0 517 185"
      role="img"
      aria-label="별달해 독서클럽"
    >
      <defs>
        <mask id={id} maskUnits="userSpaceOnUse" x="0" y="0" width="517" height="185">
          <path
            className="oe-pen"
            d="M -20 160 L 40 25 L 100 160 L 160 25 L 220 160 L 280 25 L 340 160 L 400 25 L 460 160 L 520 25 L 580 160"
            pathLength="1"
            fill="none"
            stroke="white"
            strokeWidth="140"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </mask>
      </defs>
      <image href={starmoonsun} x="0" y="0" width="517" height="185" mask={`url(#${id})`} />
    </svg>
  );
}

function OpenEvent() {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle"); // idle | sending | done | failed
  const [failMessage, setFailMessage] = useState("");

  useEffect(() => {
    document.title = "참여 신청 | 별달해 독서클럽";
  }, []);

  const set = (key) => (e) => {
    let value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    if (key === "phone") value = formatPhone(value);
    if (key === "instagram") value = value.replace(/\s/g, "");
    if (key === "age") value = value.replace(/\D/g, "").slice(0, 2);
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((er) => ({ ...er, [key]: undefined }));
  };

  const errProps = (key) =>
    errors[key]
      ? { "aria-invalid": true, "aria-describedby": `${key}-error` }
      : {};

  const handleSubmit = async (e) => {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    const first = Object.keys(found)[0];
    if (first) {
      document.getElementById(first === "gender" ? "gender-f" : first)?.focus();
      return;
    }

    setStatus("sending");
    setFailMessage("");
    try {
      if (MOCK) {
        await new Promise((r) => setTimeout(r, 900));
      } else {
        const res = await fetch("/api/apply", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...form,
            instagram: form.instagram.replace(/^@/, ""),
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || "신청서를 보내지 못했어요.");
        }
      }
      setStatus("done");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setFailMessage(
        `${err.message} 잠시 후 다시 시도하거나 인스타그램 DM으로 알려 주세요.`,
      );
      setStatus("failed");
    }
  };

  return (
    <main className="oe-page">
      <AnimatePresence mode="wait">
        {status === "done" ? (
          <motion.section
            key="done"
            className="oe-done"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <DrawnLogo id="oe-reveal-done" className="is-large" />
            <h1 className="oe-done-title">신청이 접수되었어요</h1>
            <p>
              {form.name.trim()}님, 참여해 주셔서 고맙습니다.
              <br />
              당첨되시면 남겨 주신 연락처로 따로 연락드릴게요.
            </p>
            <a
              className="oe-link"
              href="https://www.instagram.com/starmoonsun.reading.club/"
            >
              @starmoonsun.reading.club
            </a>
          </motion.section>
        ) : (
          <motion.div
            key="form"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <header className="oe-hero">
              <a href="/" className="oe-home" aria-label="별달해 독서클럽 홈으로">
                <DrawnLogo id="oe-reveal" />
              </a>
              <p className="oe-kicker">별달해 독서클럽 오픈 이벤트</p>
              <h1 className="oe-title">
                나에게 꼭 필요한
                <br />
                책은?
              </h1>
              <p className="oe-lead">
                짧은 인터뷰로 당신의 이야기를 듣고, 지금 당신에게 꼭 필요한 책
                한 권을 골라 포장해 선물합니다. 어떤 책일지는 열어 보기 전까지
                비밀이에요.
              </p>

              <dl className="oe-facts">
                <div>
                  <dt>신청 기간</dt>
                  <dd>{EVENT_END}까지</dd>
                </div>
                <div>
                  <dt>참여 대상</dt>
                  <dd>대전에 사는 누구나</dd>
                </div>
                <div>
                  <dt>선물</dt>
                  <dd>블라인드 북 10명(추첨)</dd>
                </div>
              </dl>
            </header>

            <form className="oe-form" onSubmit={handleSubmit} noValidate>
              <h2 className="oe-form-title">참여 신청서</h2>

              <Field id="name" label="이름" error={errors.name}>
                <input
                  id="name"
                  className="oe-input"
                  type="text"
                  autoComplete="name"
                  maxLength={20}
                  value={form.name}
                  onChange={set("name")}
                  {...errProps("name")}
                />
              </Field>

              <div className="oe-row">
                <fieldset className={`oe-field ${errors.gender ? "has-error" : ""}`}>
                  <legend className="oe-label">성별</legend>
                  <div className="oe-choice">
                    {[
                      ["female", "여성", "gender-f"],
                      ["male", "남성", "gender-m"],
                    ].map(([value, text, id]) => (
                      <label key={value} className="oe-chip" htmlFor={id}>
                        <input
                          id={id}
                          type="radio"
                          name="gender"
                          value={value}
                          checked={form.gender === value}
                          onChange={set("gender")}
                        />
                        <span>{text}</span>
                      </label>
                    ))}
                  </div>
                  {errors.gender && (
                    <p className="oe-error" role="alert">
                      {errors.gender}
                    </p>
                  )}
                </fieldset>

                <Field id="age" label="나이" error={errors.age}>
                  <div className="oe-affix">
                    <input
                      id="age"
                      className="oe-input"
                      type="text"
                      inputMode="numeric"
                      value={form.age}
                      onChange={set("age")}
                      {...errProps("age")}
                    />
                    <span className="oe-suffix">세</span>
                  </div>
                </Field>
              </div>

              <Field id="instagram" label="인스타그램 아이디" error={errors.instagram}>
                <div className="oe-affix">
                  <span className="oe-prefix">@</span>
                  <input
                    id="instagram"
                    className="oe-input"
                    type="text"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    maxLength={31}
                    value={form.instagram}
                    onChange={set("instagram")}
                    {...errProps("instagram")}
                  />
                </div>
              </Field>

              <Field id="phone" label="연락처" error={errors.phone}>
                <input
                  id="phone"
                  className="oe-input"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  placeholder="010-0000-0000"
                  value={form.phone}
                  onChange={set("phone")}
                  {...errProps("phone")}
                />
              </Field>

              <Field id="area" label="인터뷰 가능한 동네(동)" error={errors.area}>
                <p className="oe-note">
                  이 이벤트는 당첨자와 15~20분 정도 오프라인 인터뷰를 하고 책을
                  고릅니다. 만나기 편한 동네를 적어 주시면 근처 카페에서 진행할게요.
                </p>
                <input
                  id="area"
                  className="oe-input"
                  type="text"
                  placeholder="예) 둔산동, 궁동"
                  maxLength={40}
                  value={form.area}
                  onChange={set("area")}
                  {...errProps("area")}
                />
              </Field>

              {/* 스팸 방지용. 화면에는 보이지 않습니다 */}
              <div className="oe-trap" aria-hidden="true">
                <label htmlFor="website">website</label>
                <input
                  id="website"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={form.website}
                  onChange={set("website")}
                />
              </div>

              <section className="oe-privacy" aria-labelledby="privacy-title">
                <h3 id="privacy-title">개인정보 수집·이용 안내</h3>
                <dl>
                  <dt>수집 항목</dt>
                  <dd>이름, 성별, 나이, 인스타그램 아이디, 휴대폰 번호, 인터뷰 가능 지역</dd>
                  <dt>이용 목적</dt>
                  <dd>이벤트 참여 확인, 당첨자 추첨과 연락, 인터뷰 일정 조율, 도서 전달</dd>
                  <dt>보유 기간</dt>
                  <dd>
                    이벤트가 끝나면(당첨자 도서 전달 완료 후) 지체 없이 파기합니다.
                    전자 파일과 메일은 복구할 수 없도록 삭제합니다.
                  </dd>
                </dl>
                <p>
                  동의하지 않을 수 있으며, 동의하지 않으면 이벤트에 참여할 수
                  없습니다. 문의는 인스타그램 @starmoonsun.reading.club DM으로
                  받습니다.
                </p>

                <label
                  className={`oe-agree ${errors.agree ? "has-error" : ""}`}
                  htmlFor="agree"
                >
                  <input
                    id="agree"
                    type="checkbox"
                    checked={form.agree}
                    onChange={set("agree")}
                    {...errProps("agree")}
                  />
                  <span>개인정보 수집·이용에 동의합니다</span>
                </label>
                {errors.agree && (
                  <p className="oe-error" id="agree-error" role="alert">
                    {errors.agree}
                  </p>
                )}
              </section>

              {status === "failed" && (
                <p className="oe-fail" role="alert">
                  {failMessage}
                </p>
              )}

              <button
                type="submit"
                className="oe-submit"
                disabled={status === "sending"}
              >
                {status === "sending" ? "보내는 중…" : "참여 신청하기"}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

export default OpenEvent;
