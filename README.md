# 🎨 AI Free Image Generator

> Z-Image-Turbo / 千问文生图 + Vercel + Cloudflare R2  
> **对用户可免费开放**；**算力按上游计费**（不是无限 $0）

文生图站点。支持两种推理后端，可切换：

| Provider | 环境变量 | 模型 | 说明 |
|----------|----------|------|------|
| **阿里云百炼 DashScope**（推荐） | `DASHSCOPE_API_KEY` | `z-image-turbo` / `qwen-image*` | 官方千问/通义，新人常有免费额度 |
| **HuggingFace → fal-ai** | `HF_TOKEN` | Z-Image-Turbo | Router 透传 fal，有 HF 月赠额度（Free 约 $0.10） |

## ⚡ Quick Start

```bash
git clone <your-repo-url>
cd ai-imagefree
cp .env.example .env.local
# 编辑 .env.local：至少填 R2 + (DASHSCOPE_API_KEY 或 HF_TOKEN)
npm install
npm run check-env
npm run dev
```

Open http://localhost:3000

## 🔑 配置

### 1) 选推理后端

```env
# auto = 有 DASHSCOPE_API_KEY 就用百炼，否则 HF
IMAGE_PROVIDER=auto
```

### 2A) 阿里云百炼（千问 / z-image）— 推荐

1. 打开 https://bailian.console.aliyun.com/  
2. 开通模型服务，创建 **API-KEY**：https://bailian.console.aliyun.com/?apiKey=1  
3. 写入：

```env
IMAGE_PROVIDER=dashscope
DASHSCOPE_API_KEY=sk-xxxxxxxx
# 可选模型：
DASHSCOPE_MODEL=z-image-turbo
# DASHSCOPE_MODEL=qwen-image
# DASHSCOPE_MODEL=qwen-image-plus
# DASHSCOPE_MODEL=qwen-image-2.0
# DASHSCOPE_MODEL=qwen-image-2.0-pro
```

文档：

- Z-Image：https://help.aliyun.com/zh/model-studio/z-image-api-reference  
- 千问文生图：https://help.aliyun.com/zh/model-studio/qwen-image-api  
- 模型价格/新人额度：以百炼控制台与官方「模型价格」页为准  

### 2B) HuggingFace + fal（备选）

1. https://huggingface.co/settings/tokens → Read Token  
2. `HF_TOKEN=hf_...`  
3. 实际路径：`router.huggingface.co/fal-ai/fal-ai/z-image/turbo`（**不是**无限免费 serverless）

### 3) Cloudflare R2

1. https://dash.cloudflare.com → R2 → Create Bucket  
2. 开启 Public Access（r2.dev）  
3. 创建 API Token（Object Read & Write）  

```env
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=...
R2_ENDPOINT=https://<accountid>.r2.cloudflarestorage.com
R2_PUBLIC_URL=https://pub-<hash>.r2.dev
```

## 🚀 Deploy to Vercel

1. 推送 GitHub  
2. https://vercel.com/import  
3. 填环境变量（与 `.env.local` 相同）  
4. Deploy  

线上示例：https://ai-image-free.vercel.app  

**注意：** Vercel Hobby 函数超时约 10s。百炼同步生图偶发更长 → 可能超时；可升级 Pro 或后续改异步。

## 💰 成本说明（重要）

| 组件 | 成本 |
|------|------|
| Vercel Hobby | 免费额度内 ≈ $0 |
| Cloudflare R2 免费档 | ≈ $0 |
| **百炼文生图** | 新人额度 + **按张计费**（用完要充） |
| **HF → fal** | Free 约 **$0.10/月** 赠送，超额需买 credits |

**不是**「整站永久 $0」。对访客可以免费，站长需看账单：

- 百炼控制台用量  
- https://huggingface.co/settings/billing  

## 🏗 Architecture

```
Browser → Vercel (Next.js)
            ├─ IMAGE_PROVIDER=dashscope → 阿里云百炼 (z-image / qwen-image)
            └─ IMAGE_PROVIDER=hf        → HF Router → fal-ai Z-Image-Turbo
                    ↓ image bytes
              Cloudflare R2 → public URL
```

- 切换：环境变量 `IMAGE_PROVIDER` + 对应 Key  
- 响应：`{ imageUrl, seed, provider, model }`

## 📁 Project Structure

```
src/
├── app/
│   ├── api/generate/route.ts   # POST 生图
│   ├── api/health/route.ts     # 健康检查（含当前 provider）
│   └── page.tsx
└── lib/
    ├── generate.ts             # 统一入口 / 切换
    ├── dashscope.ts            # 百炼
    ├── hf.ts                   # HF fal
    ├── r2.ts
    └── dimensions.ts
```

## 🔧 常用命令

```bash
npm run check-env
npm run dev
npm run build
```

## 📝 License

MIT
