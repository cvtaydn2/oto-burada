import Link from "next/link";

import { AiStudioDraftHome } from "@/components/ai-studio/ai-studio-draft-home";

export const metadata = {
  title: "AI Studio UI Draft | Oto Burada",
  description:
    "Google AI Studio export taslaginin mevcut Oto Burada projesine uyarlanmis onizlemesi.",
};

export default function UiDraftPage() {
  return (
    <main className="bg-[#f5f7fb]">
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
          <Link href="/" className="transition-colors hover:text-slate-900">
            Ana Sayfa
          </Link>
          <span>/</span>
          <span className="text-slate-900">AI Studio UI Draft</span>
        </div>
      </div>

      <AiStudioDraftHome />
    </main>
  );
}
