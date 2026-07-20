import type { Metadata } from "next";
import ImageGenerator from "@/components/ImageGenerator";

export const metadata: Metadata = {
  title: "免费 AI 图片生成器 — 文生图 · 无需登录",
  description:
    "免费 AI 文生图工具。输入描述即可生成图片，支持多种宽高比。无需注册，即时生成。",
  keywords: [
    "免费AI图片生成",
    "文生图",
    "AI画图",
    "免费文生图",
    "AI image generator",
    "无需登录",
  ],
  openGraph: {
    title: "免费 AI 图片生成器",
    description: "无需注册，即时文生图。支持 1:1 / 16:9 / 9:16 等比例。",
    locale: "zh_CN",
    type: "website",
  },
};

export default function ZhPage() {
  return <ImageGenerator locale="zh" />;
}
