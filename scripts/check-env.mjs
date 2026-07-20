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

const required = [
  "HF_TOKEN",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_NAME",
  "R2_ENDPOINT",
  "R2_PUBLIC_URL",
];

const env = loadEnv(envPath);
let missing = 0;

console.log("=== .env.local 配置检查 ===\n");
for (const key of required) {
  const v = env[key] ?? "";
  const ok = v.length > 0 && !v.includes("your_") && !v.includes("xxxx");
  console.log(`${ok ? "✅" : "❌"} ${key}${ok ? ` = ${mask(key, v)}` : " (未填写)"}`);
  if (!ok) missing++;
}

if (missing > 0) {
  console.log(`\n还有 ${missing} 项未填。按 README 注册后写入 .env.local。`);
  process.exit(1);
}

console.log("\n全部必填项已存在。可选：探测 HuggingFace Token…");

try {
  const res = await fetch("https://huggingface.co/api/whoami-v2", {
    headers: { Authorization: `Bearer ${env.HF_TOKEN}` },
    signal: AbortSignal.timeout(15_000),
  });
  if (res.ok) {
    const data = await res.json();
    console.log(`✅ HF Token 有效，用户: ${data.name || data.fullname || JSON.stringify(data)}`);
  } else {
    console.log(`⚠️ HF Token 探测失败: HTTP ${res.status}`);
  }
} catch (e) {
  console.log(`⚠️ HF 探测网络错误: ${e.message}`);
}

console.log("\nR2 需实际上传才能完整验证；启动: npm run dev");

function mask(key, v) {
  if (key === "R2_BUCKET_NAME" || key === "R2_ENDPOINT" || key === "R2_PUBLIC_URL") {
    return v;
  }
  if (v.length <= 8) return "****";
  return v.slice(0, 4) + "…" + v.slice(-4);
}
