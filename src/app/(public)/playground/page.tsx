import type { Metadata } from "next";

import { buildAbsoluteUrl } from "@/features/seo/lib";

import { PlaygroundClientPage } from "./playground-client";

export const metadata: Metadata = {
  title: "AI Playground | OtoBurada",
  description:
    "OtoBurada içinde prompt, SQL ve içerik üretim senaryolarını deneyebileceğiniz dahili playground yüzeyi.",
  alternates: {
    canonical: buildAbsoluteUrl("/playground"),
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function PlaygroundPage() {
  return <PlaygroundClientPage />;
}
