import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.aslirate.in"),
  title: {
    default: "AsliRate — Compare supplier quotes. Find the real rate.",
    template: "%s | AsliRate",
  },
  description:
    "Upload supplier quotes as PDFs, WhatsApp screenshots or Excel sheets. AsliRate counts GST credit, freight and minimum order to rank suppliers by what each order really costs.",
  openGraph: {
    title: "AsliRate — Compare supplier quotes. Find the real rate.",
    description: "Rank supplier quotes by real landed cost in rupees: GST credit, freight and minimum order included.",
    url: "https://www.aslirate.in",
    siteName: "AsliRate",
    locale: "en_IN",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-IN" className="h-full antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
