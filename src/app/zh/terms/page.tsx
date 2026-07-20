import type { Metadata } from "next";
import Link from "next/link";
import { LegalLayout, H2, P, Ul, ContactMail } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "服务条款",
  description: "免费 AI 画图服务条款",
};

export default function TermsZh() {
  return (
    <LegalLayout
      locale="zh"
      title="服务条款"
      subtitle="使用本免费 AI 图片生成服务，即表示你同意本条款。最近更新：2026 年 7 月。"
    >
      <P>
        另请阅读{" "}
        <Link href="/zh/privacy" className="text-[#8b5cf6] hover:underline">
          隐私政策
        </Link>
        。
      </P>

      <H2>服务说明</H2>
      <P>
        本站提供文生图能力、托管与网页界面，底层可能使用开源权重与第三方推理服务。
        我们提供集成与基础设施，不对开源模型本身主张专有权（以适用开源协议为准）。
      </P>

      <H2>AI 生成内容</H2>
      <P>
        全部输出均为 AI 生成。你应在法律要求时标注 AI 生成，并对使用与传播自行负责。
      </P>

      <H2>你的内容</H2>
      <P>
        在遵守第三方模型许可与适用法律的前提下，你可使用自己生成的图片。我们不加永久水印。
        不对输出的独创性或不侵权作保证。
      </P>

      <H2>用户义务</H2>
      <Ul
        items={[
          "不得侵犯他人知识产权或肖像等合法权益",
          "不得生成违法、有害或欺诈内容",
          "不得生成任何涉及未成年人的性相关内容",
          "不得违反适用的 AI 与内容管理规定",
          "不得绕过频率限制或滥用基础设施",
        ]}
      />

      <H2>公平使用与可用性</H2>
      <P>
        为保持稳定与控制成本，可能实施频率与额度限制。服务按「现状」提供，不保证持续可用。
      </P>

      <H2>责任限制</H2>
      <P>
        在法律允许的最大范围内，我们不对因使用本服务产生的损害承担责任（包括间接或后果性损害）。
        发布前请自行审核提示词与结果。
      </P>

      <H2>配合主管部门</H2>
      <P>在合法程序要求或为保护用户与服务时，我们可能披露相关信息。</P>

      <H2>变更</H2>
      <P>我们可能更新本条款，并更新文首日期。</P>

      <H2>联系</H2>
      <P>
        <ContactMail locale="zh" />
      </P>
    </LegalLayout>
  );
}
