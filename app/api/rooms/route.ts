import { getDb } from "../../../db/index.ts";

export const runtime = "nodejs";

const ROOM_LIFETIME_MS = 24 * 60 * 60 * 1000;
const VALID_CHANNELS = new Set(["chinese", "western", "kpop", "acg"]);
const ROOM_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const SCORE_KEYS = ["emotion", "energy", "mainstream", "discovery", "nostalgia", "live"] as const;
const DUO_TITLES: Record<(typeof SCORE_KEYS)[number], string> = {
  emotion: "深夜共感电台",
  energy: "高能声场搭档",
  mainstream: "热门副歌共同体",
  discovery: "隐秘声线勘探队",
  nostalgia: "旧日回声收藏组",
  live: "演出前排同盟",
};

type RoomPayload = {
  code?: string;
  channel?: string;
  answers?: Record<string, number>;
  scores?: Record<string, number>;
  mbti?: string;
};

function roomCode() {
  const values = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(values, (value) => ROOM_ALPHABET[value % ROOM_ALPHABET.length]).join("");
}

function normalizeCode(value: string | null | undefined) {
  const code = value?.trim().toUpperCase() ?? "";
  return /^[A-Z2-9]{8}$/.test(code) ? code : "";
}

function validMbti(value: string | undefined) {
  const mbti = value?.trim().toUpperCase() ?? "";
  return /^[EI][SN][TF][JP]$/.test(mbti) ? mbti : null;
}

export function signalValidationError(payload: RoomPayload) {
  if (!payload.answers) return "未收到答题结果，请返回重新完成测试";

  const missingAnswers = Array.from({ length: 16 }, (_, index) => index)
    .filter((index) => !Object.prototype.hasOwnProperty.call(payload.answers, index));
  if (missingAnswers.length) {
    return `有 ${missingAnswers.length} 道题未保存，请返回第 ${missingAnswers[0] + 1} 题继续`;
  }

  const invalidAnswer = Array.from({ length: 16 }, (_, index) => payload.answers?.[index])
    .some((value) => !Number.isInteger(value) || value! < -1 || value! > 5);
  if (invalidAnswer) return "答题结果格式异常，请重新选择对应题目";

  if (!payload.scores) return "个人音乐侧写尚未生成，请返回重试";
  const invalidScore = SCORE_KEYS.some((key) => {
    const value = payload.scores?.[key];
    return typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 100;
  });
  if (invalidScore) return "个人音乐侧写数据不完整，请返回重试";

  return "";
}

let roomsTableReady: Promise<void> | null = null;

async function ensureRoomsTable() {
  if (!roomsTableReady) {
    const db = getDb();
    roomsTableReady = (async () => {
      await db`
      CREATE TABLE IF NOT EXISTS rooms (
        code TEXT PRIMARY KEY NOT NULL,
        channel TEXT NOT NULL,
        status TEXT DEFAULT 'waiting' NOT NULL,
        host_answers TEXT NOT NULL,
        host_scores TEXT NOT NULL,
        host_mbti TEXT,
        guest_answers TEXT,
        guest_scores TEXT,
        guest_mbti TEXT,
        created_at BIGINT NOT NULL,
        expires_at BIGINT NOT NULL,
        completed_at BIGINT
      )
      `;
      await db`CREATE INDEX IF NOT EXISTS rooms_expires_at_idx ON rooms (expires_at)`;
    })().catch((error) => {
      roomsTableReady = null;
      throw error;
    });
  }
  await roomsTableReady;
}

type RoomRecord = {
  code: string;
  channel: string;
  status: string;
  host_answers: string;
  host_scores: string;
  host_mbti: string | null;
  guest_answers: string | null;
  guest_scores: string | null;
  guest_mbti: string | null;
  created_at: number | string;
  expires_at: number | string;
  completed_at: number | string | null;
};

async function findRoom(code: string) {
  const db = getDb();
  const rows = await db`
    SELECT
      code, channel, status,
      host_answers, host_scores, host_mbti,
      guest_answers, guest_scores, guest_mbti,
      created_at, expires_at, completed_at
    FROM rooms
    WHERE code = ${code}
    LIMIT 1
  `;
  return (rows as unknown as RoomRecord[])[0];
}

function publicRoom(room: Awaited<ReturnType<typeof findRoom>>) {
  if (!room) return null;
  const createdAt = Number(room.created_at);
  const expiresAt = Number(room.expires_at);
  const completedAt = room.completed_at === null ? null : Number(room.completed_at);
  const expired = expiresAt <= Date.now();
  return {
    code: room.code,
    channel: room.channel,
    status: expired ? "expired" : room.status,
    createdAt,
    expiresAt,
    completedAt,
  };
}

function parseRecord(source: string | null) {
  if (!source) return {} as Record<string, number>;
  try {
    return JSON.parse(source) as Record<string, number>;
  } catch {
    return {} as Record<string, number>;
  }
}

function resultTier(score: number) {
  if (score >= 95) return { rank: "SSS", title: "灵魂同频体", label: "PERFECT RESONANCE" };
  if (score >= 88) return { rank: "S+", title: "双声道共振者", label: "DEEP RESONANCE" };
  if (score >= 78) return { rank: "S", title: "默契合拍搭档", label: "HIGH SYNC" };
  if (score >= 66) return { rank: "A", title: "互补声场组合", label: "COMPLEMENTARY" };
  return { rank: "B+", title: "异轨探索同盟", label: "CROSSOVER SIGNAL" };
}

function buildReport(room: NonNullable<Awaited<ReturnType<typeof findRoom>>>) {
  if (room.status !== "completed" || !room.guest_answers || !room.guest_scores) return null;

  const hostAnswers = parseRecord(room.host_answers);
  const guestAnswers = parseRecord(room.guest_answers);
  const hostScores = parseRecord(room.host_scores);
  const guestScores = parseRecord(room.guest_scores);

  const comparable = Array.from({ length: 16 }, (_, index) => index).filter(
    (index) => (hostAnswers[index] ?? -1) >= 0 && (guestAnswers[index] ?? -1) >= 0,
  );
  const exactIndices = comparable.filter((index) => hostAnswers[index] === guestAnswers[index]);
  const divergenceIndices = comparable.filter((index) => hostAnswers[index] !== guestAnswers[index]);
  const choiceScore = comparable.length ? Math.round((exactIndices.length / comparable.length) * 100) : 50;

  const dimensionSimilarity = Object.fromEntries(SCORE_KEYS.map((key) => [
    key,
    Math.max(0, 100 - Math.abs((hostScores[key] ?? 50) - (guestScores[key] ?? 50))),
  ])) as Record<(typeof SCORE_KEYS)[number], number>;
  const dimensionScore = Math.round(
    SCORE_KEYS.reduce((sum, key) => sum + dimensionSimilarity[key], 0) / SCORE_KEYS.length,
  );

  const hostRanking = [...SCORE_KEYS].sort((a, b) => (hostScores[b] ?? 0) - (hostScores[a] ?? 0));
  const guestRanking = [...SCORE_KEYS].sort((a, b) => (guestScores[b] ?? 0) - (guestScores[a] ?? 0));
  const dominantScore = hostRanking[0] === guestRanking[0]
    ? 100
    : hostRanking.slice(0, 2).some((key) => guestRanking.slice(0, 2).includes(key))
      ? 75
      : 35;

  const hasMbtiPair = Boolean(room.host_mbti && room.guest_mbti);
  const mbtiScore = hasMbtiPair
    ? Array.from(room.host_mbti!).filter((letter, index) => letter === room.guest_mbti![index]).length * 25
    : null;
  const score = Math.round(hasMbtiPair
    ? choiceScore * .45 + dimensionScore * .35 + dominantScore * .1 + mbtiScore! * .1
    : choiceScore * .5 + dimensionScore * .4 + dominantScore * .1);

  const resonanceKeys = [...SCORE_KEYS]
    .sort((a, b) => {
      const signalA = ((hostScores[a] ?? 50) + (guestScores[a] ?? 50)) / 2 - Math.abs((hostScores[a] ?? 50) - (guestScores[a] ?? 50)) * .35;
      const signalB = ((hostScores[b] ?? 50) + (guestScores[b] ?? 50)) / 2 - Math.abs((hostScores[b] ?? 50) - (guestScores[b] ?? 50)) * .35;
      return signalB - signalA;
    })
    .slice(0, 3);
  const sharedDimension = resonanceKeys[0];

  return {
    algorithmVersion: "1.0",
    score,
    tier: resultTier(score),
    duoTitle: DUO_TITLES[sharedDimension],
    choiceScore,
    dimensionScore,
    dominantScore,
    mbtiScore,
    exactMatches: exactIndices.length,
    comparableAnswers: comparable.length,
    exactIndices,
    divergenceIndices: divergenceIndices.slice(0, 3),
    resonanceKeys,
    dimensionSimilarity,
    host: { answers: hostAnswers, scores: hostScores, mbti: room.host_mbti },
    guest: { answers: guestAnswers, scores: guestScores, mbti: room.guest_mbti },
  };
}

export async function GET(request: Request) {
  try {
    await ensureRoomsTable();
    const code = normalizeCode(new URL(request.url).searchParams.get("code"));
    if (!code) {
      return Response.json({ error: "无效的房间码" }, { status: 400 });
    }

    const room = await findRoom(code);
    if (!room) {
      return Response.json({ error: "房间不存在或已失效" }, { status: 404 });
    }

    return Response.json({ room: publicRoom(room), report: buildReport(room) });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "房间服务暂时不可用" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    await ensureRoomsTable();
    const payload = (await request.json()) as RoomPayload;
    const signalError = signalValidationError(payload);
    if (!payload.channel || !VALID_CHANNELS.has(payload.channel)) {
      return Response.json({ error: "测试频道无效，请重新选择频道" }, { status: 400 });
    }
    if (signalError) {
      return Response.json({ error: signalError }, { status: 400 });
    }

    const now = Date.now();
    const db = getDb();
    await db`DELETE FROM rooms WHERE expires_at < ${now - ROOM_LIFETIME_MS}`;

    for (let attempt = 0; attempt < 4; attempt += 1) {
      const code = roomCode();
      const inserted = await db`
        INSERT INTO rooms (
          code, channel, status, host_answers, host_scores, host_mbti, created_at, expires_at
        ) VALUES (
          ${code},
          ${payload.channel},
          'waiting',
          ${JSON.stringify(payload.answers)},
          ${JSON.stringify(payload.scores)},
          ${validMbti(payload.mbti)},
          ${now},
          ${now + ROOM_LIFETIME_MS}
        )
        ON CONFLICT (code) DO NOTHING
        RETURNING code
      `;

      if ((inserted as unknown as Array<{ code: string }>).length > 0) {
        return Response.json({
          room: {
            code,
            channel: payload.channel,
            status: "waiting",
            createdAt: now,
            expiresAt: now + ROOM_LIFETIME_MS,
          },
        }, { status: 201 });
      }
    }

    return Response.json({ error: "房间创建失败，请重试" }, { status: 503 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "房间创建失败" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    await ensureRoomsTable();
    const payload = (await request.json()) as RoomPayload;
    const code = normalizeCode(payload.code);
    const signalError = signalValidationError(payload);
    if (!code) {
      return Response.json({ error: "房间码无效，请重新打开邀请链接" }, { status: 400 });
    }
    if (signalError) {
      return Response.json({ error: signalError }, { status: 400 });
    }

    const room = await findRoom(code);
    if (!room) {
      return Response.json({ error: "房间不存在或已失效" }, { status: 404 });
    }
    if (Number(room.expires_at) <= Date.now()) {
      return Response.json({ error: "房间已超过 24 小时有效期" }, { status: 410 });
    }

    const completedAt = Date.now();
    const db = getDb();
    await db`
      UPDATE rooms
      SET
        guest_answers = ${JSON.stringify(payload.answers)},
        guest_scores = ${JSON.stringify(payload.scores)},
        guest_mbti = ${validMbti(payload.mbti)},
        status = 'completed',
        completed_at = ${completedAt}
      WHERE code = ${code}
    `;

    const completedRoom = await findRoom(code);
    return Response.json({
      room: {
        ...publicRoom(room),
        status: "completed",
        completedAt,
      },
      report: completedRoom ? buildReport(completedRoom) : null,
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "提交失败" },
      { status: 500 },
    );
  }
}
