/**
 * In-memory rate limits for /api/generate.
 * Note: serverless 多实例各自计数，不是全局精确；Hobby 下足够挡刷。
 *
 * Env (optional):
 *   RATE_LIMIT_PER_MIN     default 10   — 每 IP 每分钟
 *   RATE_LIMIT_PER_IP_DAY  default 30   — 每 IP 每天
 *   RATE_LIMIT_GLOBAL_DAY  default 500  — 全站每天（单实例近似）
 */

export type RateLimitReason =
  | "ok"
  | "per_minute"
  | "per_ip_day"
  | "global_day";

export interface RateLimitResult {
  ok: boolean;
  reason: RateLimitReason;
  retryAfterSec: number;
  message: string;
  remaining?: {
    perMinute: number;
    perIpDay: number;
    globalDay: number;
  };
}

type Counter = { count: number; resetAt: number };

const perMinute = new Map<string, Counter>();
const perIpDay = new Map<string, Counter>();
let globalDay: Counter = { count: 0, resetAt: 0 };

function envInt(name: string, fallback: number): number {
  const n = parseInt(process.env[name] ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function dayBucketEnd(now = Date.now()): number {
  const d = new Date(now);
  // UTC 日界，避免多时区混乱
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1);
}

function touch(
  map: Map<string, Counter>,
  key: string,
  windowMs: number,
  now: number
): Counter {
  const entry = map.get(key);
  if (!entry || now > entry.resetAt) {
    const next = { count: 0, resetAt: now + windowMs };
    map.set(key, next);
    return next;
  }
  return entry;
}

function cleanup(map: Map<string, Counter>, now: number) {
  if (map.size <= 2000) return;
  for (const [k, v] of map) {
    if (now > v.resetAt) map.delete(k);
  }
}

export function getClientIP(request: {
  headers: { get(name: string): string | null };
}): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

/**
 * 检查并占用 1 次配额。通过后 count++。
 */
export function consumeRateLimit(ip: string): RateLimitResult {
  const now = Date.now();
  const limMin = envInt("RATE_LIMIT_PER_MIN", 10);
  const limIpDay = envInt("RATE_LIMIT_PER_IP_DAY", 30);
  const limGlobal = envInt("RATE_LIMIT_GLOBAL_DAY", 500);

  cleanup(perMinute, now);
  cleanup(perIpDay, now);

  // global day
  if (!globalDay.resetAt || now > globalDay.resetAt) {
    globalDay = { count: 0, resetAt: dayBucketEnd(now) };
  }
  if (globalDay.count >= limGlobal) {
    const retryAfterSec = Math.max(
      1,
      Math.ceil((globalDay.resetAt - now) / 1000)
    );
    return {
      ok: false,
      reason: "global_day",
      retryAfterSec,
      message:
        "今日全站生成额度已用完，请明天再试。 / Daily site quota reached. Try again tomorrow.",
    };
  }

  // per IP day
  const dayKey = ip;
  let ipDay = perIpDay.get(dayKey);
  if (!ipDay || now > ipDay.resetAt) {
    ipDay = { count: 0, resetAt: dayBucketEnd(now) };
    perIpDay.set(dayKey, ipDay);
  }
  if (ipDay.count >= limIpDay) {
    const retryAfterSec = Math.max(
      1,
      Math.ceil((ipDay.resetAt - now) / 1000)
    );
    return {
      ok: false,
      reason: "per_ip_day",
      retryAfterSec,
      message:
        "今日你的生成次数已达上限，请明天再试。 / Your daily generation limit was reached.",
    };
  }

  // per minute
  const minEntry = touch(perMinute, ip, 60_000, now);
  if (minEntry.count >= limMin) {
    const retryAfterSec = Math.max(
      1,
      Math.ceil((minEntry.resetAt - now) / 1000)
    );
    return {
      ok: false,
      reason: "per_minute",
      retryAfterSec,
      message:
        "请求过于频繁，请稍后再试。 / Too many requests. Please wait a moment.",
    };
  }

  // consume
  minEntry.count++;
  ipDay.count++;
  globalDay.count++;

  return {
    ok: true,
    reason: "ok",
    retryAfterSec: 0,
    message: "ok",
    remaining: {
      perMinute: Math.max(0, limMin - minEntry.count),
      perIpDay: Math.max(0, limIpDay - ipDay.count),
      globalDay: Math.max(0, limGlobal - globalDay.count),
    },
  };
}
