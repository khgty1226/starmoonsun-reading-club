import { randomUUID } from "node:crypto";

// 가입 인사(우리의 서가) 게시판 API — Vercel 서버리스 함수
//   GET    /api/members          꽂힌 책(가입 인사) 목록, 최신순
//   POST   /api/members          새 가입 인사 등록
//   DELETE /api/members?id=...   글 삭제 (운영진 전용, x-admin-key 헤더 필요)
//
// 저장소: Upstash Redis (Vercel > Storage > Marketplace 에서 만들고 프로젝트에 연결)
//   연결하면 아래 환경 변수가 자동으로 들어옵니다.
//   KV_REST_API_URL / KV_REST_API_TOKEN  (또는 UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN)
// 운영진 삭제용 비밀번호는 직접 추가합니다.
//   MEMBERS_ADMIN_KEY

const KEY = "members";
const MAX_LIST = 500;
const GENDER = ["female", "male"];

const REDIS_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

async function redis(...command) {
  const res = await fetch(REDIS_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
    body: JSON.stringify(command),
  });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error || `Redis ${res.status}`);
  return data.result;
}

const clean = (v, max) =>
  String(v ?? "")
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);

function validate(body) {
  const data = {
    nickname: clean(body.nickname, 12),
    age: Number(body.age),
    gender: clean(body.gender, 10),
    book: clean(body.book, 40).replace(/^[『「《<"']+|[』」》>"']+$/g, "").trim(),
    author: clean(body.author, 30),
    // 책등 색·크기를 정하는 값 (쓰는 동안 미리 본 모양 그대로 꽂히도록)
    seed: Number.isInteger(body.seed) && body.seed >= 0 && body.seed < 2 ** 31
      ? body.seed
      : Math.floor(Math.random() * 2 ** 31),
  };

  if (data.nickname.length < 1) return [null, "닉네임을 적어 주세요."];
  if (!Number.isInteger(data.age) || data.age < 1 || data.age > 99)
    return [null, "나이를 확인해 주세요."];
  if (!GENDER.includes(data.gender)) return [null, "성별을 골라 주세요."];
  if (data.book.length < 1) return [null, "좋아하는 책을 적어 주세요."];
  return [data, null];
}

const parse = (raw) => {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (!REDIS_URL || !REDIS_TOKEN) {
    console.error("KV_REST_API_URL / KV_REST_API_TOKEN 환경 변수가 없습니다.");
    return res.status(503).json({ message: "게시판을 준비하고 있어요. 조금만 기다려 주세요." });
  }

  try {
    if (req.method === "GET") {
      const list = await redis("LRANGE", KEY, 0, MAX_LIST - 1);
      return res.status(200).json({ members: list.map(parse).filter(Boolean) });
    }

    if (req.method === "POST") {
      const body = typeof req.body === "string" ? parse(req.body) || {} : req.body || {};

      // 숨김 칸이 채워져 있으면 봇으로 보고 조용히 성공 처리
      if (body.website) return res.status(200).json({ ok: true });

      const [data, error] = validate(body);
      if (error) return res.status(400).json({ message: error });

      // 같은 곳에서 연달아 올리는 것 막기 (30초에 한 번)
      const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";
      const ok = await redis("SET", `members:rl:${ip}`, "1", "NX", "EX", 30);
      if (ok === null)
        return res.status(429).json({ message: "잠시 후에 다시 시도해 주세요." });

      const member = { id: randomUUID(), ...data, createdAt: new Date().toISOString() };
      await redis("LPUSH", KEY, JSON.stringify(member));
      await redis("LTRIM", KEY, 0, MAX_LIST - 1);
      return res.status(201).json({ member });
    }

    if (req.method === "DELETE") {
      const adminKey = process.env.MEMBERS_ADMIN_KEY;
      if (!adminKey || req.headers["x-admin-key"] !== adminKey)
        return res.status(401).json({ message: "권한이 없습니다." });

      const id = String(req.query?.id || "");
      const list = await redis("LRANGE", KEY, 0, -1);
      const raw = list.find((r) => parse(r)?.id === id);
      if (!raw) return res.status(404).json({ message: "글을 찾을 수 없습니다." });
      await redis("LREM", KEY, 1, raw);
      return res.status(200).json({ ok: true });
    }

    res.setHeader("Allow", "GET, POST, DELETE");
    return res.status(405).json({ message: "허용되지 않은 요청입니다." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "잠시 문제가 생겼어요. 다시 시도해 주세요." });
  }
}
