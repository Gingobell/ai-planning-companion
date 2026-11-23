import type { Metadata } from "next";
import { Instrument_Sans } from "next/font/google";
import { Sidebar } from "@/components/app-shell/sidebar";
import "./globals.css";

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Planning Companion",
  description: "Plan from a single sentence: capture tasks, agree on deadlines and get specific time blocks.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${instrumentSans.variable} antialiased`}>
      <body>
        <div className="min-h-dvh p-s4">
          <div className="flex min-h-[calc(100dvh-2*var(--s4))] flex-col overflow-hidden rounded-xl border border-line bg-surface wide:flex-row">
            <Sidebar />
            <main className="flex min-w-0 flex-1 flex-col">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
