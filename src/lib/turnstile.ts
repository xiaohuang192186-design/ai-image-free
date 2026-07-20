/**
 * Cloudflare Turnstile server-side verification.
 * 若未配置 TURNSTILE_SECRET_KEY，则跳过校验（开发/未开通时可用）。
 *
 * 控制台: https://dash.cloudflare.com → Turnstile
 * 环境变量:
 *   NEXT_PUBLIC_TURNSTILE_SITE_KEY  — 前端
 *   TURNSTILE_SECRET_KEY            — 服务端
 */

export interface TurnstileResult {
  ok: boolean;
  skipped: boolean;
  message?: string;
}

export function isTurnstileRequired(): boolean {
  return Boolean(process.env.TURNSTILE_SECRET_KEY?.trim());
}

export async function verifyTurnstile(
  token: string | undefined | null,
  ip?: string
): Promise<TurnstileResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret) {
    return { ok: true, skipped: true };
  }

  if (!token || typeof token !== "string" || token.length < 10) {
    return {
      ok: false,
      skipped: false,
      message:
        "请完成人机验证。 / Human verification required. Please complete the challenge.",
    };
  }

  try {
    const body = new URLSearchParams();
    body.set("secret", secret);
    body.set("response", token);
    if (ip && ip !== "unknown") body.set("remoteip", ip);

    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
        signal: AbortSignal.timeout(10_000),
      }
    );

    const data = (await res.json()) as {
      success?: boolean;
      "error-codes"?: string[];
    };

    if (data.success) {
      return { ok: true, skipped: false };
    }

    return {
      ok: false,
      skipped: false,
      message:
        "人机验证失败，请刷新页面重试。 / Human verification failed. Please refresh and try again.",
    };
  } catch {
    // 验证服务不可达时：生产可选择失败关闭；此处为避免误伤，记录并放行可选
    // 更安全默认：失败则拒绝
    return {
      ok: false,
      skipped: false,
      message:
        "验证服务暂时不可用，请稍后重试。 / Verification service unavailable. Try again later.",
    };
  }
}
