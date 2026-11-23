import type { Metadata } from "next";
import { Instrument_Sans } from "next/font/google";
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
        <div className="min-h-dvh p-s4">{children}</div>
      </body>
    </html>
  );
}
