import type { Metadata } from "next";
import { LegalLayout, H2, P, Ul, ContactMail } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "隐私政策",
  description: "免费 AI 画图服务隐私政策",
};

export default function PrivacyZh() {
  return (
    <LegalLayout
      locale="zh"
      title="隐私政策"
      subtitle="说明我们收集哪些信息、如何使用，以及你的选择。生效日期：2026-07-21。"
    >
      <div className="grid sm:grid-cols-3 gap-3 not-prose mb-6">
        {[
          ["无需账号", "使用工具不必注册或填写支付信息。"],
          ["运营数据", "提示词、结果与技术日志如下所述处理。"],
          ["可选广告", "仅在运营方开启广告/统计时涉及。"],
        ].map(([t, d]) => (
          <div key={t} className="glass-card p-3 rounded-xl">
            <p className="text-white text-sm font-medium">{t}</p>
            <p className="text-[#7a7a7a] text-xs mt-1">{d}</p>
          </div>
        ))}
      </div>

      <H2>我们收集的信息</H2>
      <P>
        使用服务时，我们可能处理：你提交的文字提示词；生成的图片结果；技术请求数据（IP
        地址、浏览器类型、页面 URL）；以及使用事件（访问页面、点击功能）。使用生成器
        无需账号、姓名、邮箱或银行卡。
      </P>

      <H2>我们如何使用信息</H2>
      <Ul
        items={[
          "提供文生图并返回结果",
          "防滥用与频率限制",
          "排查错误、提升稳定性",
          "了解整体使用情况（若开启分析）",
          "支持可选广告（若开启 AdSense）",
        ]}
      />
      <P>我们不会用你的提示词或图片训练自有基础模型。</P>

      <H2>广告与 Cookie</H2>
      <P>
        若启用 Google AdSense，Google 及合作方可能使用 Cookie、设备标识或与 IP 相关的信号
        投放与衡量广告。可在{" "}
        <a className="text-[#8b5cf6] hover:underline" href="https://adssettings.google.com/">
          Google 广告设置
        </a>{" "}
        管理个性化广告。
      </P>

      <H2>分析</H2>
      <P>
        若启用 Google Analytics，可能处理设备信息、由 IP 推断的大致位置、页面 URL 与交互事件。
      </P>

      <H2>提示词、结果与留存</H2>
      <P>
        提示词与结果会经第三方推理服务处理，并可能存入对象存储（如 Cloudflare R2）以便下载。
        限流计数为短期运营数据。请勿提交机密、医疗或其他敏感个人信息。
      </P>

      <H2>服务提供商</H2>
      <P>
        数据可能由托管（如 Vercel）、存储/CDN（如 R2）、AI 推理服务商，以及可选的 Google
        广告/分析处理。提供商可能在境外处理数据。依法要求或为保护服务与用户时，我们可能披露信息。
      </P>

      <H2>安全</H2>
      <P>我们采取合理措施（如 HTTPS、访问控制）。任何网络系统都无法保证绝对安全。</P>

      <H2>儿童隐私</H2>
      <P>
        本服务不面向 13 岁以下儿童。我们不会故意收集 13 岁以下儿童的个人信息。若你认为发生了此类提交，请联系我们。
      </P>

      <H2>政策变更</H2>
      <P>服务或法律要求变化时我们可能更新本政策，并在本页更新日期。</P>

      <H2>联系我们</H2>
      <P>
        隐私相关问题：<ContactMail locale="zh" />
      </P>
    </LegalLayout>
  );
}
