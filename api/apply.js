import nodemailer from "nodemailer";

// 오픈 이벤트 참여 신청서를 운영진 메일로 보내는 Vercel 서버리스 함수 (POST /api/apply)
//
// Vercel 프로젝트 > Settings > Environment Variables 에 아래 값을 등록해야 합니다.
//   NAVER_SMTP_USER  네이버 아이디 전체 (예: khgty1226@naver.com)
//   NAVER_SMTP_PASS  네이버 메일 SMTP용 비밀번호 (2단계 인증을 쓰면 '애플리케이션 비밀번호')
//   MAIL_TO          (선택) 받는 주소. 없으면 NAVER_SMTP_USER 로 보냄

const GENDER = { female: "여성", male: "남성" };

const escape = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );

const clean = (v, max) => String(v ?? "").trim().slice(0, max);

function validate(body) {
  const data = {
    name: clean(body.name, 20),
    gender: clean(body.gender, 10),
    age: Number(body.age),
    instagram: clean(body.instagram, 31).replace(/^@/, ""),
    phone: clean(body.phone, 13),
    area: clean(body.area, 40),
    agree: body.agree === true,
  };

  if (data.name.length < 2) return [null, "이름을 확인해 주세요."];
  if (!GENDER[data.gender]) return [null, "성별을 선택해 주세요."];
  if (!Number.isInteger(data.age) || data.age < 20 || data.age > 29)
    return [null, "20~29세만 참여할 수 있어요."];
  if (!/^[A-Za-z0-9._]{1,30}$/.test(data.instagram))
    return [null, "인스타그램 아이디를 확인해 주세요."];
  if (!/^01[016789]-\d{3,4}-\d{4}$/.test(data.phone))
    return [null, "연락처를 확인해 주세요."];
  if (data.area.length < 2) return [null, "인터뷰 가능한 동네를 입력해 주세요."];
  if (!data.agree) return [null, "개인정보 수집·이용에 동의해 주세요."];
  return [data, null];
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "허용되지 않은 요청입니다." });
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};

  // 숨김 칸이 채워져 있으면 봇으로 보고 조용히 성공 처리
  if (body.website) return res.status(200).json({ ok: true });

  const [data, error] = validate(body);
  if (error) return res.status(400).json({ message: error });

  const { NAVER_SMTP_USER, NAVER_SMTP_PASS, MAIL_TO } = process.env;
  if (!NAVER_SMTP_USER || !NAVER_SMTP_PASS) {
    console.error("NAVER_SMTP_USER / NAVER_SMTP_PASS 환경 변수가 없습니다.");
    return res.status(500).json({ message: "신청서를 받을 준비가 아직 안 됐어요." });
  }

  const submittedAt = new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
  const rows = [
    ["이름", data.name],
    ["성별", GENDER[data.gender]],
    ["나이", `${data.age}세`],
    ["인스타그램", `@${data.instagram}`],
    ["연락처", data.phone],
    ["인터뷰 가능 동네", data.area],
    ["개인정보 동의", "동의함"],
    ["신청 시각", submittedAt],
  ];

  const text = rows.map(([k, v]) => `${k}: ${v}`).join("\n");
  const html = `
    <div style="font-family:sans-serif;color:#2b2b2b">
      <h2 style="font-size:18px">[별달해 독서클럽] 오픈 이벤트 참여 신청</h2>
      <table style="border-collapse:collapse;font-size:14px">
        ${rows
          .map(
            ([k, v]) =>
              `<tr><td style="padding:6px 16px 6px 0;color:#808080">${escape(k)}</td><td style="padding:6px 0">${escape(v)}</td></tr>`,
          )
          .join("")}
      </table>
      <p style="font-size:12px;color:#999;margin-top:24px">이벤트 종료 후 이 메일은 삭제해 주세요(개인정보 파기).</p>
    </div>`;

  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.naver.com",
      port: 465,
      secure: true,
      auth: { user: NAVER_SMTP_USER, pass: NAVER_SMTP_PASS },
    });

    await transporter.sendMail({
      from: `"별달해 독서클럽 신청서" <${NAVER_SMTP_USER}>`,
      to: MAIL_TO || NAVER_SMTP_USER,
      subject: `[오픈 이벤트 신청] ${data.name} (${data.age}세, ${data.area})`,
      text,
      html,
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("메일 전송 실패:", err);
    return res.status(502).json({ message: "신청서를 보내지 못했어요." });
  }
}
