/**
 * 检查 .env.local 是否已填齐，并做最小连通性探测。
 * 用法: node scripts/check-env.mjs
 */
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = resolve(root, ".env.local");

function loadEnv(path) {
  if (!existsSync(path)) {
    console.error("❌ 找不到 .env.local，请先复制/填写配置。");
    process.exit(1);
  }
  const env = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    env[k] = v;
  }
  return env;
}

function filled(v) {
  return (
    typeof v === "string" &&
    v.length > 0 &&
    !v.includes("your_") &&
    !v.includes("xxxx") &&
    !v.includes("sk-xxxxxxxx")
  );
}

function mask(key, v) {
  if (
    key === "R2_BUCKET_NAME" ||
    key === "R2_ENDPOINT" ||
    key === "R2_PUBLIC_URL" ||
    key === "IMAGE_PROVIDER" ||
    key === "DASHSCOPE_MODEL"
  ) {
    return v;
  }
  if (v.length <= 8) return "****";
  return v.slice(0, 4) + "…" + v.slice(-4);
}

const env = loadEnv(envPath);
const providerPref = (env.IMAGE_PROVIDER || "auto").toLowerCase();
const hasDs = filled(env.DASHSCOPE_API_KEY);
const hasHf = filled(env.HF_TOKEN);
const resolved =
  providerPref === "dashscope" || providerPref === "bailian" || providerPref === "aliyun"
    ? "dashscope"
    : providerPref === "hf" || providerPref === "huggingface" || providerPref === "fal"
      ? "hf"
      : hasDs
        ? "dashscope"
        : "hf";

console.log("=== .env.local 配置检查 ===\n");
console.log(`IMAGE_PROVIDER=${providerPref || "auto"} → 实际将使用: ${resolved}\n`);

const r2Keys = [
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_NAME",
  "R2_ENDPOINT",
  "R2_PUBLIC_URL",
];

let missing = 0;

for (const key of r2Keys) {
  const v = env[key] ?? "";
  const ok = filled(v);
  console.log(`${ok ? "✅" : "❌"} ${key}${ok ? ` = ${mask(key, v)}` : " (未填写)"}`);
  if (!ok) missing++;
}

if (resolved === "dashscope") {
  const ok = hasDs;
  console.log(
    `${ok ? "✅" : "❌"} DASHSCOPE_API_KEY${ok ? ` = ${mask("DASHSCOPE_API_KEY", env.DASHSCOPE_API_KEY)}` : " (未填写)"}`
  );
  if (!ok) missing++;
  console.log(
    `ℹ️  DASHSCOPE_MODEL = ${env.DASHSCOPE_MODEL || "z-image-turbo (default)"}`
  );
} else {
  const ok = hasHf;
  console.log(
    `${ok ? "✅" : "❌"} HF_TOKEN${ok ? ` = ${mask("HF_TOKEN", env.HF_TOKEN)}` : " (未填写)"}`
  );
  if (!ok) missing++;
  if (hasDs) {
    console.log(
      `ℹ️  已配置 DASHSCOPE_API_KEY，但 IMAGE_PROVIDER=${providerPref} 强制 hf；改 auto/dashscope 可切百炼`
    );
  }
}

if (missing > 0) {
  console.log(`\n还有 ${missing} 项未填。`);
  process.exit(1);
}

console.log("\n探测…");

if (hasHf) {
  try {
    const res = await fetch("https://huggingface.co/api/whoami-v2", {
      headers: { Authorization: `Bearer ${env.HF_TOKEN}` },
      signal: AbortSignal.timeout(15_000),
    });
    if (res.ok) {
      const data = await res.json();
      console.log(`✅ HF Token 有效: ${data.name || data.fullname || "?"}`);
    } else {
      console.log(`⚠️ HF Token 探测失败: HTTP ${res.status}`);
    }
  } catch (e) {
    console.log(`⚠️ HF 探测网络错误: ${e.message}`);
  }
}

if (hasDs) {
  console.log(
    `ℹ️  DashScope Key 已配置（模型: ${env.DASHSCOPE_MODEL || "z-image-turbo"}）。完整验证请实际生图。`
  );
  console.log(
    "   获取 Key: https://bailian.console.aliyun.com/?apiKey=1"
  );
}

console.log("\nR2 需实际上传验证；启动: npm run dev");
