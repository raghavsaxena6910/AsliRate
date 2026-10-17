import type { Metadata } from "next";
import { DemoFlow } from "@/components/demo/demo-flow";
import { SiteFooter, SiteHeader } from "@/components/site/site-chrome";

export const metadata: Metadata = {
  title: "Demo",
  description: "Compare three sample supplier quotes (PDF, WhatsApp and Excel) and see the real landed cost of each.",
};

export default function DemoPage() {
  return (
    <>
      <SiteHeader showDemoCta={false} />
      <main className="flex-1">
        <DemoFlow />
      </main>
      <SiteFooter />
    </>
  );
}
